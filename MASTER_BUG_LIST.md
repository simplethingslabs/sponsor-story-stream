# Master Bug List — Sponsor Story Stream

> **Legend:**
> - ✅ Fixed & committed
> - 🧪 Fixed — pending test on live environment
> - ⬜ Not yet fixed
> - 🔍 Needs investigation before fixing

---

## PHASE 1 — BACKEND
> Deploy to Render after each fix.

---

### BUG-02 — `req.user?.userId` → `req.user?.id` (9 call sites)
**Status:** ✅ Fixed — commit `340a571`
**Priority:** Highest leverage — was blocking BUG-03 for free.
**Files:** `reportsController.ts` (6 sites), `authController.ts` (2 sites), `registrationsController.ts` (1 site)
**Test:** Login → view profile → create report as teacher → view reports as sponsor
**Pending test file:** —

---

### BUG-01 — Notification type constants mismatch
**Status:** ✅ Fixed — commit `c30b9b0`
**Priority:** Independent, isolated change. No side effects.
**File:** `backend/src/services/notificationService.ts`
**Test:** Publish a report → confirm notification row exists in DB with correct `type` value
**Pending test file:** —

---

### BUG-11 — `buildPaginatedQuery` template literal escape
**Status:** ✅ Fixed — commit `db1bd22`
**Priority:** Affects all paginated endpoints.
**File:** `backend/src/utils/helpers.ts` ~line 205
**Test:** Hit any paginated endpoint (children list, reports list) → confirm correct LIMIT/OFFSET applied
**Pending test file:** —

---

### BUG-09 — Stale backend `ProgressReport.status` type
**Status:** ✅ Fixed — commits `f90b0a9` + `6cc4a69`
**Priority:** Pure TypeScript type fix, zero runtime risk.
**Files:** `backend/src/types/index.ts`, `backend/src/schemas/report.ts`
**Changes:**
- `ProgressReport.status` expanded from `draft | published` → full 5-state workflow: `draft | pending_review | needs_revision | approved | published`
- `createReportSchema.status` → `draft | pending_review`
- `updateReportSchema.status` → all 5 states (admins can approve/publish)
- `reportQuerySchema.status` → all 5 states + `all`
- Added `submitted_at`, `reviewed_by`, `reviewed_at`, `feedback` fields to `ProgressReport`
**Test:** TypeScript compile passes (`npm run typecheck`) ✅ — no regression
**Pending test file:** —

---

### BUG-16 — Deduplicate role-array parsing
**Status:** 🧪 Fixed — commit `01dea4b` — pending test on Render
**Priority:** Code quality / reliability
**Files:** `backend/src/utils/helpers.ts`, `backend/src/controllers/authController.ts`, `backend/src/middleware/auth.ts`
**Changes:** Extracted `parsePostgresArray()` into `helpers.ts`; replaced 4 duplicated call sites
**Test:** Login → roles returned as JS array in all auth responses; role guards enforce correctly
**Pending test file:** [`Pending Test for BUG-16.md`](./Pending%20Test%20for%20BUG-16.md)

---

### BUG-15 — Validate Cloudinary config at startup
**Status:** 🧪 Fixed — commit `1661945` — pending test on Render
**Priority:** Operational — fail fast with clear message
**Files:** `backend/src/config/env.ts` (new), `backend/src/app.ts`
**Changes:** New `validateEnv()` prints per-var OK/MISSING table; hard exits on missing `DATABASE_URL`/`JWT_SECRET`; warns for missing Cloudinary/Resend; detects `.env.example` placeholder values
**Test:** See 4 test scenarios in pending test file
**Pending test file:** [`Pending Test for BUG-15.md`](./Pending%20Test%20for%20BUG-15.md)

---

## PHASE 2 — FRONTEND
> Deploy to Vercel after each fix.

---

### BUG-17 — Frontend URL mismatch for sponsor routes
**Status:** 🧪 Fixed (pre-session) — pending test on Render
**File:** `src/hooks/useApi.ts`
**Changes:**
- `useMyReports`: `/reports/sponsor` → `/reports/my-reports`
- `useMyChildren`: `/children/sponsor` → `/children/my-children`
**Root cause:** Wrong URLs hit `GET /:id` wildcard with `id="sponsor"` → PostgreSQL error 22P02
**Pending test file:** [`Pending Test for BUG-17.md`](./Pending%20Test%20for%20BUG-17.md)

