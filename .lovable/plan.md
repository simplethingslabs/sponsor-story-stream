
# Phase 7: Deployment Preparation - Schema Fixes & API Completion

## Overview

This plan addresses the critical discrepancies between the backend code and database schema, adds missing payment APIs, migrates frontend pages from mock data to real API hooks, and prepares everything for deployment to Render.

---

## Part 1: Database Schema Fixes

### Issue 1: Missing `user_roles` Table

**Problem**: All backend controllers expect a separate `user_roles` table with JOIN queries, but the migration uses a `roles TEXT[]` column on the `users` table.

**Solution**: Create a proper `user_roles` table following security best practices.

**New Migration File**: `backend/migrations/002_user_roles_table.sql`

```sql
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'teacher', 'sponsor');

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Migrate existing roles from users.roles array to user_roles table
INSERT INTO user_roles (user_id, role)
SELECT u.id, unnest(u.roles)::app_role
FROM users u
WHERE u.roles IS NOT NULL AND array_length(u.roles, 1) > 0
ON CONFLICT (user_id, role) DO NOTHING;

-- Remove roles column from users table (after migration)
ALTER TABLE users DROP COLUMN IF EXISTS roles;
```

---

### Issue 2: Missing Columns in Tables

**Problem**: Controllers reference columns that don't exist in the migration.

| Table | Missing Column | Used By |
|-------|----------------|---------|
| `pending_registrations` | `password_hash` | `authController.register()`, `registrationsController.approveRegistration()` |
| `children` | `deleted_by` | `childrenController.deleteChild()` |
| `progress_reports` | `deleted_by`, `feedback`, `reviewed_by`, `reviewed_at`, `submitted_at` | `reportsController.deleteReport()`, `reportsController.requestRevision()` |
| `newsletters` | `deleted_by` | Soft delete pattern |
| `events` | `deleted_by` | Soft delete pattern |
| `users` | `deleted_by` | `sponsorsController.deleteSponsor()` |
| `sponsorships` | `updated_at`, `deleted_by` | `sponsorshipsController.updateSponsorship()` |
| `notifications` | `read_at` (exists as `is_read BOOLEAN`) | `notificationsController` uses `read_at` timestamp |

**New Migration File**: `backend/migrations/003_add_missing_columns.sql`

```sql
-- Add password_hash to pending_registrations
ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add deleted_by to soft-delete tables
ALTER TABLE children ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);
ALTER TABLE progress_reports ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);
ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);
ALTER TABLE events ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

-- Add review workflow columns to progress_reports
ALTER TABLE progress_reports ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE progress_reports ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);
ALTER TABLE progress_reports ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE progress_reports ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;

-- Add updated_at to sponsorships
ALTER TABLE sponsorships ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add trigger for sponsorships updated_at
CREATE TRIGGER update_sponsorships_updated_at
    BEFORE UPDATE ON sponsorships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fix notifications: rename is_read to read_at
ALTER TABLE notifications DROP COLUMN IF EXISTS is_read;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Update progress_reports status enum to include new statuses
ALTER TABLE progress_reports DROP CONSTRAINT IF EXISTS progress_reports_status_check;
ALTER TABLE progress_reports ADD CONSTRAINT progress_reports_status_check 
    CHECK (status IN ('draft', 'pending_review', 'needs_revision', 'approved', 'published'));
```

---

### Issue 3: Missing Payments Table & API

**Problem**: Phase 5 Payment System has no backend implementation.

**New Migration File**: `backend/migrations/004_payments_table.sql`

