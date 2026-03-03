

# Fix Authentication and Prepare for Stakeholder Handover

## Current Status

**What's working:**
- Backend is live at `https://sponsor-portal-api-a49s.onrender.com`
- Frontend correctly points to the backend API
- Login succeeds (returns 200 with valid JWT + user data)
- Your user `anantvalleypublicschool@gmail.com` exists in the database with admin role

**What's broken:**
- Every API call AFTER login returns **500 "Authentication failed"**
- Root cause: the `authenticate` middleware (auth.ts line 33) queries `SELECT ... roles ... FROM users`, but **migration 002 dropped the `roles` column** from the `users` table and moved roles to a separate `user_roles` table
- The login controller correctly JOINs with `user_roles`, but the auth middleware does not -- so login works but nothing else does

**Additional issue:**
- The login response returns roles as a PostgreSQL array string `"{admin}"` instead of a proper JSON array `["admin"]`. This could cause role-checking issues on the frontend.

## Plan

### 1. Fix the `authenticate` middleware (backend/src/middleware/auth.ts)

Update the SQL query on lines 32-37 to JOIN with `user_roles` instead of reading a non-existent `roles` column:

```sql
SELECT u.id, u.email, u.full_name, u.phone, u.avatar_url, u.is_active,
       u.created_at, u.updated_at,
       COALESCE(array_agg(ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.id = $1 AND u.deleted_at IS NULL
GROUP BY u.id
```

Also update the `optionalAuth` function (lines 118-123) with the same fix.

### 2. Fix roles format in login response (backend/src/controllers/authController.ts)

After the login query, convert the PostgreSQL array to a proper JS array so the frontend gets `["admin"]` instead of `"{admin}"`:

```typescript
// Parse roles if they come as a pg array string
if (typeof user.roles === 'string') {
  user.roles = user.roles.replace(/[{}]/g, '').split(',').filter(Boolean);
}
```

Apply the same fix in the `/auth/me` endpoint and the `refreshToken` function.

### 3. Clean up the login page for stakeholders (frontend)

- **Remove the demo credentials hint box** from `LoginForm.tsx` so stakeholders see a professional login page
- **Remove or hide the demo user fallback** in `AuthContext.tsx` (keep it conditional on a dev flag if needed)

### 4. Redeploy

After these code changes:
- The Lovable frontend will auto-deploy on publish
- You'll need to **redeploy the backend on Render** (push to GitHub triggers auto-deploy, or manual deploy from Render dashboard)

## Post-Deploy Verification Checklist

Once deployed, test this flow:
1. Go to published app URL
2. Login with `anantvalleypublicschool@gmail.com` / your password
3. Confirm dashboard loads with real data (children, events, reports) -- they'll be empty but should not show errors
4. Navigate to Children, Events, Reports pages -- should load without 500s

## Stakeholder Handover

After the fix is deployed and verified:
- Share the published URL: `https://sponsor-story-stream.lovable.app`
- Login credentials: `anantvalleypublicschool@gmail.com` / the password you set
- The app will show empty data initially -- you can add children, events, etc. through the admin dashboard to populate it for the demo