---

### BUG-05 — Pagination shape mismatch
**Status:** 🧪 Fixed — commit `10cd63d` — pending test on Vercel
**Priority:** High — affects all list views
**File:** `src/hooks/useApi.ts`
**Changes:** Added `BackendPaginatedResponse<T>` internal type and `normalizePagination()` helper. Updated all 14 paginated hooks to use `BackendPaginatedResponse` for the raw API call and normalize to the flat `PaginatedResponse<T>` shape before returning. Notifications hook also preserves `unread_count`. No component changes required.
**Test:** Children list, reports list, notifications — confirm rows render, pagination counts are correct, "Next" button enabled/disabled correctly
**Pending test file:** —

---

### BUG-07 — "Inactive" status filter in ChildrenList
**Status:** ✅ Fixed — commit `ce848e6`
**Priority:** Medium
**File:** `src/pages/admin/ChildrenList.tsx` line 82
**Changes:** Filter option value `'inactive'` → `'withdrawn'`, label `'Inactive'` → `'Withdrawn'` to match DB CHECK constraint (`active | graduated | withdrawn`). The filter previously returned 0 results permanently.
**Test:** Apply Withdrawn filter → confirm it returns withdrawn children

---

### BUG-04 — Missing approve/requestRevision hooks and backend routes
**Status:** 🧪 Fixed — commit `f4b599d` — pending test on Render + Vercel
**Priority:** Medium
**Files:** `backend/src/routes/reports.ts`, `src/hooks/useApi.ts`, `src/pages/admin/ReportReview.tsx`
**Root cause:** Controller functions `approveReport()` and `requestRevision()` existed (with notification logic) but were never wired into the routes file. Frontend worked around this by calling `useUpdateReport()` with a status patch — which changed the status but skipped notifications and reviewer tracking.
**Changes:**
- Backend: added `POST /reports/:id/approve` and `POST /reports/:id/request-revision` routes (admin/super_admin only)
- Frontend: added `useApproveReport()` and `useRequestRevision()` hooks
- `ReportReview.tsx`: replaced `useUpdateReport()` workarounds with the new dedicated hooks in `handleApprove`, `handleBulkApprove`, and `handleRequestRevision`
**Test:** Admin approves/requests revision on a report → correct notification sent to teacher; `reviewed_by` / `reviewed_at` / `feedback` fields populated in DB
**Pending test file:** [`Pending Test for BUG-04.md`](./Pending%20Test%20for%20BUG-04.md)

---

### BUG-08 — Admin role creation blocked by schema
**Status:** ✅ Fixed — commit `9500994`
**Priority:** Medium
**Files:** `backend/src/schemas/auth.ts`, `src/hooks/useApi.ts`
**Changes:**
- `createUserSchema.role`: `z.enum(['teacher','sponsor'])` → `z.enum(['teacher','sponsor','admin'])`; updated error message
- `useCreateUser` hook: role type expanded to `'teacher' | 'sponsor' | 'admin'`; `onSuccess` uses explicit `else if` so creating an admin no longer incorrectly invalidates the sponsors cache
- Route is behind `requireAdmin` so only super_admins can create admin accounts
**Test:** POST `/auth/create-user` with `role: 'admin'` → 201 created; `user_roles` row has `role='admin'`

---

### BUG-06 — Random data in ChildProgress charts
**Status:** 🧪 Fixed — commit `5c01e90` — pending test on Vercel
**Priority:** Medium — misleading to sponsors
**File:** `src/pages/sponsor/ChildProgress.tsx`
**Changes:**
- Removed `generateProgressData()` (used `Math.random()` for fake attendance/participation/academic %; no numeric fields exist on `ProgressReport`)
- Removed `skillsData` (hardcoded identical skill scores for every child)
- Removed fabricated "Meet the Child" bio text (same generic text for every child)
- Removed entire `recharts` import block (no longer needed)
- Added "Latest Report Highlight" card showing real `growth_narrative` + `activities` from the most recent published report, with a "Read Full Report" button
- "Meet the Child" now shows factual enrollment date + report count only
**Test:** Sponsor views child progress → sees real teacher narrative instead of random numbers; page shows placeholder text if no reports yet
**Pending test file:** [`Pending Test for BUG-06.md`](./Pending%20Test%20for%20BUG-06.md)

