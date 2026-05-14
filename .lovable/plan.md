## 1. Post-deployment smoke test (after the custom subdomain goes live)

Run through this list in order on the live custom subdomain (e.g. `sponsor.yourdomain.org`). Stop at the first failure and fix before proceeding.

**A. The site loads**
- Open the root URL → should land on the public landing page (no Vercel 404, no blank screen).
- Hard refresh (Cmd/Ctrl + Shift + R) → still loads.
- Visit a deep link directly (e.g. `/login`, `/admin/dashboard`) → loads, does not 404. This confirms `vercel.json` SPA rewrite is active.
- Open DevTools → Network. Confirm the page is served over **HTTPS** with a valid certificate (no padlock warning).

**B. Frontend ↔ Backend connectivity**
- DevTools → Network → filter `sponsor-portal-api-a49s.onrender.com`.
- Trigger any data load (open landing → click Login). The first API call (`/auth/...` or `/children/public`) should return **200**, not CORS-blocked.
- If you see `CORS error` or `blocked by CORS policy`: the new custom subdomain must be added to the backend's allowed origins on Render (env var `FRONTEND_URL` and/or the CORS allowlist). See section 5.
- Confirm the request URL points to the Render API, not `localhost`. If it points to localhost, `VITE_API_URL` was not set in Vercel for Production → set it and redeploy without cache.

**C. Auth flow end-to-end**
- Log in with the admin credentials (section 2).
- After login → should land on `/admin/dashboard` (or `/sponsor`, `/teacher` per role).
- **Refresh the page** → should stay logged in, not bounce to `/login`. (This is the previously-reported bug — see section 3.)
- Open a new tab to the same domain → should still be logged in.
- Click Logout → returns to `/login`, refresh → stays logged out.

**D. Core role flows (one minute each)**
- **Admin**: open Children list, Sponsors list, Reports list, Trash, Audit Logs — each loads data, no console errors.
- **Teacher** (use demo creds): open Students, mark today's attendance, upload one Classroom Moment.
- **Sponsor** (use demo creds): open the sponsored child's profile, open a published report, view payment history.

**E. Email + media (the two external services)**
- Trigger a "Forgot password" from the login page using a real inbox you control → email arrives from Resend within ~1 min. If not: check Render logs for `RESEND_API_KEY` errors.
- As admin, upload a child avatar → image renders from `res.cloudinary.com`. If upload fails, check `CLOUDINARY_*` env vars on Render.

**F. Quick perf / SEO sanity**
- Lighthouse run (mobile) → no critical errors. Title and meta description present.
- `/robots.txt` resolves.
- 404 page works (visit `/this-page-does-not-exist`).

---

## 2. Admin login — does one already exist, and how to add more

**Does one already exist?** Yes — the project ships with a seeded super_admin via the demo credentials referenced in the demo-mode memory. After you point production at the real database, the admin that exists is whoever was inserted by the migration / seed script in `backend/migrations/` or whoever you created manually. Verify by:

1. Trying the demo super_admin login on the live site.
2. If that doesn't work (production DB has no seed), connect to the Render Postgres and run:
   ```sql
   SELECT u.email, array_agg(ur.role) FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
    WHERE u.deleted_at IS NULL
    GROUP BY u.email
   HAVING 'super_admin' = ANY(array_agg(ur.role)) OR 'admin' = ANY(array_agg(ur.role));
   ```
3. If the result is empty, bootstrap one admin manually (one-time, via SQL) — insert into `users` with a bcrypt hash, then insert `(user_id, 'super_admin')` into `user_roles`.

**How to add more admins (going forward)** — there are two supported paths:

- **Path A — UI (recommended for handover):** the backend already exposes `POST /api/auth/create-user` guarded by `requireAdmin`, accepting `role: 'teacher' | 'sponsor'`. To let admins add **other admins** from the UI, the role enum on that endpoint needs `'admin'` added (small backend change in `backend/src/schemas/auth.ts` + a permission check that only `super_admin` can mint admins). This is a follow-up, not blocking handover.
- **Path B — SQL (works today):** any super_admin can promote a user by running:
   ```sql
   INSERT INTO user_roles (user_id, role)
   SELECT id, 'admin' FROM users WHERE email = 'new.admin@org.com'
   ON CONFLICT DO NOTHING;
   ```

I'll flag the "add admin from UI" task in the handover backlog (section 4).

---

## 3. The "logout on refresh" bug — is it fixed?

**Yes, it is fixed in the current code.** Here's what was wrong and what's in place now:

- Tokens are persisted in `localStorage` (`auth_token`, `refresh_token`, `user`) in `src/lib/api.ts`.
- On every app mount, `AuthContext.tsx` reads the stored token and calls `GET /auth/me` to validate it. If valid → user stays signed in. If invalid → tokens cleared, redirect to login.
- If the access token has expired (1h TTL), the API client auto-calls `POST /auth/refresh` with the refresh token (7-day TTL) and replays the original request — fully transparent to the user.
- Multiple parallel 401s share a single refresh attempt (the `isRefreshing` queue in `api.ts`), so a refresh during a busy page doesn't trigger N refresh calls.

**How to verify on the live deployment:**
1. Log in as admin.
2. Refresh the page 3 times in a row → stays logged in.
3. In DevTools → Application → Local Storage, confirm `auth_token`, `refresh_token`, `user` are all present after refresh.
4. Wait ~1h (or manually delete `auth_token` only, leaving `refresh_token`), then click any nav item → Network shows a `/auth/refresh` call returning 200, then the original request retried.
5. Clear all storage → next click bounces to `/login`. Correct behavior.

If on the live site you still get logged out on refresh, the most likely causes (none of which are code bugs) are:
- The browser is in **private/incognito** mode with strict storage clearing.
- A browser extension (privacy/cookie auto-clear) is wiping localStorage.
- The backend's `JWT_SECRET` env var changed between deploys → all existing tokens become invalid. Don't rotate `JWT_SECRET` in production unless you intend to log everyone out.

---

## 4. Handover readiness checklist

Group A — **Must have before handover**
- [ ] Production admin account created with a strong, rotated password (not the demo password).
- [ ] Demo accounts (admin/teacher/sponsor demo creds in code) either disabled in prod or clearly documented as "remove before go-live."
- [ ] Render env vars audited: `JWT_SECRET` is a long random string (not the example), `DATABASE_URL` points to prod DB, `FRONTEND_URL` matches the new custom subdomain, `RESEND_API_KEY` + `FROM_EMAIL` set, all `CLOUDINARY_*` set, `NODE_ENV=production`.
- [ ] CORS allowlist on the backend includes the new custom subdomain (and the `www` variant if used).
- [ ] Database backup enabled on Render Postgres (daily snapshots) and verified you can download one.
- [ ] At least one successful end-to-end run of: sponsor signup → admin approval → sponsorship assignment → teacher report draft → admin publish → sponsor sees report → sponsor sends feedback.
- [ ] Email deliverability: SPF/DKIM/DMARC configured on the sending domain in Resend so receipts and password resets don't land in spam.
- [ ] 80G tax receipt PDF renders correctly with real org details (name, PAN, registration number).
- [ ] Privacy policy + Terms pages live and linked from the landing page footer (NGOs collecting child data need this).

