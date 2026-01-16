# Sponsor Portal Backend API

Express.js backend for the Sponsor Management Portal.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **File Storage**: Cloudinary
- **Email**: Resend
- **Authentication**: JWT with refresh tokens

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Cloudinary account
- Resend account

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Run database migrations**
   ```bash
   npm run migrate
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Server runs on `http://localhost:3001`

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | Sponsor registration |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (invalidate refresh token) |

### Children
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/children` | List all children (with pagination) |
| GET | `/api/children/:id` | Get child details |
| POST | `/api/children` | Create child |
| PUT | `/api/children/:id` | Update child |
| DELETE | `/api/children/:id` | Soft delete child |
| POST | `/api/children/:id/restore` | Restore deleted child |
| POST | `/api/children/batch` | Batch operations |

### Sponsors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sponsors` | List all sponsors |
| GET | `/api/sponsors/:id` | Get sponsor details |
| PUT | `/api/sponsors/:id` | Update sponsor |
| DELETE | `/api/sponsors/:id` | Soft delete sponsor |
| POST | `/api/sponsors/batch` | Batch operations |

### Sponsorships
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sponsorships` | List all sponsorships |
| POST | `/api/sponsorships/assign` | Assign child to sponsor |
| DELETE | `/api/sponsorships/remove` | Remove sponsorship |
| POST | `/api/sponsorships/batch` | Batch operations |

### Progress Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports` | List reports |
| GET | `/api/reports/:id` | Get report with media |
| POST | `/api/reports` | Create report |
| PUT | `/api/reports/:id` | Update report |
| DELETE | `/api/reports/:id` | Soft delete report |
| POST | `/api/reports/:id/restore` | Restore deleted report |
| POST | `/api/reports/batch` | Batch operations |

### Newsletters
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/newsletters` | List newsletters |
| POST | `/api/newsletters` | Create newsletter |
| PUT | `/api/newsletters/:id` | Update newsletter |
| DELETE | `/api/newsletters/:id` | Soft delete newsletter |
| POST | `/api/newsletters/:id/restore` | Restore deleted |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List events |
| GET | `/api/events/:id` | Get event with media |
| POST | `/api/events` | Create event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Soft delete event |
| POST | `/api/events/:id/restore` | Restore deleted |
| POST | `/api/events/batch` | Batch operations |

### Invitations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invitations` | List invitations |
| POST | `/api/invitations/send` | Send invitation |
| POST | `/api/invitations/resend` | Resend invitation |
| DELETE | `/api/invitations/:id` | Cancel invitation |

### Pending Registrations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/registrations/pending` | List pending |
| POST | `/api/registrations/approve` | Approve registration |
| POST | `/api/registrations/reject` | Reject registration |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/mark-all-read` | Mark all read |

### Audit Logs (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit` | List audit logs |
| GET | `/api/audit/:table/:id` | Get record history |

### File Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/image` | Upload image |
| POST | `/api/upload/document` | Upload document |
| DELETE | `/api/upload/:publicId` | Delete file |

## Deployment on Render

1. **Create PostgreSQL Database**
   - New → PostgreSQL
   - Copy External Database URL

2. **Create Web Service**
   - New → Web Service
   - Connect your GitHub repo
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Set Environment Variables**
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Secure random string
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `RESEND_API_KEY`
   - `FRONTEND_URL` - Your Lovable app URL
   - `NODE_ENV` - production

4. **Run Migrations**
   - Shell: `psql $DATABASE_URL -f migrations/001_initial_schema.sql`

## Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Pagination

All list endpoints support pagination:

```
GET /api/children?page=1&limit=20&search=john&sortBy=created_at&sortOrder=desc
```

Response includes:
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```

## License

MIT
