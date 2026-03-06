

# Deployment Guide: Backend to Render + Database Setup

## Overview

This guide walks you through deploying your Express.js backend to Render with a PostgreSQL database, then connecting your Lovable frontend to the live API.

---

## Part 1: Export Backend Code to GitHub

### Step 1.1: Connect Lovable to GitHub (if not already)

1. Click the **project name** in the top-left corner of Lovable
2. Click **Settings**
3. Go to the **GitHub** tab under "Connectors"
4. Click **Connect to GitHub**
5. Authorize Lovable to access your GitHub account
6. Click **Create Repository** - this creates a new repo with all your code including the `backend/` folder

### Step 1.2: Verify Backend Code is in GitHub

1. Go to your GitHub repository (link shown after connecting)
2. Navigate to the `backend/` folder
3. Confirm you see these files:
   - `backend/src/` (all controllers, routes, etc.)
   - `backend/migrations/` (001-004 SQL files)
   - `backend/package.json`
   - `backend/tsconfig.json`

---

## Part 2: Create PostgreSQL Database on Render

### Step 2.1: Create Render Account

1. Go to **https://render.com**
2. Click **Get Started for Free**
3. Sign up with GitHub (recommended for easy deployment)

### Step 2.2: Create PostgreSQL Database

1. From Render Dashboard, click **New +** button (top right)
2. Select **PostgreSQL**
3. Fill in the form:
   - **Name**: `sponsor-portal-db`
   - **Database**: `sponsor_portal`
   - **User**: `sponsor_admin` (or leave default)
   - **Region**: Choose closest to your users
   - **PostgreSQL Version**: `15` or latest
   - **Instance Type**: Select **Free** (for testing) or **Starter** ($7/month for production)
4. Click **Create Database**
5. Wait 1-2 minutes for provisioning

### Step 2.3: Copy Database Connection String

1. Once database is ready, click on it to open details
2. Scroll to **Connections** section
3. Copy the **External Database URL** - it looks like:
   ```
   postgresql://sponsor_admin:xxxxxxxx@dpg-xxxxx.oregon-postgres.render.com/sponsor_portal
   ```
4. **Save this URL** - you'll need it for migrations and backend deployment

---

## Part 3: Run Database Migrations

### Step 3.1: Install PostgreSQL Client (if needed)

**On Mac:**
```bash
brew install postgresql
```

**On Windows:**
Download from https://www.postgresql.org/download/windows/

**On Linux:**
```bash
sudo apt-get install postgresql-client
```

### Step 3.2: Run Migrations in Order

Open your terminal and run each migration:

```bash
# Replace YOUR_DATABASE_URL with the External Database URL from Render

# Migration 1: Initial schema (creates all tables)
psql "YOUR_DATABASE_URL" -f backend/migrations/001_initial_schema.sql

# Migration 2: User roles table
psql "YOUR_DATABASE_URL" -f backend/migrations/002_user_roles_table.sql

# Migration 3: Add missing columns
psql "YOUR_DATABASE_URL" -f backend/migrations/003_add_missing_columns.sql

# Migration 4: Payments table
psql "YOUR_DATABASE_URL" -f backend/migrations/004_payments_table.sql
```

### Step 3.3: Verify Migrations Succeeded

```bash
# Connect to database
psql "YOUR_DATABASE_URL"

# List all tables (should see users, children, payments, etc.)
\dt

# Check for admin user
SELECT id, email, full_name FROM users LIMIT 5;

# Exit
\q
```

---

## Part 4: Deploy Backend to Render

### Step 4.1: Create Web Service

1. From Render Dashboard, click **New +**
2. Select **Web Service**
3. Click **Connect a repository**
4. Select your GitHub repository
5. Click **Connect**

### Step 4.2: Configure Build Settings

Fill in the form:

| Setting | Value |
|---------|-------|
| **Name** | `sponsor-portal-api` |
| **Region** | Same as your database |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (or Starter for production) |

### Step 4.3: Add Environment Variables

Scroll to **Environment Variables** section and add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your External Database URL from Part 2 |
| `JWT_SECRET` | Generate a secure random string (32+ characters) |
| `JWT_EXPIRES_IN` | `1h` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://sponsor-story-stream.lovable.app` |
| `PORT` | `3001` |

**Optional (for full functionality):**

| Key | Value |
|-----|-------|
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
| `RESEND_API_KEY` | Your Resend API key |
| `FROM_EMAIL` | `noreply@yourdomain.com` |

**Tip**: Generate a secure JWT_SECRET using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4.4: Deploy

1. Click **Create Web Service**
2. Wait 3-5 minutes for the build and deploy
3. Watch the logs for any errors

### Step 4.5: Verify Backend is Running

1. Once deployed, Render shows your service URL (e.g., `https://sponsor-portal-api.onrender.com`)
2. Open in browser: `https://sponsor-portal-api.onrender.com/api/health`
3. You should see: `{"status":"ok","timestamp":"..."}`

---

## Part 5: Connect Lovable Frontend to Backend

### Step 5.1: Get Your Backend URL

Your Render backend URL will be something like:
```
https://sponsor-portal-api.onrender.com
```

### Step 5.2: Update Lovable Environment Variable

1. In Lovable, click the **project name** (top-left)
2. Click **Settings**
3. Scroll to **Environment Variables** section
4. Click **Add Variable**
5. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://sponsor-portal-api.onrender.com/api`
6. Click **Save**

### Step 5.3: Republish Frontend

1. Click the **Publish** button (top-right)
2. Click **Update** to redeploy with the new environment variable
3. Wait for deployment to complete

---

## Part 6: Create Initial Admin User

### Step 6.1: Connect to Database

```bash
psql "YOUR_DATABASE_URL"
```

### Step 6.2: Create Admin User

Run this SQL (replace with your details):

```sql
-- Generate a bcrypt hash for your password (use https://bcrypt-generator.com/)
-- Or run this in Node: require('bcryptjs').hashSync('YourPassword123', 10)

INSERT INTO users (email, password_hash, full_name, status)
VALUES (
  'admin@yourschool.com',
  '$2a$10$...your_bcrypt_hash...',
  'Admin User',
  'active'
);

-- Get the user ID
SELECT id FROM users WHERE email = 'admin@yourschool.com';

-- Add admin role (use the ID from above)
INSERT INTO user_roles (user_id, role)
VALUES ('paste-user-id-here', 'admin');
```

### Step 6.3: Test Login

1. Go to your published Lovable app
2. Navigate to the login page
3. Enter your admin credentials
4. You should be redirected to the admin dashboard

---

## Troubleshooting

### Backend not starting?
- Check Render logs for errors
- Verify all environment variables are set correctly
- Ensure `DATABASE_URL` is the External URL, not Internal

### Database connection failed?
- Verify you're using the External Database URL
- Check if your IP needs to be whitelisted (not needed on Render)
- Ensure database is running (green status on Render)

### Frontend shows network errors?
- Check browser console for CORS errors
- Verify `VITE_API_URL` includes `/api` at the end
- Republish frontend after setting environment variable

### Login not working?
- Verify admin user was created with correct password hash
- Check that user_roles entry exists for your user
- Check backend logs for authentication errors

---

## Quick Reference

| Resource | URL/Value |
|----------|-----------|
| **Lovable Published App** | `https://sponsor-story-stream.lovable.app` |
| **Backend API** | `https://your-service.onrender.com/api` |
| **Database Dashboard** | Render Dashboard → PostgreSQL |
| **Backend Logs** | Render Dashboard → Web Service → Logs |