Group B — **Should have**
- [ ] "Add admin from UI" feature (section 2, Path A) so the org isn't dependent on SQL access.
- [ ] Password reset email tested on the live domain (links point to the custom subdomain, not localhost).
- [ ] Error monitoring on the backend (Render's built-in logs are fine for v1; Sentry is the next step).
- [ ] Uptime monitor (UptimeRobot or similar) hitting the API `/health` endpoint and the frontend root every 5 min.
- [ ] Documented runbook: "how to reset a sponsor's password," "how to mark a payment as received," "how to restore a deleted child from Trash."
- [ ] Rate limits reviewed for production traffic (`backend/src/middleware/rateLimiter.ts`).
- [ ] All `console.log` debug statements removed from frontend production build (or behind `import.meta.env.DEV`).

Group C — **Nice to have**
- [ ] Lighthouse mobile score ≥ 90 on the landing page.
- [ ] Open Graph + Twitter Card meta tags on the landing page (for WhatsApp/social shares).
- [ ] Sitemap.xml + robots.txt reviewed for the public pages only.
- [ ] Render service set to "starter" plan or higher so the API doesn't cold-start (free tier sleeps after 15 min idle → first request takes 30s).

---

## 5. Safe iteration workflow — change without breaking production

The goal: every future change goes through a path where production is never the first place it runs.

**Branching model**
- `main` branch = what's live in production. Only merges from approved PRs land here.
- All work happens on Lovable (which auto-pushes to a feature branch) or on a feature branch in GitHub.

**Environment topology**
- **Production:** custom subdomain → Vercel `main` branch deploy → Render API (prod service, prod DB).
- **Preview/Staging:** every Vercel non-`main` branch automatically gets a `*.vercel.app` preview URL. Point preview builds at a **separate Render staging API + staging DB** by setting `VITE_API_URL` on Vercel's "Preview" environment scope (not "Production"). This is the single most important config: it isolates prod data from test traffic.
- **Lovable preview:** same as above — uses the staging API.

**Per-change flow**
1. Make the change in Lovable (or a feature branch).
2. Vercel auto-builds a preview URL pointing at the staging API. Test there.
3. If the change touches the database, write a new migration file in `backend/migrations/` (sequential numbering, never edit old ones). Run it against the staging DB first via Render's psql.
4. Open a PR from the feature branch into `main`. Review the diff, especially anything touching `auth`, `roles`, `payments`, or migrations.
5. Merge to `main` → Vercel auto-deploys frontend to production. Render auto-deploys backend (if connected to GitHub) or you trigger the deploy manually.
6. **Run migrations on production DB** before or immediately after the backend deploy that needs them. Order matters: additive migrations (new columns/tables) before code that uses them; destructive migrations (drop column) after code stops using them.
7. Smoke-test production using section 1's checklist (5 min).

**Rollback plan**
- Frontend: Vercel → Deployments → previous successful deploy → "Promote to Production." Live again in <30 seconds.
- Backend: Render → Service → Manual Deploy → pick the previous commit. ~2 min.
- Database: only restore from snapshot as a last resort (you'll lose data created since the snapshot). Prefer writing a corrective migration.

**Guardrails to add over time (low effort, high payoff)**
- A GitHub Action that runs `tsc --noEmit` and `npm run build` on every PR — catches type errors before merge.
- A `/health` endpoint check in the deploy pipeline that fails the deploy if the new version doesn't respond 200 within 60s.
- Tag every production deploy in Git (`v1.0.0`, `v1.0.1`) so rollback targets are obvious.
- Keep `.env.example` files (`backend/.env.example` already exists) up to date — the source of truth for "what env vars must be set."

**What never to do**
- Never run `psql` ad-hoc against the production DB to "quickly fix" data. Write a migration.
- Never edit code directly on Render's shell. The next deploy will overwrite it and you'll have lost the change.
- Never reuse the staging DB URL in production env vars (and vice versa). Label them clearly in Render.
- Never commit secrets. Use Render env vars + Vercel env vars only.

---

## 6. Anything I'd change in code as part of this plan

**Nothing required to ship.** The refresh-on-page-reload bug is already resolved and the auth/refresh-token plumbing is correct. The only optional code change I'd recommend before handover is the small "allow super_admin to create admin users from the UI" enhancement in section 2 — happy to do that as a separate task if you want it bundled in.
