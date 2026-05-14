# Reconnect new Render Postgres and bring system back up

No code changes are needed — `backend/src/config/database.ts` already reads `DATABASE_URL` and enables SSL when `NODE_ENV=production`. This is a config + one-time migration task.

## Step 1 — Build the connection string

Take your External Database URL and append `?sslmode=require` (Render Postgres requires SSL from outside its network):

```
postgresql://sponsor_admin:CKwszKZiIDXZrKupgjfwE9H0sa4tKU44@dpg-d82oslv7f7vs738cccp0-a.singapore-postgres.render.com/sponsor_portal_4i5n?sslmode=require
```

Note: this is your **External** URL. Use it for (a) running migrations from your laptop and (b) on Render only if your backend service is in a **different region** than Singapore. If the backend is in Singapore too, prefer the **Internal Database URL** shown on the DB page (faster, free egress, no SSL param needed).

## Step 2 — Run the migrations against the new DB

From your local machine, in the `backend/` directory:

```bash
export DATABASE_URL="postgresql://sponsor_admin:CKwszKZiIDXZrKupgjfwE9H0sa4tKU44@dpg-d82oslv7f7vs738cccp0-a.singapore-postgres.render.com/sponsor_portal_4i5n?sslmode=require"

for f in migrations/00*.sql; do
  echo "Running $f..."
  psql "$DATABASE_URL" -f "$f" || { echo "FAILED on $f"; break; }
done
```

This runs, in order:
- `001_initial_schema.sql` — all core tables + seeds the default admin
- `002_user_roles_table.sql`
- `003_add_missing_columns.sql`
- `004_payments_table.sql`
- `005_attendance_table.sql`
- `006_classroom_moments.sql`

Quick verification:

```bash
psql "$DATABASE_URL" -c "SELECT email, roles FROM users;"
```

You should see `admin@sponsorportal.com` with `{super_admin,admin}`.

If you don't have `psql` locally, use Render's DB **Shell** tab and paste each migration file's contents in order.

## Step 3 — Update Render env vars

Render dashboard → `sponsor-portal-backend` service → **Environment** → set/update:

- `DATABASE_URL` = the connection string from Step 1 (use Internal URL if same region, External URL + `?sslmode=require` otherwise)
- Confirm these are still set from before:
  - `NODE_ENV=production`
  - `JWT_SECRET` (long random string)
  - `JWT_EXPIRES_IN=15m`
  - `JWT_REFRESH_EXPIRES_IN=7d`
  - `FRONTEND_URL=https://sponsorportal.avpschool.in`
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - `RESEND_API_KEY`, `FROM_EMAIL`, `FROM_NAME`

Click **Save Changes** — Render auto-redeploys.

## Step 4 — Verify the backend

Watch the Render logs for:

```
📦 Connected to PostgreSQL database
🚀 Server running on port ...
```

Then hit:

```
https://sponsor-portal-api-a49s.onrender.com/health
```

Expect `200` with `database: "connected"`.

## Step 5 — Verify the app end-to-end

1. Open the live frontend.
2. Log in with the seeded admin:
   - **Email:** `admin@sponsorportal.com`
   - **Password:** `Admin123!`
3. Refresh — you should stay logged in.
4. **Immediately change the admin password** (Profile → Change Password). Migrations use `ON CONFLICT DO NOTHING`, so re-running them won't reset it.
5. Smoke test: create a child, invite a sponsor, upload a photo (verifies Cloudinary), trigger a notification email (verifies Resend).

## Security note

The DB URL you pasted contains a live password. After this is done, rotate it: Render DB page → **Reset Password** → update `DATABASE_URL` on the backend service → redeploy.

## What I'll do on approval

Nothing in code — everything above is a Render dashboard + one-time `psql` task. If you'd like, on approval I can also update `.lovable/plan.md` to replace the old DB recovery notes with this new-DB checklist for handover.
