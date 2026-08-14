# Quarterly Attendance % — Implementation Notes

Companion to [ATTENDANCE_PITCH.md](./ATTENDANCE_PITCH.md), which covers the
shape-up plan. This doc covers what was actually built, why each piece exists,
and where to find it.

## What changed, in one paragraph

The Teacher Dashboard's "Today's Attendance" stat was fake (`attendanceMarked = 3`,
a hardcoded constant never wired to data), sitting on top of a daily
present/absent/late attendance system that nothing downstream consumed. Both are
gone. In their place: a single `attendance_percentage` field on each quarterly
Progress Report, filled in by the teacher, required before that report can be
published, and displayed everywhere reports already flow — Teacher Dashboard,
a repurposed `/teacher/attendance` view, a new Admin rollup page, and the Sponsor
report detail page.

## Why this shape

- **Daily granularity wasn't used for anything.** The `attendance` table existed
  and had a full marking UI, but no reporting surface ever read from it — the
  dashboard stat was hardcoded instead. Removing it was a net simplification,
  not a loss of working functionality.
- **Reports are already quarterly.** Progress Reports carry `quarter` + `year`
  and go through a draft → review → publish workflow. Piggybacking attendance on
  that cadence means no new period-tracking concept, no school-calendar
  modeling, and one place for the teacher to enter it instead of two.
- **Manual entry, not computed.** Early drafts of this plan considered
  aggregating daily records into a percentage. The user simplified this
  directly: teachers just type in the number they already know, once per
  quarter, while writing the report anyway.
- **Fresh start over migration.** Only 4 reports existed in production at
  implementation time, so wiping `progress_reports` for a clean
  `attendance_percentage` column was simpler and safer than writing a backfill
  for data that didn't need to survive. Confirmed explicitly with the user
  before running (see Rollout below).

## How it works — by layer

### Database (`backend/migrations/008_quarterly_attendance.sql`)

- `progress_reports.attendance_percentage` — `NUMERIC(5,2)`, nullable, with a
  check constraint (`IS NULL OR (>= 0 AND <= 100)`). Nullable because it's
  optional for drafts — only required at publish time (enforced in code, not
  the DB, since the DB can't see which HTTP transition is in flight).
- `TRUNCATE TABLE progress_reports CASCADE` — clears existing reports and,
  via cascade, their `report_media` rows (FK `ON DELETE CASCADE`).
- `attendance` table, its `update_attendance_updated_at()` trigger function, and
  the trigger itself are all dropped.

Applied directly against the Supabase database on 2026-08-14; verified via
`\d progress_reports` (column + check constraint present), a row count (0), and
`to_regclass('public.attendance')` (null — table gone).

### Backend (`backend/src/`)

- **`schemas/report.ts`** — `attendance_percentage: z.number().min(0).max(100).optional().nullable()`
  added to `createReportSchema`. `updateReportSchema` inherits it automatically
  since it's `createReportSchema.partial().omit({child_id: true}).extend(...)`.
- **`controllers/reportsController.ts`**:
  - `createReport` — inserts `attendance_percentage` (defaults to `null`).
  - `updateReport` — accepts the field in the dynamic `SET` clause. Guard: if
    `data.status === 'published'`, resolve the *final* attendance value (either
    the incoming update or, if attendance isn't part of this request, the
    existing DB row's value) and 400 if it's null.
  - `publishReport` (`POST /:id/publish`) — separately checks the existing row's
    `attendance_percentage` before publishing and 400s if null.
  - **Why both places**: `PUT /:id` with `status: 'published'` in the body and
    `POST /:id/publish` are two independent paths to the same end state. A guard
    in only one would leave the other unprotected.
- **Removed**: `controllers/attendanceController.ts`, `routes/attendance.ts`,
  and their registration in `routes/index.ts`.

### Frontend (`src/`)

- **`types/index.ts`** — `ProgressReport.attendance_percentage?: number | null`.
- **`hooks/useApi.ts`** — `useAttendance`/`useSaveAttendance` and the
  `queryKeys.attendance` entry removed; no replacement hooks needed since
  attendance now rides along on the existing report hooks
  (`useReports`, `useCreateReport`, `useUpdateReport`, `usePublishReport`).
- **`components/EmptyState.tsx`** (new) — the first shared empty-state component
  in the codebase. Every other empty state in the app was a bespoke inline
  block; this one exists because "not yet reported" needed to render identically
  in 4 separate places (see below).
- **`pages/admin/CreateReport.tsx`** / **`EditReport.tsx`** — new "Attendance %"
  number input. Publish is blocked client-side (toast + early return) if the
  value is empty, mirroring the server-side guard for fast feedback.
  - In `EditReport.tsx`, publishing now calls `updateReport` before
    `publishReport`, so an attendance value entered in the same session is
    actually saved before the publish transition — previously, publish
    skipped saving the form entirely.
- **`pages/admin/ReportReview.tsx`** — the single-report "Publish" button and
  the "Publish All" bulk action both check `attendance_percentage` first and
  refuse (with a toast pointing back to the edit page) rather than silently
  publishing an incomplete report.
- **`pages/teacher/TeacherDashboard.tsx`** — the old hardcoded stat is replaced
  with a real average of `attendance_percentage` across the teacher's own
  students' published reports for the current quarter/year, or the `EmptyState`
  if none exist yet. The "Mark Attendance" quick action is now "View
  Attendance", linking to the repurposed page below.
- **`pages/teacher/Attendance.tsx`** (new, replaces the deleted
  `AttendanceMarking.tsx`) — a read-only view at the same `/teacher/attendance`
  route: quarter/year picker, average card, per-student list pulled from
  published reports.
- **`pages/admin/AttendanceOverview.tsx`** (new) — the admin-side equivalent,
  routed at `/dashboard/attendance` and linked from the sidebar
  (`AdminLayout.tsx`), showing every active child's attendance for a selected
  quarter/year in a table.
- **`pages/sponsor/ReportDetail.tsx`** — an "Attendance" card added between the
  report header and the growth narrative, showing the percentage or the empty
  state. This same component also serves the admin-side report detail view
  (`isAdmin` swaps the layout), so both surfaces got it in one edit.

## Rollout

1. Implementation approved by the user across several rounds of scoping
   (quarterly-not-monthly, manual entry, required-at-publish, shared empty
   state, server-side guard location) — see conversation history / the pitch
   doc for the decision trail.
2. Destructive delete of existing reports confirmed explicitly before the
   migration ran.
3. Migration applied directly against the production Supabase instance via
   `psql`, since no local `.env`/`DATABASE_URL` existed in this workspace to
   run it against a dev database instead.
4. `tsc --noEmit` run clean on both `src/` and `backend/` after all edits.

## What's deliberately not here

- No monthly breakdown — quarterly only, matching the report cadence.
- No computation from historical daily attendance — that data source is gone.
- No backfill of the 4 deleted reports.
- No school-calendar / instructional-days modeling.
- The Teacher Portal's unconditional visibility to admin users (sidebar link +
  route `allowedRoles`) is unrelated and intentionally untouched — tracked
  separately, not part of this work.