```sql
-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sponsor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('upi', 'bank_transfer', 'cheque', 'cash')),
    payment_date DATE,
    due_date DATE NOT NULL,
    receipt_number VARCHAR(50) UNIQUE,
    reference_number VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id)
);

CREATE INDEX idx_payments_sponsor ON payments(sponsor_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_child ON payments(child_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_status ON payments(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_due_date ON payments(due_date) WHERE deleted_at IS NULL;

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## Part 2: New Backend Payments API

Create complete payments backend:

| File | Description |
|------|-------------|
| `backend/src/schemas/payment.ts` | Zod validation schemas |
| `backend/src/controllers/paymentsController.ts` | CRUD operations, stats, receipt generation |
| `backend/src/routes/payments.ts` | Route definitions |
| `backend/src/routes/index.ts` | Register payments routes |

**Endpoints**:
- `GET /api/payments` - List payments with filters
- `GET /api/payments/stats` - Financial dashboard stats
- `GET /api/payments/:id` - Get single payment
- `POST /api/payments` - Record new payment
- `PUT /api/payments/:id` - Update payment
- `PUT /api/payments/:id/mark-paid` - Mark as paid
- `DELETE /api/payments/:id` - Soft delete

---

## Part 3: Frontend Migration from Mock to Real API

### Pages Still Using Mock Data (`useData()`)

| Page | Current State | Action |
|------|---------------|--------|
| `src/pages/admin/AdminDashboard.tsx` | Uses `useData()` for stats | Replace with `useChildren`, `useReports`, etc. |
| `src/pages/admin/ReportReview.tsx` | Uses `useData()` | Replace with `useReports` |
| `src/pages/admin/SponsorDetail.tsx` | Uses `useData()` | Replace with `useSponsor` |
| `src/pages/admin/FinancialDashboard.tsx` | Uses `mockPayments` | Create `usePaymentStats` hook |
| `src/pages/admin/PaymentManagement.tsx` | Uses `mockPayments` | Create `usePayments` hook |
| `src/pages/sponsor/SponsorHome.tsx` | Uses `useData()` | Replace with `useSponsorStats`, `useMyChildren` |
| `src/pages/sponsor/SponsorChildrenList.tsx` | Uses `useData()` | Replace with `useMyChildren` |
| `src/pages/sponsor/ChildProgress.tsx` | Uses `useData()` | Replace with `useChild`, `useReports` |
| `src/pages/sponsor/ReportDetail.tsx` | Uses `useData()` | Replace with `useReport` |
| `src/pages/sponsor/SponsorNewsletters.tsx` | Uses `useData()` | Replace with `useNewsletters` |
| `src/pages/sponsor/SponsorEvents.tsx` | Uses `useData()` | Replace with `useEvents` |

### New Hooks to Add in `useApi.ts`

```typescript
// Payment hooks
usePayments(params)
usePayment(id)
usePaymentStats()
useCreatePayment()
useUpdatePayment()
useMarkPaymentPaid()
useDeletePayment()
```

---

## Part 4: Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `backend/migrations/002_user_roles_table.sql` | User roles table |
| `backend/migrations/003_add_missing_columns.sql` | Missing columns |
| `backend/migrations/004_payments_table.sql` | Payments table |
| `backend/src/schemas/payment.ts` | Payment validation |
| `backend/src/controllers/paymentsController.ts` | Payment CRUD |
| `backend/src/routes/payments.ts` | Payment routes |

### Modified Files

| File | Changes |
|------|---------|
| `backend/src/routes/index.ts` | Add payments routes |
| `src/hooks/useApi.ts` | Add payment hooks |
| `src/pages/admin/AdminDashboard.tsx` | Replace useData with API hooks |
| `src/pages/admin/ReportReview.tsx` | Replace useData with API hooks |
| `src/pages/admin/SponsorDetail.tsx` | Replace useData with API hooks |
| `src/pages/admin/FinancialDashboard.tsx` | Replace mock data with API hooks |
| `src/pages/admin/PaymentManagement.tsx` | Replace mock data with API hooks |
| `src/pages/sponsor/SponsorHome.tsx` | Replace useData with API hooks |
| `src/pages/sponsor/SponsorChildrenList.tsx` | Replace useData with API hooks |
| `src/pages/sponsor/ChildProgress.tsx` | Replace useData with API hooks |
| `src/pages/sponsor/ReportDetail.tsx` | Replace useData with API hooks |
| `src/pages/sponsor/SponsorNewsletters.tsx` | Replace useData with API hooks |
| `src/pages/sponsor/SponsorEvents.tsx` | Replace useData with API hooks |

---

## Part 5: Deployment Preparation

### Environment Variables for Render

```text
# Required for backend deployment
DATABASE_URL=postgresql://user:pass@host:5432/sponsor_portal
JWT_SECRET=<generate-secure-256-bit-key>
JWT_EXPIRES_IN=1h
NODE_ENV=production

# Optional but recommended
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
RESEND_API_KEY=<your-resend-key>
FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=https://sponsor-story-stream.lovable.app
```

### Frontend Environment Variable

```text
# Update in Lovable project settings
VITE_API_URL=https://your-render-backend.onrender.com/api
```

### Database Setup Steps

1. Create PostgreSQL database on Render or external provider
2. Run migrations in order:
   - `001_initial_schema.sql`
   - `002_user_roles_table.sql`
   - `003_add_missing_columns.sql`
   - `004_payments_table.sql`
3. Verify seed admin user was created

### Backend Deployment Checklist

1. Push backend code to repository
2. Create Web Service on Render
3. Set environment variables
4. Deploy and verify health check at `/api/health`
5. Update frontend `VITE_API_URL`

---

## Implementation Order

1. **Create database migrations** (002, 003, 004)
2. **Create payments backend** (schema, controller, routes)
3. **Add payment hooks** to `useApi.ts`
4. **Migrate admin pages** from mock to real API
5. **Migrate sponsor pages** from mock to real API
6. **Test end-to-end** with local backend
7. **Deploy to Render**
8. **Update frontend API URL**
9. **Final verification**

---

## Risk Mitigation

- **Data Loss**: The migration preserves existing roles before dropping the column
- **Breaking Changes**: All migrations use `IF NOT EXISTS` and `IF EXISTS` guards
- **Rollback**: Each migration can be reversed if needed
- **Testing**: Run migrations on local DB first before production
