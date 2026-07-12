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

---

*Last updated: 2026-07-11 — Session 4 (BUG-19 found & fixed)*