---

### BUG-12 — `useRemoveSponsorship` drops `end_date`
**Status:** 🧪 Fixed — commit `dce474e` — pending test on Render + Vercel
**Priority:** Medium — data integrity issue
**Files:** `src/lib/api.ts`, `src/hooks/useApi.ts`
**Root cause:** `api.delete()` accepted no body parameter, so `end_date` passed to `useRemoveSponsorship` was silently discarded. Backend controller already reads `req.body.end_date` and falls back to `NOW()` — no backend changes needed.
**Changes:**
- `api.delete()`: added optional `body?` parameter, JSON-stringified and forwarded (consistent with `post`, `put`, `patch`)
- `useRemoveSponsorship`: passes `{ end_date }` as DELETE body when provided; omits body when `end_date` is undefined (preserving backend's `NOW()` fallback)
**Test:** End a sponsorship with a specific `end_date` → confirm that exact date saved in DB (not `NOW()`)
**Pending test file:** [`Pending Test for BUG-12.md`](./Pending%20Test%20for%20BUG-12.md)

---

### BUG-10 — `useSponsorStats` field name mismatch
**Status:** 🧪 Fixed — commit `f86e13c` — pending test on Vercel
**Files:** `src/types/index.ts`, `src/hooks/useApi.ts`, `src/pages/sponsor/SponsorHome.tsx`
**Root cause:** Endpoint `GET /sponsors/stats` existed and worked. Frontend component accessed `statsData?.totalQuarters` and `statsData?.newReportsCount` — neither field exists in the backend response (which uses snake_case: `total_reports`, `recent_reports`, etc.). Both stats showed 0 permanently.
**Changes:**
- Added `SponsorStats` interface to `src/types/index.ts` with all 5 backend fields
- `useSponsorStats`: `api.get<any>` → `api.get<SponsorStats>` for compile-time safety
- `SponsorHome.tsx`: `statsData?.totalQuarters` → `statsData?.total_reports`; `statsData?.newReportsCount` → `statsData?.recent_reports`
**Test:** Login as sponsor → Home page shows non-zero "Quarters of Support" and "New Reports" stats
**Pending test file:** [`Pending Test for BUG-10.md`](./Pending%20Test%20for%20BUG-10.md)

---

### BUG-13 — Missing `ClassroomMoment` type
**Status:** ✅ Fixed — commit `c4c8a5c`
**Priority:** Low — pure type addition, no runtime risk
**Files:** `src/types/index.ts`, `src/hooks/useApi.ts`, `src/pages/teacher/ClassroomMoments.tsx`
**Changes:**
- Added `ClassroomMoment` interface to `src/types/index.ts` with all fields used by the component (`id`, `type`, `url`, `caption`, `status`, `tagged_children`, `event_id`, `created_by`, `created_at`, `updated_at`)
- `useMoments`: typed from `{ data: any[] }` → `{ data: ClassroomMoment[] }`; params tightened from `Record<string,any>` → `Record<string,string>`
- `useCreateMoment`: typed from `api.post<any>` → `api.post<ClassroomMoment>`
- `ClassroomMoments.tsx`: removed all `(m: any)`, `(moment: any)` annotations; `filterStatus` onValueChange given explicit union type

---

### BUG-14 — Orphaned `is_read` column
**Status:** ✅ Fixed — commit `adc0709` — migration run on Render 2026-05-27
**Priority:** Low — DB schema hygiene
**Files:** `backend/migrations/007_drop_is_read_column.sql` (new), `backend/src/types/index.ts`
**Changes:**
- Migration 007: drops `is_read` column + stale index; adds `idx_notifications_unread` partial index on `(user_id, created_at DESC) WHERE read_at IS NULL`
- `Notification` type: `is_read: boolean` → `read_at?: Date`
**Test:** After `npm run migrate` on Render — `\d notifications` shows no `is_read` column; marking a notification read sets `read_at`; unread count still correct
**Pending test file:** —

---

## New Bugs Found During Fix Sessions

### BUG-18 — `updateReportSchema` status enum too restrictive
**Status:** ✅ Fixed — commit `6cc4a69`
**Found:** During BUG-09 fix session (2026-05-26)
**File:** `backend/src/schemas/report.ts`
**Notes:** `updateReportSchema` inherited `draft | pending_review` from `createReportSchema`. The controller checked `if (data.status === 'published')` → TS2367 type error. Fixed by extending `updateReportSchema` with all 5 status values.

---

### BUG-19 — "Publish Report" in CreateReport tried to create with `status: 'published'`
**Status:** 🧪 Fixed — pending test on Vercel
**Found:** 2026-07-11, reported by user as a validation error when publishing a report from Create Report
**Priority:** High — publish workflow was completely broken from the create-report screen
**File:** `src/pages/admin/CreateReport.tsx`
**Root cause:** `onSubmit` always called `createReport.mutateAsync({ ..., status: publish ? 'published' : 'draft' })` — i.e. it tried to `POST /reports` directly with `status: 'published'`. The backend's `createReportSchema` (`backend/src/schemas/report.ts` line 30) only allows `status: 'draft' | 'pending_review'` on create, so this always failed with a 400. If "Save as Draft" had already been clicked first, a second click on "Publish Report" created a second row for the same `(child_id, quarter, year)`, tripping the DB's unique constraint and surfacing an additional 409 — on top of the 400 from the invalid status. A working dedicated endpoint (`POST /reports/:id/publish`, wrapped by `usePublishReport()` in `src/hooks/useApi.ts`) already existed but was never called from this screen.
**Changes:**
- `CreateReport.tsx`: `onSubmit` now always creates the report with `status: 'draft'`, then — only when `publish === true` — calls `publishReport.mutateAsync({ id: created.id })` using the newly created report's id.
- `isPending` now also reflects `publishReport.isPending` so the button disables through both steps.
**Learning:** When an entity has a dedicated state-transition endpoint (e.g. `/publish`, `/approve`), don't fold that transition into the generic create/update payload — the create/update schema is deliberately narrower than the full status lifecycle (see BUG-18 for the same pattern on the backend side). Always check `src/hooks/useApi.ts` for an existing hook before adding a new status value to a create call.
**Test:** Create a new report and click "Publish Report" directly (no prior draft save) → report is created and published in one flow, sponsors notified, no 400/409 in the console.
**Pending test file:** [`Pending Test for BUG-19.md`](./Pending%20Test%20for%20BUG-19.md)

---

### BUG-20 — Teachers could publish reports directly, bypassing admin review
**Status:** 🧪 Fixed — pending test on Vercel
**Found:** 2026-07-13, user noticed published reports never passed through Pending Approval
**Priority:** High — defeats the purpose of the review/approval workflow for teacher-authored reports
**File:** `src/pages/admin/CreateReport.tsx` (shared by `/dashboard/reports/new` and `/teacher/reports/new`, see `src/App.tsx`)
**Root cause:** A full review pipeline already exists (`pending_review → approved/needs_revision → published`, implemented in `src/pages/admin/ReportReview.tsx` with backend routes `/reports/:id/approve` and `/reports/:id/request-revision`), but `CreateReport.tsx` only ever offered "Save as Draft" or "Publish Report" — there was no way to enter `pending_review` from this screen, and *any* role allowed on the route (including plain `teacher`) could hit "Publish Report" and skip admin review entirely.
**Changes:**
- `CreateReport.tsx`: `onSubmit` now takes an `action: 'draft' | 'submit' | 'publish'` instead of a boolean.
  - `'submit'` creates the report with `status: 'pending_review'` (already a legal value in `createReportSchema` — no backend change needed) so it lands in the admin Report Review queue.
  - `'publish'` keeps the BUG-19 create-then-publish flow.
- Added `canPublishDirectly = hasAnyRole(['super_admin', 'admin'])`. The second action button now reads **"Submit for Review"** for teachers (→ `'submit'`) and **"Publish Report"** for admins/super_admins (→ `'publish'`), so only reviewers can bypass the queue.
**Policy decided with user:** Teachers always go through review; admins/super_admins may publish directly since they are the reviewers.
**Learning:** When a route's `allowedRoles` includes multiple roles with different authority levels (here: teacher vs admin/super_admin), don't assume the same UI action is safe for all of them — check whether the lower-privileged role should see a different action/label entirely, not just the same button gated by a disabled state.
**Test:** Log in as a teacher-only account → Create Report → second button reads "Submit for Review" → report lands with `status='pending_review'` in the admin Report Review "Pending" tab, not published. Log in as admin/super_admin → button still reads "Publish Report" and publishes immediately as before.
**Pending test file:** [`Pending Test for BUG-20.md`](./Pending%20Test%20for%20BUG-20.md)

---

### BUG-21 — Password reset link 404s (missing frontend page)
**Status:** 🧪 Fixed — pending test on Vercel
**Found:** 2026-07-15, discovered during login-provisioning investigation
**Priority:** High — password reset was completely unusable, and was the only documented fallback for a directly-added teacher/sponsor who wasn't told their password
**Files:** `src/App.tsx`, `src/pages/ResetPassword.tsx` (new), `src/components/auth/ResetPasswordForm.tsx` (new)
**Root cause:** The backend (`POST /auth/forgot-password`, `POST /auth/reset-password`) and `AuthContext.resetPassword()` were all fully implemented and correctly emailed a working `/reset-password?token=...` link — but no `/reset-password` route or page existed anywhere in the frontend. Clicking the emailed link always hit the catch-all 404.
**Changes:**
- New `ResetPasswordForm.tsx` (styled like the existing `ForgotPasswordForm.tsx`): reads `token` from the query string, takes a new password + confirmation, calls the existing `resetPassword(token, password)`, shows an invalid-link state if there's no token and a success state with a link to `/login` on completion.
- New `ResetPassword.tsx` page wrapping it; registered at `/reset-password` inside the existing `AuthLayout` route group in `App.tsx`.
- No backend changes needed — the API side already worked correctly.
**Learning:** A hook existing in `AuthContext` (or any context) doesn't mean the feature is reachable — always confirm there's a route + page actually calling it before assuming a flow works end-to-end.
**Test:** Request a password reset → click the emailed link → land on a real reset form (not a 404) → set new password → redirected/prompted to log in → new password works.
**Pending test file:** [`Pending Test for BUG-21.md`](./Pending%20Test%20for%20BUG-21.md)

---

### BUG-22 — Invite Sponsor token flow disconnected from Register page
**Status:** 🧪 Fixed — pending test on Vercel
**Found:** 2026-07-15, discovered during login-provisioning investigation
**Priority:** Medium — "Invite Sponsor" emails a link that never actually completes true invite-based signup
**Files:** `src/components/auth/RegisterForm.tsx`, `src/contexts/AuthContext.tsx`, `src/hooks/useApi.ts`
**Root cause:** `invitationsController.sendInvitation` (backend) emails a link to `/register?token=...`, and the backend's accept-invitation endpoint `POST /auth/register/:token` (`authController.registerWithInvitation`) already works correctly and logs the user in immediately. But `RegisterForm.tsx` never read the `token` query param at all — it always called plain `register()` → `POST /auth/register`, which just files a `pending_registrations` row for manual admin approval. So every invited sponsor was funneled into the generic pending-approval queue instead of being signed up (and logged in) directly via their invitation.
**Changes:**
- Added `useValidateInvitation(token)` hook (`GET /invitations/validate/:token`, public) to `src/hooks/useApi.ts`.
- Added `registerWithInvitation(token, data)` to `AuthContext` — posts to `/auth/register/:token` and logs the user in immediately using the returned tokens (same pattern as `login`).
- `RegisterForm.tsx`: detects `?token=` via `useSearchParams`. If present, validates it on mount (shows a loading/invalid state), locks the email field to the invited address, and submits via `registerWithInvitation` instead of `register` — landing the new sponsor logged in immediately. With no token, the existing self-serve/pending-approval behavior is unchanged.
**Learning:** An email template linking to `X?token=...` is only half the flow — always trace whether the page on the receiving end actually reads and uses that param, not just whether a matching backend endpoint exists.
**Test:** Admin sends an invite → click the emailed link → land on "Accept Your Invitation" with email pre-filled and locked → set a password → immediately logged in as sponsor (not sent to pending approval). Visiting `/register` with no token still shows the normal self-serve form.
**Pending test file:** [`Pending Test for BUG-22.md`](./Pending%20Test%20for%20BUG-22.md)

---

### BUG-23 — No email sent when admin creates a teacher/sponsor account directly
**Status:** 🧪 Fixed — pending test on Render
**Found:** 2026-07-15, user asked how a newly-added teacher/sponsor would log in
**Priority:** Medium — onboarding gap, not a broken feature (accounts worked, just weren't communicated)
**File:** `backend/src/controllers/authController.ts` (`createUser`)
**Root cause:** "Add Teacher"/"Add Sponsor" set a real, admin-chosen password immediately (`bcrypt.hash` + insert), so the account was always login-ready — but `createUser` never sent any email, unlike every other account-provisioning path in this codebase (`sendInvitation`, `forgotPassword`, `register`'s admin notification). The admin had no way to notify the new user except manually copying the password out-of-band.
**Changes:**
- `createUser` now emails the new user (via the existing Resend pattern, guarded by `verifyResendConfig()`) with their email, the password the admin set, and a link to `/login`, wrapped in a try/catch so a Resend outage doesn't fail account creation.
- `AddTeacher.tsx` / `AddSponsor.tsx` success toasts updated to mention the email was sent.
**Known trade-off:** this emails the password in plaintext — email isn't a secure channel. Accepted deliberately per product decision, since the account is immediately login-ready either way; the email tells the user to change their password after logging in.
**Test:** Add a teacher (or sponsor) → check that account's inbox → confirm an email arrives with the correct email/password/login link → log in with those exact credentials successfully.
**Pending test file:** [`Pending Test for BUG-23.md`](./Pending%20Test%20for%20BUG-23.md)

---

## Summary Table

| Bug | Description | Phase | Status |
|-----|-------------|-------|--------|
| BUG-01 | Notification type constants | Backend | ✅ Fixed |
| BUG-02 | `req.user?.userId` → `req.user?.id` | Backend | ✅ Fixed |
| BUG-03 | (Unblocked by BUG-02) | Backend | — |
| BUG-04 | Missing approve/requestRevision hooks | Full-stack | 🧪 Pending test |
| BUG-05 | Pagination shape mismatch | Frontend | 🧪 Pending test |
| BUG-06 | Random data in ChildProgress charts | Frontend | 🧪 Pending test |
| BUG-07 | `inactive` → `withdrawn` filter | Frontend | ✅ Fixed |
| BUG-08 | Admin role creation blocked | Full-stack | ✅ Fixed |
| BUG-09 | Stale `ProgressReport.status` type | Backend | ✅ Fixed |
| BUG-10 | `useSponsorStats` field name mismatch | Frontend | 🧪 Pending test |
| BUG-11 | `buildPaginatedQuery` escape | Backend | ✅ Fixed |
| BUG-12 | `useRemoveSponsorship` drops `end_date` | Frontend | 🧪 Pending test |
| BUG-13 | Missing `ClassroomMoment` type | Frontend | ✅ Fixed |
| BUG-14 | Orphaned `is_read` column | Backend/DB | ✅ Fixed |
| BUG-15 | No Cloudinary startup validation | Backend | 🧪 Pending test |
| BUG-16 | Duplicate role-array parsing | Backend | 🧪 Pending test |
| BUG-17 | Sponsor route URL mismatch | Frontend | 🧪 Pending test |
| BUG-18 | `updateReportSchema` status too narrow | Backend | ✅ Fixed |
| BUG-19 | Publish flow created report with invalid status | Frontend | 🧪 Pending test |
| BUG-20 | Teachers could publish reports directly, bypassing review | Frontend | 🧪 Pending test |
| BUG-21 | Password reset link 404s (missing frontend page) | Frontend | 🧪 Pending test |
| BUG-22 | Invite Sponsor token flow disconnected from Register | Full-stack | 🧪 Pending test |
| BUG-23 | No email sent when admin creates teacher/sponsor | Backend | 🧪 Pending test |

---

*Last updated: 2026-07-15 — Session 5 (BUG-21, BUG-22, BUG-23 found & fixed)*
