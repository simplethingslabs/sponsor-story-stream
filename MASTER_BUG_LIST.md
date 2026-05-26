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
**Status:** ⬜ Not fixed
**Priority:** Medium
**File:** `src/pages/admin/ChildrenList.tsx` ~line 82
**Notes:** Change `'inactive'` → `'withdrawn'` to match actual DB values
**Test:** Apply Withdrawn filter → confirm it returns withdrawn children

---

### BUG-04 — Missing frontend hooks for approve/requestRevision
**Status:** ⬜ Not fixed
**Priority:** Medium
**File:** `src/hooks/useApi.ts`
**Notes:** Add `useApproveReport` and `useRequestRevision` hooks
**Test:** Hooks exist and can be called from report detail page

---

### BUG-08 — Admin role creation blocked by schema
**Status:** ⬜ Not fixed
**Priority:** Medium
**Files:** Backend schema (`z.enum(['teacher', 'sponsor'])` → include `'admin'`), `src/hooks/useApi.ts`
**Test:** Create a new admin user via the UI → confirm `roles = ['admin']`

---

### BUG-06 — Random data in ChildProgress charts
**Status:** ⬜ Not fixed
**Priority:** Medium — misleading to sponsors
**File:** `src/pages/sponsor/ChildProgress.tsx`
**Notes:** Replace random chart data with real report field data or a clear placeholder state
**Test:** Sponsor views child progress → no random/misleading numbers shown

---

### BUG-12 — `useRemoveSponsorship` drops `end_date`
**Status:** ⬜ Not fixed
**Priority:** Medium — data integrity issue
**File:** `src/hooks/useApi.ts`
**Notes:** Switch from `api.delete` to `api.patch` or `api.put` to carry the body. Confirm backend route accepts body on termination endpoint.
**Test:** End a sponsorship → confirm `end_date` saved in DB

---

### BUG-10 — `useSponsorStats` field name mismatch
**Status:** ✅ Fixed — commit `f86e13c`
**Files:** `src/types/index.ts`, `src/hooks/useApi.ts`, `src/pages/sponsor/SponsorHome.tsx`
**Root cause:** Endpoint `GET /sponsors/stats` existed and worked. Frontend component accessed `statsData?.totalQuarters` and `statsData?.newReportsCount` — neither field exists in the backend response (which uses snake_case: `total_reports`, `recent_reports`, etc.). Both stats showed 0 permanently.
**Changes:**
- Added `SponsorStats` interface to `src/types/index.ts` with all 5 backend fields
- `useSponsorStats`: `api.get<any>` → `api.get<SponsorStats>` for compile-time safety
- `SponsorHome.tsx`: `statsData?.totalQuarters` → `statsData?.total_reports`; `statsData?.newReportsCount` → `statsData?.recent_reports`
**Test:** Login as sponsor → Home page shows non-zero "Quarters of Support" and "New Reports" stats

---

### BUG-13 — Missing `ClassroomMoment` type
**Status:** ⬜ Not fixed
**Priority:** Low — pure type addition, no runtime risk
**File:** `src/types/index.ts`
**Notes:** Define missing interface

---

### BUG-14 — Orphaned `is_read` column
**Status:** 🧪 Fixed — commit `adc0709` — pending migration run on Render
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

## Summary Table

| Bug | Description | Phase | Status |
|-----|-------------|-------|--------|
| BUG-01 | Notification type constants | Backend | ✅ Fixed |
| BUG-02 | `req.user?.userId` → `req.user?.id` | Backend | ✅ Fixed |
| BUG-03 | (Unblocked by BUG-02) | Backend | — |
| BUG-04 | Missing approve/requestRevision hooks | Frontend | ⬜ |
| BUG-05 | Pagination shape mismatch | Frontend | 🧪 Pending test |
| BUG-06 | Random data in ChildProgress charts | Frontend | ⬜ |
| BUG-07 | `inactive` → `withdrawn` filter | Frontend | ⬜ |
| BUG-08 | Admin role creation blocked | Frontend | ⬜ |
| BUG-09 | Stale `ProgressReport.status` type | Backend | ✅ Fixed |
| BUG-10 | `useSponsorStats` field name mismatch | Frontend | ✅ Fixed |
| BUG-11 | `buildPaginatedQuery` escape | Backend | ✅ Fixed |
| BUG-12 | `useRemoveSponsorship` drops `end_date` | Frontend | ⬜ |
| BUG-13 | Missing `ClassroomMoment` type | Frontend | ⬜ |
| BUG-14 | Orphaned `is_read` column | Backend/DB | 🧪 Pending migration |
| BUG-15 | No Cloudinary startup validation | Backend | 🧪 Pending test |
| BUG-16 | Duplicate role-array parsing | Backend | 🧪 Pending test |
| BUG-17 | Sponsor route URL mismatch | Frontend | 🧪 Pending test |
| BUG-18 | `updateReportSchema` status too narrow | Backend | ✅ Fixed |

---

*Last updated: 2026-05-27 — Session 3*
