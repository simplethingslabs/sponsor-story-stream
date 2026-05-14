# Fix Render "Failed to connect to database" + Admin credentials

## What the error means

The Render log shows:

```
sponsor-portal-backend@1.0.0 start
node dist/app.js
❌ Failed to connect to database
```

This comes from `backend/src/app.ts` → `checkConnection()` in `backend/src/config/database.ts`. It runs `SELECT 1` against the Postgres pool built from `process.env.DATABASE_URL`. If that env var is missing, wrong, or the DB host blocks the connection, the process exits with code 1 — exactly what you're seeing.

It is **not** a code bug. It's a Render configuration problem.

## Fix on Render (backend service "sponsor-portal-backend")

1. Render dashboard → your backend Web Service → **Environment** tab.
2. Confirm these env vars exist and are correct:
   - `DATABASE_URL` — full Postgres connection string (must include `?sslmode=require` for Render Postgres or external providers like Neon/Supabase)
   - `NODE_ENV=production`
   - `JWT_SECRET` — long random string
   - `JWT_EXPIRES_IN=15m`
   - `JWT_REFRESH_EXPIRES_IN=7d`
   - `FRONTEND_URL=https://sponsorportal.avpschool.in`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `RESEND_API_KEY`, `FROM_EMAIL`, `FROM_NAME`
3. The most likely culprit: `DATABASE_URL` is missing, has a typo, or lacks SSL.
   - If your DB is Render Postgres: copy the **Internal Database URL** from the DB's dashboard page (only works if backend and DB are in the same Render region).
   - If external (Neon/Supabase/etc.): use the **External/Pooled** URL and append `?sslmode=require`.
4. Click **Save Changes** → Render auto-redeploys. Watch logs for `📦 Connected to PostgreSQL database`.
5. Once connected, hit `https://sponsor-portal-api-a49s.onrender.com/health` — should return `{"status":"healthy", services:{database:"connected", ...}}`.

## Run migrations on the production DB (one-time)

If this is a fresh DB, the `users` table doesn't exist yet, so even after the connection works, login will fail. Run the SQL files in `backend/migrations/` in order (001 → 006) against the production database. Easiest path:

- Copy `DATABASE_URL` value locally, then from `backend/`:
  ```
  for f in migrations/00*.sql; do psql "$DATABASE_URL" -f "$f"; done
  ```
- Or paste each file into the Render Postgres "Shell" tab.

Migration `001_initial_schema.sql` seeds the default admin.

## Default admin credentials

From `backend/migrations/001_initial_schema.sql`:

- **Email:** `admin@sponsorportal.com`
- **Password:** `Admin123!`
- **Roles:** `super_admin`, `admin`

**Change this password immediately after first login** (Login → Profile/Settings → Change Password). The seed line uses `ON CONFLICT DO NOTHING`, so re-running migrations won't reset it.

## How to verify after redeploy

1. Render logs show `📦 Connected to PostgreSQL database` and the `🚀 Server running on port …` banner.
2. `GET /health` returns `200` with `database: connected`.
3. From the live frontend, log in with the admin credentials above. Refresh the page — you should stay logged in (the previously-reported logout-on-refresh bug is already fixed via `localStorage` + refresh-token flow in `src/lib/api.ts`).

## What I will do once you approve

Nothing in code — this is purely a Render env-var + one-time migration task. I'll update `.lovable/plan.md` with the credentials and the env-var checklist so you have it for handover, and that's it.
