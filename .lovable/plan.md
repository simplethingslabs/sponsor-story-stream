# Go-Live Plan: Sponsor Portal

## Goal
Get the app fully production-ready and live on a subdomain of your existing website (e.g. `sponsors.yourschool.com`), with no mock data and all integrations connected.

---

## 1. Backend (Render) — Verify & Complete

### 1.1 Confirm backend is healthy
- Hit `https://sponsor-portal-api-a49s.onrender.com/health` and confirm:
  - `database: connected`
  - `cloudinary: configured`
  - `resend: configured`

### 1.2 Add missing environment variables on Render
Currently missing (per earlier discussion):
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`
- `FROM_EMAIL` (e.g. `noreply@yourschool.com`)
- `FROM_NAME` (e.g. `Anant Valley Sponsor Portal`)
- `FRONTEND_URL` → must be set to the final subdomain (e.g. `https://sponsors.yourschool.com`)

Without Cloudinary: photo/document/newsletter uploads will fail.
Without Resend: invitations, password resets, welcome emails will not send.

### 1.3 Run any pending migrations
Verify all 6 migrations (001–006) have been applied to the Render Postgres DB.

### 1.4 Render plan
- Free tier sleeps after 15 min of inactivity (cold-start ~30s). For stakeholder demos and real users, upgrade the web service to **Starter ($7/mo)** to avoid cold starts.
- Same for the database (Free tier expires after 90 days).

---

## 2. Initial Data — Seed Real Accounts

### 2.1 Create production admin
- One real admin account for the school (replacing any demo `anantvalleypublicschool@gmail.com` placeholder if it doesn't exist yet).
- Created via SQL on Render DB (bcrypt-hashed password).

### 2.2 Create initial teachers and sponsors
- Once admin can log in, use the new **Add Teacher** and **Add Sponsor** screens.
- Alternative: bulk-seed via SQL if a list exists.

### 2.3 Remove/verify demo data
- Audit the DB for any leftover seed/demo rows (test children, fake payments).
- Confirm `src/data/mockData.ts` is no longer imported anywhere in production code paths.

---

## 3. Frontend — Subdomain Deployment

You have two options. Pick one:

### Option A — Use Lovable hosting on your subdomain (recommended, simplest)
1. In Lovable: **Project Settings → Domains → Connect Domain** → enter `sponsors.yourschool.com`.
2. Lovable shows DNS records to add at your existing registrar (GoDaddy or wherever the parent domain lives):
   - `A` record: name `sponsors`, value `185.158.133.1`
   - `TXT` record: `_lovable.sponsors` with verification value
3. Wait for DNS propagation + automatic SSL provisioning.
4. Set Lovable env var `VITE_API_URL` → `https://sponsor-portal-api-a49s.onrender.com/api`.
5. Click **Publish → Update**.

This keeps the parent site (`yourschool.com`) untouched — only the subdomain points to Lovable.

### Option B — Self-host the built frontend on your own server
- Run `npm run build`, deploy `dist/` to your existing host under the subdomain.
- Configure SPA fallback (rewrite all paths to `index.html`).
- More work; only choose if there is a policy reason not to use Lovable hosting.

### 3.2 CORS
Confirm backend `allowedOrigins` in `backend/src/app.ts` includes `https://sponsors.yourschool.com`. Currently it allows `*.lovable.app` and effectively all origins, but we should tighten this to the production subdomain before go-live.

---

## 4. Security Hardening (before stakeholders touch it)

- Rotate `JWT_SECRET` to a fresh 32+ char random string on Render.
- Confirm rate limiter is active (it is, in `app.ts`).
- Confirm password reset and invitation links use the new `FRONTEND_URL`.
- Tighten CORS to known origins only (remove the dev "allow all" fallback in `app.ts`).
- Run a final security scan.

---

## 5. End-to-End QA Pass

Test on the live subdomain with real accounts:

1. **Admin**: log in, add teacher, add sponsor, invite sponsor by email, approve a self-registration, create child, assign sponsorship, record payment, review report, send newsletter.
2. **Teacher**: log in, mark attendance, post classroom moment, submit progress report.
3. **Sponsor**: log in, view sponsored child, view reports, view newsletters, view events, make/view payment, invite a friend.
4. **Auth flows**: forgot password (real email arrives), refresh token, logout.
5. **Uploads**: child photo, report media, newsletter PDF — confirm they land on Cloudinary.
6. **Mobile**: spot-check key pages at 375px width.

---

## 6. Operations & Monitoring

- Bookmark Render logs for backend + DB.
- Set up Render's email alert for service failures.
- Document the admin runbook (how to add users, reset passwords, restore from Trash).
- Schedule DB backups (Render Starter tier includes daily backups).

---

## 7. Stakeholder Handoff

- Share the subdomain URL with admin credentials.
- Provide a short "what to test" checklist (mirrors §5).
- Confirm: no mock data, all data lives in Postgres, all media in Cloudinary, all email via Resend.

---

## Open Questions
1. What is the exact subdomain you want (e.g. `sponsors.anantvalley.com`)?
2. Do you already have Cloudinary and Resend accounts, or do you need help signing up?
3. Do you want to upgrade Render to Starter now, or stay on Free for the stakeholder review?
4. Should I tighten CORS to only your subdomain in this same pass?
