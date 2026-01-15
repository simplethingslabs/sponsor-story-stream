# Phase F: Backend Setup & API Implementation Guide

This document provides complete instructions for setting up the backend infrastructure for the Sponsor Management Portal using Express.js, PostgreSQL, Cloudinary, and Resend, deployed on Render.

---

## Table of Contents

1. [F1: PostgreSQL Database Schema](#f1-postgresql-database-schema)
2. [F2: Node.js/Express API Boilerplate](#f2-nodejsexpress-api-boilerplate)
3. [F3: File Upload & Storage (Cloudinary)](#f3-file-upload--storage-cloudinary)
4. [F4: Render Deployment Guide](#f4-render-deployment-guide)
5. [F5: Email Integration (Resend)](#f5-email-integration-resend)
6. [F6: API Integration Helpers](#f6-api-integration-helpers)
7. [F7: Audit Logging](#f7-audit-logging)
8. [F8: Soft Deletes](#f8-soft-deletes)
9. [F9: Data Validation](#f9-data-validation)
10. [F10: Batch Operations](#f10-batch-operations)

---

## F1: PostgreSQL Database Schema

### Prerequisites
- PostgreSQL 15+ installed locally or access to a cloud PostgreSQL instance
- A database client (pgAdmin, DBeaver, or psql CLI)

### Migration Script

Create a file `migrations/001_initial_schema.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'sponsor' CHECK (role IN ('super_admin', 'admin', 'teacher', 'sponsor')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- CHILDREN TABLE
-- ============================================
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    grade VARCHAR(50) NOT NULL,
    photo_url TEXT,
    story TEXT,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'withdrawn')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

CREATE INDEX idx_children_status ON children(status);
CREATE INDEX idx_children_grade ON children(grade);
CREATE INDEX idx_children_deleted_at ON children(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_children_name ON children(first_name, last_name);

-- ============================================
-- SPONSORSHIPS TABLE
-- ============================================
CREATE TABLE sponsorships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sponsor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
    CONSTRAINT unique_active_sponsorship UNIQUE (sponsor_id, child_id, status)
);

CREATE INDEX idx_sponsorships_sponsor ON sponsorships(sponsor_id);
CREATE INDEX idx_sponsorships_child ON sponsorships(child_id);
CREATE INDEX idx_sponsorships_status ON sponsorships(status);
CREATE INDEX idx_sponsorships_deleted_at ON sponsorships(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- PROGRESS REPORTS TABLE
-- ============================================
CREATE TABLE progress_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id),
    quarter VARCHAR(10) NOT NULL CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
    
    -- Academic subjects (JSON for flexibility)
    subjects JSONB DEFAULT '[]'::jsonb,
    
    -- Narrative fields
    growth_narrative TEXT,
    activities TEXT,
    teacher_observations TEXT,
    goals_next_quarter TEXT,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
    
    CONSTRAINT unique_report_per_quarter UNIQUE (child_id, quarter, year)
);

CREATE INDEX idx_reports_child ON progress_reports(child_id);
CREATE INDEX idx_reports_teacher ON progress_reports(teacher_id);
CREATE INDEX idx_reports_status ON progress_reports(status);
CREATE INDEX idx_reports_quarter_year ON progress_reports(year, quarter);
CREATE INDEX idx_reports_deleted_at ON progress_reports(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- REPORT MEDIA TABLE
-- ============================================
CREATE TABLE report_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES progress_reports(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'video', 'audio', 'document')),
    url TEXT NOT NULL,
    cloudinary_public_id VARCHAR(255),
    caption TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    file_size INTEGER, -- in bytes
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_report_media_report ON report_media(report_id);
CREATE INDEX idx_report_media_type ON report_media(type);

-- ============================================
-- NEWSLETTERS TABLE
-- ============================================
CREATE TABLE newsletters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    cloudinary_public_id VARCHAR(255),
    thumbnail_url TEXT,
    published_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

CREATE INDEX idx_newsletters_published_date ON newsletters(published_date DESC);
CREATE INDEX idx_newsletters_deleted_at ON newsletters(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- EVENTS TABLE
-- ============================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

CREATE INDEX idx_events_date ON events(event_date DESC);
CREATE INDEX idx_events_deleted_at ON events(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- EVENT MEDIA TABLE
-- ============================================
CREATE TABLE event_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'video')),
    url TEXT NOT NULL,
    cloudinary_public_id VARCHAR(255),
    caption TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_media_event ON event_media(event_id);

-- ============================================
-- PENDING REGISTRATIONS TABLE
-- ============================================
CREATE TABLE pending_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    message TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pending_registrations_status ON pending_registrations(status);
CREATE INDEX idx_pending_registrations_email ON pending_registrations(email);

-- ============================================
-- SPONSOR INVITATIONS TABLE
-- ============================================
CREATE TABLE sponsor_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    invited_by UUID NOT NULL REFERENCES users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invitations_email ON sponsor_invitations(email);
CREATE INDEX idx_invitations_token ON sponsor_invitations(token);
CREATE INDEX idx_invitations_status ON sponsor_invitations(status);
CREATE INDEX idx_invitations_expires ON sponsor_invitations(expires_at);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- AUDIT LOGS TABLE (F7)
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255), -- Stored separately in case user is deleted
    action VARCHAR(50) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT')),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- PASSWORD RESET TOKENS TABLE
-- ============================================
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id);

-- ============================================
-- REFRESH TOKENS TABLE
-- ============================================
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_refresh_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsorships_updated_at BEFORE UPDATE ON sponsorships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_reports_updated_at BEFORE UPDATE ON progress_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletters_updated_at BEFORE UPDATE ON newsletters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pending_registrations_updated_at BEFORE UPDATE ON pending_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsor_invitations_updated_at BEFORE UPDATE ON sponsor_invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA (Optional - for development)
-- ============================================
-- Create a super admin user (password: admin123)
-- Password hash generated with bcrypt, 10 rounds
INSERT INTO users (email, password_hash, full_name, role, status, email_verified_at)
VALUES (
    'admin@sponsorportal.com',
    '$2b$10$YourHashedPasswordHere', -- Replace with actual bcrypt hash
    'Super Admin',
    'super_admin',
    'active',
    NOW()
);
```

### Running Migrations

```bash
# Using psql
psql -h localhost -U your_user -d your_database -f migrations/001_initial_schema.sql

# Using a migration tool like node-pg-migrate
npm install node-pg-migrate
npx node-pg-migrate up
```

---

## F2: Node.js/Express API Boilerplate

### Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── cloudinary.ts
│   │   └── resend.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── childrenController.ts
│   │   ├── sponsorsController.ts
│   │   ├── sponsorshipsController.ts
│   │   ├── reportsController.ts
│   │   ├── newslettersController.ts
│   │   ├── eventsController.ts
│   │   ├── invitationsController.ts
│   │   ├── registrationsController.ts
│   │   ├── notificationsController.ts
│   │   ├── auditController.ts
│   │   └── uploadController.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── authorize.ts
│   │   ├── validate.ts
│   │   ├── audit.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Child.ts
│   │   ├── Sponsorship.ts
│   │   ├── ProgressReport.ts
│   │   ├── Newsletter.ts
│   │   ├── Event.ts
│   │   └── ...
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── children.ts
│   │   ├── sponsors.ts
│   │   ├── sponsorships.ts
│   │   ├── reports.ts
│   │   ├── newsletters.ts
│   │   ├── events.ts
│   │   ├── invitations.ts
│   │   ├── registrations.ts
│   │   ├── notifications.ts
│   │   ├── audit.ts
│   │   └── upload.ts
│   ├── schemas/
│   │   ├── auth.ts
│   │   ├── child.ts
│   │   ├── report.ts
│   │   └── ...
│   ├── services/
│   │   ├── emailService.ts
│   │   ├── uploadService.ts
│   │   └── notificationService.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── helpers.ts
│   │   └── constants.ts
│   ├── types/
│   │   └── index.ts
│   └── app.ts
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### Package.json

```json
{
  "name": "sponsor-portal-api",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "migrate": "node-pg-migrate up",
    "migrate:down": "node-pg-migrate down"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "compression": "^1.7.4",
    "pg": "^8.11.3",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.22.4",
    "cloudinary": "^1.41.0",
    "multer": "^1.4.5-lts.1",
    "resend": "^2.0.0",
    "uuid": "^9.0.1",
    "express-rate-limit": "^7.1.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "@types/morgan": "^1.9.9",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "@types/uuid": "^9.0.7",
    "@types/node": "^20.10.5",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "node-pg-migrate": "^6.2.2"
  }
}
```

### Main Application (src/app.ts)

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from 'dotenv';

import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

### Database Configuration (src/config/database.ts)

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text: text.substring(0, 50), duration, rows: res.rowCount });
  return res;
};

export const getClient = () => pool.connect();

export default pool;
```

### Authentication Middleware (src/middleware/auth.ts)

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    full_name: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    // Fetch user from database
    const result = await query(
      'SELECT id, email, role, full_name FROM users WHERE id = $1 AND deleted_at IS NULL',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next(error);
  }
};
```

### Authorization Middleware (src/middleware/authorize.ts)

```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

type Role = 'super_admin' | 'admin' | 'teacher' | 'sponsor';

export const authorize = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    next();
  };
};

// Shorthand helpers
export const adminOnly = authorize('super_admin', 'admin');
export const teacherOrAdmin = authorize('super_admin', 'admin', 'teacher');
export const allRoles = authorize('super_admin', 'admin', 'teacher', 'sponsor');
```

### Validation Middleware (src/middleware/validate.ts)

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};
```

### Routes Index (src/routes/index.ts)

```typescript
import { Router } from 'express';
import authRoutes from './auth';
import childrenRoutes from './children';
import sponsorsRoutes from './sponsors';
import sponsorshipsRoutes from './sponsorships';
import reportsRoutes from './reports';
import newslettersRoutes from './newsletters';
import eventsRoutes from './events';
import invitationsRoutes from './invitations';
import registrationsRoutes from './registrations';
import notificationsRoutes from './notifications';
import auditRoutes from './audit';
import uploadRoutes from './upload';

const router = Router();

router.use('/auth', authRoutes);
router.use('/children', childrenRoutes);
router.use('/sponsors', sponsorsRoutes);
router.use('/sponsorships', sponsorshipsRoutes);
router.use('/reports', reportsRoutes);
router.use('/newsletters', newslettersRoutes);
router.use('/events', eventsRoutes);
router.use('/invitations', invitationsRoutes);
router.use('/registrations', registrationsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/audit', auditRoutes);
router.use('/upload', uploadRoutes);

export default router;
```

### Example Route: Children (src/routes/children.ts)

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import { auditLog } from '../middleware/audit';
import { childSchema, childUpdateSchema } from '../schemas/child';
import * as childrenController from '../controllers/childrenController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/children - List all children (with filters)
router.get('/', childrenController.list);

// GET /api/children/:id - Get single child
router.get('/:id', childrenController.getById);

// POST /api/children - Create child (admin/teacher only)
router.post(
  '/',
  authorize('super_admin', 'admin', 'teacher'),
  validate(childSchema),
  auditLog('children'),
  childrenController.create
);

// PUT /api/children/:id - Update child (admin/teacher only)
router.put(
  '/:id',
  authorize('super_admin', 'admin', 'teacher'),
  validate(childUpdateSchema),
  auditLog('children'),
  childrenController.update
);

// DELETE /api/children/:id - Soft delete child (admin only)
router.delete(
  '/:id',
  authorize('super_admin', 'admin'),
  auditLog('children'),
  childrenController.remove
);

// POST /api/children/:id/restore - Restore soft-deleted child
router.post(
  '/:id/restore',
  authorize('super_admin', 'admin'),
  auditLog('children'),
  childrenController.restore
);

// POST /api/children/batch - Batch operations
router.post(
  '/batch',
  authorize('super_admin', 'admin'),
  childrenController.batch
);

export default router;
```

### Example Controller: Children (src/controllers/childrenController.ts)

```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

// List children with filters and pagination
export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      grade, 
      search,
      includeDeleted = false 
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    const params: any[] = [];
    let whereClause = 'WHERE 1=1';
    
    // Only show non-deleted by default
    if (!includeDeleted || req.user?.role === 'sponsor') {
      whereClause += ' AND deleted_at IS NULL';
    }
    
    if (status) {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }
    
    if (grade) {
      params.push(grade);
      whereClause += ` AND grade = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (first_name ILIKE $${params.length} OR last_name ILIKE $${params.length})`;
    }
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM children ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated results
    params.push(Number(limit), offset);
    const result = await query(
      `SELECT * FROM children ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    
    res.json({
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
        hasMore: offset + result.rows.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get single child by ID
export const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT * FROM children WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    // Get sponsorship info
    const sponsorships = await query(
      `SELECT s.*, u.full_name as sponsor_name, u.email as sponsor_email
       FROM sponsorships s
       JOIN users u ON s.sponsor_id = u.id
       WHERE s.child_id = $1 AND s.status = 'active' AND s.deleted_at IS NULL`,
      [id]
    );
    
    res.json({
      ...result.rows[0],
      sponsors: sponsorships.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Create new child
export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { first_name, last_name, date_of_birth, grade, photo_url, story, enrollment_date } = req.body;
    const id = uuidv4();
    
    const result = await query(
      `INSERT INTO children (id, first_name, last_name, date_of_birth, grade, photo_url, story, enrollment_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, first_name, last_name, date_of_birth, grade, photo_url, story, enrollment_date || new Date(), req.user?.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Update child
export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic update query
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ');
    
    const result = await query(
      `UPDATE children SET ${setClause} WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      [id, ...values]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Soft delete child
export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'UPDATE children SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found' });
    }
    
    res.json({ message: 'Child deleted successfully', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Restore soft-deleted child
export const restore = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'UPDATE children SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Child not found or not deleted' });
    }
    
    res.json({ message: 'Child restored successfully', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Batch operations
export const batch = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { operation, items } = req.body;
    const results: { id: string; success: boolean; error?: string }[] = [];
    
    for (const item of items) {
      try {
        switch (operation) {
          case 'create':
            const createResult = await query(
              `INSERT INTO children (id, first_name, last_name, date_of_birth, grade, created_by)
               VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
              [uuidv4(), item.first_name, item.last_name, item.date_of_birth, item.grade, req.user?.id]
            );
            results.push({ id: createResult.rows[0].id, success: true });
            break;
            
          case 'delete':
            await query('UPDATE children SET deleted_at = NOW() WHERE id = $1', [item.id]);
            results.push({ id: item.id, success: true });
            break;
            
          default:
            results.push({ id: item.id || 'unknown', success: false, error: 'Invalid operation' });
        }
      } catch (error) {
        results.push({ 
          id: item.id || 'unknown', 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    res.json({
      results,
      summary: {
        total: items.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
    });
  } catch (error) {
    next(error);
  }
};
```

---

## F3: File Upload & Storage (Cloudinary)

### Cloudinary Configuration (src/config/cloudinary.ts)

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

### Upload Service (src/services/uploadService.ts)

```typescript
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
}

// Upload image with transformations
export const uploadImage = async (
  buffer: Buffer,
  folder: string = 'sponsor-portal'
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        }
      }
    );

    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);
  });
};

// Upload document (PDF, etc.)
export const uploadDocument = async (
  buffer: Buffer,
  folder: string = 'sponsor-portal/documents',
  originalFilename?: string
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'raw',
        public_id: originalFilename?.replace(/\.[^/.]+$/, ''), // Remove extension
      },
      (error, result) => {
        if (error) reject(error);
        else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format || 'pdf',
            bytes: result.bytes,
          });
        }
      }
    );

    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);
  });
};

// Upload video
export const uploadVideo = async (
  buffer: Buffer,
  folder: string = 'sponsor-portal/videos'
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'video',
        eager: [
          { streaming_profile: 'auto', format: 'm3u8' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        }
      }
    );

    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);
  });
};

// Delete file
export const deleteFile = async (publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image') => {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

// Generate thumbnail for child profile
export const getChildPhotoUrl = (publicId: string, size: number = 200) => {
  return cloudinary.url(publicId, {
    transformation: [
      { width: size, height: size, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });
};
```

### Upload Routes (src/routes/upload.ts)

```typescript
import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import * as uploadController from '../controllers/uploadController';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'video/mp4',
      'video/quicktime',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

router.use(authenticate);

// Upload image
router.post(
  '/image',
  authorize('super_admin', 'admin', 'teacher'),
  upload.single('file'),
  uploadController.uploadImage
);

// Upload document
router.post(
  '/document',
  authorize('super_admin', 'admin', 'teacher'),
  upload.single('file'),
  uploadController.uploadDocument
);

// Upload video
router.post(
  '/video',
  authorize('super_admin', 'admin', 'teacher'),
  upload.single('file'),
  uploadController.uploadVideo
);

// Delete file
router.delete(
  '/:publicId',
  authorize('super_admin', 'admin'),
  uploadController.deleteFile
);

export default router;
```

### Upload Controller (src/controllers/uploadController.ts)

```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as uploadService from '../services/uploadService';

export const uploadImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const folder = req.body.folder || 'sponsor-portal/images';
    const result = await uploadService.uploadImage(req.file.buffer, folder);

    res.json({
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const folder = req.body.folder || 'sponsor-portal/documents';
    const result = await uploadService.uploadDocument(
      req.file.buffer,
      folder,
      req.file.originalname
    );

    res.json({
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadVideo = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const folder = req.body.folder || 'sponsor-portal/videos';
    const result = await uploadService.uploadVideo(req.file.buffer, folder);

    res.json({
      url: result.url,
      publicId: result.publicId,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { publicId } = req.params;
    const { resourceType = 'image' } = req.query;

    await uploadService.deleteFile(publicId, resourceType as 'image' | 'video' | 'raw');

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    next(error);
  }
};
```

---

## F4: Render Deployment Guide

### Prerequisites

1. Create a [Render](https://render.com) account
2. Connect your GitHub repository

### Step 1: Create PostgreSQL Database

1. Go to Render Dashboard → **New** → **PostgreSQL**
2. Configure:
   - **Name**: `sponsor-portal-db`
   - **Database**: `sponsor_portal`
   - **User**: Leave default or customize
   - **Region**: Choose closest to your users
   - **Plan**: Free tier for development, upgrade for production
3. Click **Create Database**
4. Copy the **Internal Database URL** for use in your web service

### Step 2: Deploy the Express API

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `sponsor-portal-api`
   - **Root Directory**: `backend` (if in subdirectory)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free tier or Starter

### Step 3: Environment Variables

Add these environment variables in Render:

```
NODE_ENV=production
PORT=10000

# Database (use Internal URL from Render PostgreSQL)
DATABASE_URL=postgres://user:password@host:5432/sponsor_portal

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=https://your-lovable-app.lovable.app

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

### Step 4: Run Database Migrations

Option A: Using Render Shell
1. Go to your web service → **Shell**
2. Run: `npm run migrate`

Option B: Connect directly to database
```bash
psql $DATABASE_URL -f migrations/001_initial_schema.sql
```

### Step 5: Configure Health Checks

Render will automatically use the `/health` endpoint for health checks.

### Step 6: Set Up Custom Domain (Optional)

1. Go to your web service → **Settings** → **Custom Domains**
2. Add your domain (e.g., `api.yourdomain.com`)
3. Configure DNS with the provided CNAME record

### Production Checklist

- [ ] Database migrations applied
- [ ] All environment variables set
- [ ] CORS configured for production frontend URL
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Health checks working
- [ ] SSL certificate active (automatic on Render)

---

## F5: Email Integration (Resend)

### Resend Configuration (src/config/resend.ts)

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default resend;
```

### Email Service (src/services/emailService.ts)

```typescript
import resend from '../config/resend';

const FROM_EMAIL = process.env.EMAIL_FROM || 'Sponsor Portal <noreply@yourdomain.com>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

// Registration submitted
export const sendRegistrationSubmitted = async (
  email: string,
  fullName: string
): Promise<EmailResult> => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Registration Received - Sponsor Portal',
      html: `
        <h1>Thank you for registering, ${fullName}!</h1>
        <p>We have received your registration request and it is currently under review.</p>
        <p>You will receive an email notification once your account has been approved.</p>
        <p>This process typically takes 1-2 business days.</p>
        <br>
        <p>Best regards,<br>The Sponsor Portal Team</p>
      `,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Registration approved
export const sendRegistrationApproved = async (
  email: string,
  fullName: string,
  tempPassword: string
): Promise<EmailResult> => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to Sponsor Portal - Account Approved!',
      html: `
        <h1>Congratulations, ${fullName}!</h1>
        <p>Your account has been approved. You can now log in to the Sponsor Portal.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Your login credentials:</strong></p>
          <p>Email: ${email}</p>
          <p>Temporary Password: <code>${tempPassword}</code></p>
        </div>
        
        <p><strong>Please change your password after your first login.</strong></p>
        
        <a href="${FRONTEND_URL}/login" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Log In Now
        </a>
        
        <br><br>
        <p>Best regards,<br>The Sponsor Portal Team</p>
      `,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Registration rejected
export const sendRegistrationRejected = async (
  email: string,
  fullName: string,
  reason?: string
): Promise<EmailResult> => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Sponsor Portal - Registration Update',
      html: `
        <h1>Hello ${fullName},</h1>
        <p>Thank you for your interest in becoming a sponsor.</p>
        <p>Unfortunately, we are unable to approve your registration at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>If you have any questions, please contact our support team.</p>
        <br>
        <p>Best regards,<br>The Sponsor Portal Team</p>
      `,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Sponsor invitation
export const sendSponsorInvitation = async (
  email: string,
  inviterName: string,
  inviteToken: string
): Promise<EmailResult> => {
  try {
    const inviteUrl = `${FRONTEND_URL}/register?invite=${inviteToken}`;
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${inviterName} has invited you to become a sponsor!`,
      html: `
        <h1>You're Invited!</h1>
        <p>${inviterName} has invited you to join the Sponsor Portal and make a difference in a child's life.</p>
        
        <p>As a sponsor, you'll be able to:</p>
        <ul>
          <li>View progress reports for your sponsored children</li>
          <li>Receive updates about school events and activities</li>
          <li>Stay connected with the school community</li>
        </ul>
        
        <a href="${inviteUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Accept Invitation
        </a>
        
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          This invitation expires in 7 days.
        </p>
        
        <br>
        <p>Best regards,<br>The Sponsor Portal Team</p>
      `,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Password reset
export const sendPasswordReset = async (
  email: string,
  fullName: string,
  resetToken: string
): Promise<EmailResult> => {
  try {
    const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Reset Your Password - Sponsor Portal',
      html: `
        <h1>Password Reset Request</h1>
        <p>Hi ${fullName},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        
        <a href="${resetUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Reset Password
        </a>
        
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          This link expires in 1 hour. If you didn't request this reset, please ignore this email.
        </p>
        
        <br>
        <p>Best regards,<br>The Sponsor Portal Team</p>
      `,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// New progress report available
export const sendNewReportNotification = async (
  email: string,
  sponsorName: string,
  childName: string,
  quarter: string,
  year: number
): Promise<EmailResult> => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `New Progress Report Available for ${childName}`,
      html: `
        <h1>New Progress Report Available</h1>
        <p>Dear ${sponsorName},</p>
        <p>A new progress report for <strong>${childName}</strong> is now available!</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Report Period:</strong> ${quarter} ${year}</p>
        </div>
        
        <p>Log in to the Sponsor Portal to view the full report, including photos and teacher observations.</p>
        
        <a href="${FRONTEND_URL}/sponsor/children" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          View Report
        </a>
        
        <br><br>
        <p>Best regards,<br>The Sponsor Portal Team</p>
      `,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// New newsletter published
export const sendNewsletterNotification = async (
  email: string,
  sponsorName: string,
  newsletterTitle: string,
  newsletterUrl: string
): Promise<EmailResult> => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `New Newsletter: ${newsletterTitle}`,
      html: `
        <h1>New Newsletter Published</h1>
        <p>Dear ${sponsorName},</p>
        <p>A new newsletter has been published: <strong>${newsletterTitle}</strong></p>
        
        <a href="${newsletterUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">
          Read Newsletter
        </a>
        
        <br><br>
        <p>Best regards,<br>The Sponsor Portal Team</p>
      `,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, id: data?.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
```

### Setting Up Resend

1. Go to [resend.com](https://resend.com) and create an account
2. Verify your email domain at [resend.com/domains](https://resend.com/domains)
3. Create an API key at [resend.com/api-keys](https://resend.com/api-keys)
4. Add `RESEND_API_KEY` to your environment variables

---

## F6: API Integration Helpers

### Updated API Client (src/lib/api.ts)

Replace the existing API client with this enhanced version:

```typescript
import type { 
  ApiResponse, 
  PaginatedResponse,
  Child, 
  Sponsorship, 
  ProgressReport,
  Newsletter,
  SchoolEvent,
  UserWithRoles,
  PendingRegistration,
  SponsorInvitation
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 - Token expired
      if (response.status === 401) {
        this.setToken(null);
        window.location.href = '/login';
        return { error: 'Session expired. Please log in again.' };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || data.message || 'An error occurred',
        };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // File upload helper
  async uploadFile(
    endpoint: string, 
    file: File, 
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<{ url: string; publicId: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Upload failed' };
      }

      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  // ============================================
  // AUTH ENDPOINTS
  // ============================================
  
  async login(email: string, password: string) {
    return this.post<{ token: string; user: UserWithRoles }>('/auth/login', { email, password });
  }

  async register(data: { email: string; password: string; full_name: string; phone?: string }) {
    return this.post<{ message: string }>('/auth/register', data);
  }

  async forgotPassword(email: string) {
    return this.post<{ message: string }>('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string) {
    return this.post<{ message: string }>('/auth/reset-password', { token, password });
  }

  async getMe() {
    return this.get<UserWithRoles>('/auth/me');
  }

  // ============================================
  // CHILDREN ENDPOINTS
  // ============================================
  
  async getChildren(params?: { 
    page?: number; 
    limit?: number; 
    status?: string; 
    grade?: string; 
    search?: string 
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const query = searchParams.toString();
    return this.get<PaginatedResponse<Child>>(`/children${query ? `?${query}` : ''}`);
  }

  async getChild(id: string) {
    return this.get<Child & { sponsors: any[] }>(`/children/${id}`);
  }

  async createChild(data: Omit<Child, 'id' | 'created_at' | 'updated_at'>) {
    return this.post<Child>('/children', data);
  }

  async updateChild(id: string, data: Partial<Child>) {
    return this.put<Child>(`/children/${id}`, data);
  }

  async deleteChild(id: string) {
    return this.delete<{ message: string }>(`/children/${id}`);
  }

  async restoreChild(id: string) {
    return this.post<Child>(`/children/${id}/restore`);
  }

  async batchChildren(operation: 'create' | 'delete', items: any[]) {
    return this.post<{ results: any[]; summary: any }>('/children/batch', { operation, items });
  }

  // ============================================
  // SPONSORSHIPS ENDPOINTS
  // ============================================
  
  async getSponsorships(params?: { sponsor_id?: string; child_id?: string; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const query = searchParams.toString();
    return this.get<Sponsorship[]>(`/sponsorships${query ? `?${query}` : ''}`);
  }

  async assignSponsorship(data: { sponsor_id: string; child_id: string }) {
    return this.post<Sponsorship>('/sponsorships/assign', data);
  }

  async removeSponsorship(id: string) {
    return this.delete<{ message: string }>(`/sponsorships/${id}`);
  }

  // ============================================
  // PROGRESS REPORTS ENDPOINTS
  // ============================================
  
  async getReports(params?: { child_id?: string; status?: string; year?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const query = searchParams.toString();
    return this.get<PaginatedResponse<ProgressReport>>(`/reports${query ? `?${query}` : ''}`);
  }

  async getReport(id: string) {
    return this.get<ProgressReport>(`/reports/${id}`);
  }

  async createReport(data: Omit<ProgressReport, 'id' | 'created_at' | 'updated_at'>) {
    return this.post<ProgressReport>('/reports', data);
  }

  async updateReport(id: string, data: Partial<ProgressReport>) {
    return this.put<ProgressReport>(`/reports/${id}`, data);
  }

  async deleteReport(id: string) {
    return this.delete<{ message: string }>(`/reports/${id}`);
  }

  async publishReport(id: string) {
    return this.post<ProgressReport>(`/reports/${id}/publish`);
  }

  // ============================================
  // NEWSLETTERS ENDPOINTS
  // ============================================
  
  async getNewsletters(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const query = searchParams.toString();
    return this.get<PaginatedResponse<Newsletter>>(`/newsletters${query ? `?${query}` : ''}`);
  }

  async createNewsletter(data: { title: string; description?: string; file_url: string }) {
    return this.post<Newsletter>('/newsletters', data);
  }

  async deleteNewsletter(id: string) {
    return this.delete<{ message: string }>(`/newsletters/${id}`);
  }

  // ============================================
  // EVENTS ENDPOINTS
  // ============================================
  
  async getEvents(params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const query = searchParams.toString();
    return this.get<PaginatedResponse<SchoolEvent>>(`/events${query ? `?${query}` : ''}`);
  }

  async getEvent(id: string) {
    return this.get<SchoolEvent>(`/events/${id}`);
  }

  async createEvent(data: Omit<SchoolEvent, 'id' | 'created_at' | 'created_by'>) {
    return this.post<SchoolEvent>('/events', data);
  }

  async updateEvent(id: string, data: Partial<SchoolEvent>) {
    return this.put<SchoolEvent>(`/events/${id}`, data);
  }

  async deleteEvent(id: string) {
    return this.delete<{ message: string }>(`/events/${id}`);
  }

  // ============================================
  // INVITATIONS ENDPOINTS
  // ============================================
  
  async getInvitations(params?: { status?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const query = searchParams.toString();
    return this.get<SponsorInvitation[]>(`/invitations${query ? `?${query}` : ''}`);
  }

  async sendInvitation(email: string) {
    return this.post<SponsorInvitation>('/invitations/send', { email });
  }

  async resendInvitation(id: string) {
    return this.post<SponsorInvitation>(`/invitations/${id}/resend`);
  }

  async cancelInvitation(id: string) {
    return this.delete<{ message: string }>(`/invitations/${id}`);
  }

  // ============================================
  // REGISTRATIONS ENDPOINTS
  // ============================================
  
  async getPendingRegistrations() {
    return this.get<PendingRegistration[]>('/registrations/pending');
  }

  async approveRegistration(id: string) {
    return this.post<{ message: string }>(`/registrations/${id}/approve`);
  }

  async rejectRegistration(id: string, reason?: string) {
    return this.post<{ message: string }>(`/registrations/${id}/reject`, { reason });
  }

  // ============================================
  // NOTIFICATIONS ENDPOINTS
  // ============================================
  
  async getNotifications() {
    return this.get<any[]>('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.put<any>(`/notifications/${id}/read`);
  }

  async markAllNotificationsRead() {
    return this.put<{ message: string }>('/notifications/mark-all-read');
  }

  // ============================================
  // AUDIT ENDPOINTS
  // ============================================
  
  async getAuditLogs(params?: { 
    table_name?: string; 
    user_id?: string; 
    action?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    const query = searchParams.toString();
    return this.get<PaginatedResponse<any>>(`/audit${query ? `?${query}` : ''}`);
  }

  async getRecordHistory(tableName: string, recordId: string) {
    return this.get<any[]>(`/audit/${tableName}/${recordId}`);
  }

  // ============================================
  // UPLOAD ENDPOINTS
  // ============================================
  
  async uploadImage(file: File, folder?: string) {
    return this.uploadFile('/upload/image', file, folder ? { folder } : undefined);
  }

  async uploadDocument(file: File, folder?: string) {
    return this.uploadFile('/upload/document', file, folder ? { folder } : undefined);
  }

  async uploadVideo(file: File, folder?: string) {
    return this.uploadFile('/upload/video', file, folder ? { folder } : undefined);
  }

  async deleteUploadedFile(publicId: string, resourceType?: string) {
    return this.delete<{ message: string }>(`/upload/${publicId}${resourceType ? `?resourceType=${resourceType}` : ''}`);
  }
}

export const api = new ApiClient(API_BASE_URL);
```

### React Query Hooks (src/hooks/useApi.ts)

Create this new file for React Query hooks:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Child, ProgressReport, Newsletter, SchoolEvent } from '@/types';

// ============================================
// CHILDREN HOOKS
// ============================================

export const useChildren = (params?: Parameters<typeof api.getChildren>[0]) => {
  return useQuery({
    queryKey: ['children', params],
    queryFn: async () => {
      const result = await api.getChildren(params);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
};

export const useChild = (id: string) => {
  return useQuery({
    queryKey: ['children', id],
    queryFn: async () => {
      const result = await api.getChild(id);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!id,
  });
};

export const useCreateChild = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Parameters<typeof api.createChild>[0]) => {
      const result = await api.createChild(data);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
    },
  });
};

export const useUpdateChild = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Child> }) => {
      const result = await api.updateChild(id, data);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
      queryClient.invalidateQueries({ queryKey: ['children', id] });
    },
  });
};

export const useDeleteChild = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await api.deleteChild(id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['children'] });
    },
  });
};

// ============================================
// REPORTS HOOKS
// ============================================

export const useReports = (params?: Parameters<typeof api.getReports>[0]) => {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: async () => {
      const result = await api.getReports(params);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
};

export const useReport = (id: string) => {
  return useQuery({
    queryKey: ['reports', id],
    queryFn: async () => {
      const result = await api.getReport(id);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!id,
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Parameters<typeof api.createReport>[0]) => {
      const result = await api.createReport(data);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useUpdateReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProgressReport> }) => {
      const result = await api.updateReport(id, data);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports', id] });
    },
  });
};

export const usePublishReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await api.publishReport(id);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports', id] });
    },
  });
};

// ============================================
// NEWSLETTERS HOOKS
// ============================================

export const useNewsletters = (params?: Parameters<typeof api.getNewsletters>[0]) => {
  return useQuery({
    queryKey: ['newsletters', params],
    queryFn: async () => {
      const result = await api.getNewsletters(params);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
};

export const useCreateNewsletter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Parameters<typeof api.createNewsletter>[0]) => {
      const result = await api.createNewsletter(data);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletters'] });
    },
  });
};

// ============================================
// EVENTS HOOKS
// ============================================

export const useEvents = (params?: Parameters<typeof api.getEvents>[0]) => {
  return useQuery({
    queryKey: ['events', params],
    queryFn: async () => {
      const result = await api.getEvents(params);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
};

export const useEvent = (id: string) => {
  return useQuery({
    queryKey: ['events', id],
    queryFn: async () => {
      const result = await api.getEvent(id);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!id,
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Parameters<typeof api.createEvent>[0]) => {
      const result = await api.createEvent(data);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

// ============================================
// NOTIFICATIONS HOOKS
// ============================================

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const result = await api.getNotifications();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await api.markNotificationRead(id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

// ============================================
// UPLOAD HOOKS
// ============================================

export const useUploadImage = () => {
  return useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder?: string }) => {
      const result = await api.uploadImage(file, folder);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
};

export const useUploadDocument = () => {
  return useMutation({
    mutationFn: async ({ file, folder }: { file: File; folder?: string }) => {
      const result = await api.uploadDocument(file, folder);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
};
```

---

## F7: Audit Logging

### Audit Middleware (src/middleware/audit.ts)

```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

// Middleware to automatically log mutations
export const auditLog = (tableName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json to capture the response
    res.json = (body: any) => {
      // Log after successful mutation
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const action = getActionFromMethod(req.method);
        
        logAudit({
          userId: req.user?.id,
          userEmail: req.user?.email,
          action,
          tableName,
          recordId: req.params.id || body?.id || body?.data?.id,
          oldData: (req as any).oldData, // Set by controller if needed
          newData: req.method !== 'DELETE' ? (body?.data || body) : null,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }).catch(console.error);
      }
      
      return originalJson(body);
    };
    
    next();
  };
};

function getActionFromMethod(method: string): string {
  switch (method) {
    case 'POST': return 'CREATE';
    case 'PUT':
    case 'PATCH': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    default: return 'UNKNOWN';
  }
}

interface AuditLogEntry {
  userId?: string;
  userEmail?: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
}

async function logAudit(entry: AuditLogEntry) {
  try {
    await query(
      `INSERT INTO audit_logs 
       (id, user_id, user_email, action, table_name, record_id, old_data, new_data, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        uuidv4(),
        entry.userId,
        entry.userEmail,
        entry.action,
        entry.tableName,
        entry.recordId,
        entry.oldData ? JSON.stringify(entry.oldData) : null,
        entry.newData ? JSON.stringify(entry.newData) : null,
        entry.ipAddress,
        entry.userAgent,
      ]
    );
  } catch (error) {
    console.error('Failed to log audit entry:', error);
  }
}

// Manual logging function for special cases
export const createAuditLog = logAudit;
```

### Audit Controller (src/controllers/auditController.ts)

```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

// Get audit logs with filters
export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      table_name, 
      user_id, 
      action,
      start_date,
      end_date,
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    const params: any[] = [];
    let whereClause = 'WHERE 1=1';
    
    if (table_name) {
      params.push(table_name);
      whereClause += ` AND table_name = $${params.length}`;
    }
    
    if (user_id) {
      params.push(user_id);
      whereClause += ` AND user_id = $${params.length}`;
    }
    
    if (action) {
      params.push(action);
      whereClause += ` AND action = $${params.length}`;
    }
    
    if (start_date) {
      params.push(start_date);
      whereClause += ` AND created_at >= $${params.length}`;
    }
    
    if (end_date) {
      params.push(end_date);
      whereClause += ` AND created_at <= $${params.length}`;
    }
    
    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM audit_logs ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    // Get paginated results with user info
    params.push(Number(limit), offset);
    const result = await query(
      `SELECT al.*, u.full_name as user_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    
    res.json({
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get history for a specific record
export const getRecordHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { tableName, recordId } = req.params;
    
    const result = await query(
      `SELECT al.*, u.full_name as user_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.table_name = $1 AND al.record_id = $2
       ORDER BY al.created_at DESC`,
      [tableName, recordId]
    );
    
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};
```

---

## F8: Soft Deletes

Soft deletes are built into the schema (F1) with `deleted_at` columns. Here's how they work in controllers:

### Soft Delete Pattern

```typescript
// In controllers, always filter by deleted_at IS NULL
const result = await query(
  'SELECT * FROM children WHERE deleted_at IS NULL ORDER BY created_at DESC',
  []
);

// To include deleted items (admin view)
const result = await query(
  'SELECT * FROM children ORDER BY created_at DESC',
  []
);

// Soft delete (instead of hard delete)
await query(
  'UPDATE children SET deleted_at = NOW() WHERE id = $1',
  [id]
);

// Restore soft-deleted record
await query(
  'UPDATE children SET deleted_at = NULL WHERE id = $1',
  [id]
);

// Permanently delete (use sparingly)
await query(
  'DELETE FROM children WHERE id = $1',
  [id]
);
```

---

## F9: Data Validation

### Validation Schemas (src/schemas/)

#### Child Schema (src/schemas/child.ts)

```typescript
import { z } from 'zod';

export const childSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters'),
  last_name: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters'),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  grade: z
    .string()
    .trim()
    .min(1, 'Grade is required')
    .max(50, 'Grade must be less than 50 characters'),
  photo_url: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .nullable(),
  story: z
    .string()
    .max(2000, 'Story must be less than 2000 characters')
    .optional()
    .nullable(),
  enrollment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  status: z
    .enum(['active', 'graduated', 'withdrawn'])
    .optional()
    .default('active'),
});

export const childUpdateSchema = childSchema.partial();

export type ChildInput = z.infer<typeof childSchema>;
```

#### Report Schema (src/schemas/report.ts)

```typescript
import { z } from 'zod';

const subjectSchema = z.object({
  name: z.string().min(1).max(100),
  grade: z.string().max(10).optional(),
  comments: z.string().max(500).optional(),
});

export const reportSchema = z.object({
  child_id: z.string().uuid('Invalid child ID'),
  quarter: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
  year: z
    .number()
    .int()
    .min(2020, 'Year must be 2020 or later')
    .max(2100, 'Year must be before 2100'),
  subjects: z.array(subjectSchema).optional().default([]),
  growth_narrative: z
    .string()
    .max(5000, 'Growth narrative must be less than 5000 characters')
    .optional(),
  activities: z
    .string()
    .max(3000, 'Activities must be less than 3000 characters')
    .optional(),
  teacher_observations: z
    .string()
    .max(3000, 'Observations must be less than 3000 characters')
    .optional(),
  goals_next_quarter: z
    .string()
    .max(2000, 'Goals must be less than 2000 characters')
    .optional(),
  status: z
    .enum(['draft', 'published'])
    .optional()
    .default('draft'),
});

export const reportUpdateSchema = reportSchema.partial().omit({ child_id: true });

export type ReportInput = z.infer<typeof reportSchema>;
```

#### Auth Schemas (src/schemas/auth.ts)

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .max(255),
  password: z
    .string()
    .min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
  full_name: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(255),
  phone: z
    .string()
    .regex(/^[+]?[\d\s-()]+$/, 'Invalid phone number')
    .max(50)
    .optional()
    .nullable(),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .max(255),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
});
```

---

## F10: Batch Operations

Batch operations are implemented in each controller (see F2 example). Here's the complete pattern:

### Batch Request Format

```typescript
// Request body
{
  "operation": "create" | "update" | "delete",
  "items": [
    { /* item data */ },
    { /* item data */ }
  ]
}

// Response
{
  "results": [
    { "id": "uuid", "success": true },
    { "id": "uuid", "success": false, "error": "Error message" }
  ],
  "summary": {
    "total": 10,
    "succeeded": 8,
    "failed": 2
  }
}
```

### Batch Controller Pattern

```typescript
export const batch = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { operation, items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }
    
    if (items.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 items per batch' });
    }
    
    const results: { id: string; success: boolean; error?: string }[] = [];
    
    // Process in parallel with concurrency limit
    const BATCH_SIZE = 10;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(item => processItem(operation, item, req.user))
      );
      results.push(...batchResults);
    }
    
    res.json({
      results,
      summary: {
        total: items.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
    });
  } catch (error) {
    next(error);
  }
};
```

---

## Environment Variables Reference

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgres://user:password@localhost:5432/sponsor_portal

# JWT
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS and email links)
FRONTEND_URL=http://localhost:5173

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-api-secret

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=Sponsor Portal <noreply@yourdomain.com>
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
```

---

## Implementation Checklist

### Phase F Completion Checklist

- [ ] **F1: Database Schema**
  - [ ] Run migration script
  - [ ] Verify all tables created
  - [ ] Test foreign key relationships
  - [ ] Create seed data for development

- [ ] **F2: Express API**
  - [ ] Set up project structure
  - [ ] Implement authentication middleware
  - [ ] Create all route files
  - [ ] Implement all controllers
  - [ ] Test all endpoints

- [ ] **F3: Cloudinary**
  - [ ] Create Cloudinary account
  - [ ] Configure API keys
  - [ ] Test image upload
  - [ ] Test document upload

- [ ] **F4: Render Deployment**
  - [ ] Create PostgreSQL database
  - [ ] Deploy web service
  - [ ] Configure environment variables
  - [ ] Run migrations
  - [ ] Test production endpoints

- [ ] **F5: Resend Email**
  - [ ] Create Resend account
  - [ ] Verify domain
  - [ ] Configure API key
  - [ ] Test all email templates

- [ ] **F6: Frontend Integration**
  - [ ] Update API client
  - [ ] Create React Query hooks
  - [ ] Update forms to use API
  - [ ] Add loading states
  - [ ] Test end-to-end flows

- [ ] **F7: Audit Logging**
  - [ ] Verify audit middleware
  - [ ] Test log creation
  - [ ] Build admin view page

- [ ] **F8: Soft Deletes**
  - [ ] Verify deleted_at queries
  - [ ] Test restore functionality
  - [ ] Build trash/recycle view

- [ ] **F9: Data Validation**
  - [ ] Create all Zod schemas
  - [ ] Apply validation middleware
  - [ ] Test error responses

- [ ] **F10: Batch Operations**
  - [ ] Implement batch endpoints
  - [ ] Test batch create
  - [ ] Test batch delete
  - [ ] Handle partial failures

---

## Next Steps

After completing Phase F, consider:

1. **Admin Audit Log Viewer** - UI to view all audit logs
2. **Trash/Recycle Bin Page** - UI to view and restore deleted items
3. **CSV Import/Export** - Bulk data management
4. **Real-time Notifications** - WebSocket integration
5. **Advanced Analytics** - Dashboard with charts and metrics
