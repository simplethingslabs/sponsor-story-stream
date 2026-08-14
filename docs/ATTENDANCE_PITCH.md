# Pitch: Quarterly Attendance % via Progress Reports

## Problem

The Teacher Dashboard's "Today's Attendance" card is fake — `attendanceMarked = 3` is
a hardcoded constant in `TeacherDashboard.tsx`, never wired to real data. The daily
attendance system behind it (`attendance` table, Mark Attendance page, per-day
present/absent/late marking) exists but nothing downstream actually consumes it for
reporting, and daily granularity isn't what anyone needs — Progress Reports are
already prepared quarterly, and attendance should be reported on the same cadence.

## Appetite

Small. This is a net simplification: remove a table, a controller, a route file, a
set of hooks, and a page; replace with one new field plus some display wiring.

## Solution

**Data model** — add `attendance_percentage` (0–100, nullable) to the `reports`
table, tied to the report's existing `quarter` + `year`. No monthly breakdown, no
derived averaging, no school-calendar modeling.

**Entry point** — `CreateReport.tsx` / `EditReport.tsx` gain one "Attendance %"
numeric input alongside the existing quarter/year fields.

**Validation** — required to **Publish**, optional for **Save Draft** or **Submit
for Review**. There are two server-side paths that can set a report to `published`
(`POST /:id/publish` and the generic `PUT /:id` with `status: 'published'` in the
body), so the guard must live in **both** `publishReport` and `updateReport` in
`backend/src/controllers/reportsController.ts` — reject with a 400 if the target
status is `published` and `attendance_percentage` is null. A client-side pre-check
in `EditReport.tsx`'s publish button and `ReportReview.tsx`'s publish action can be
added for fail-fast UX, but isn't sufficient on its own since `PUT /:id` bypasses
that button logic entirely.

**Display surfaces** — all read from the report record, no new aggregation
endpoints needed:
- Teacher Dashboard: replace the fake stat card with this quarter's attendance %,
  or the shared "not yet reported" empty state if no published report exists yet
  for the current quarter.
- `/teacher/attendance`: repurposed from a daily-marking page (`AttendanceMarking.tsx`,
  currently built around per-day present/absent/late records) into a read view —
  per-student list with a quarter picker, showing percentages from past reports,
  with the same empty state for gaps.
- Admin portal: a rollup view (per class or per student) reading the same
  report-derived percentages, empty state per row where nothing's published yet.
- Sponsor portal: surface the percentage on `ReportDetail.tsx`, with the empty
  state when the child's latest report has no attendance value.

**Empty state** — no shared `EmptyState` component exists anywhere in the app today
(every empty state is a bespoke inline conditional block, e.g. `TeacherDashboard.tsx`'s
"All caught up! No pending reports."). Since "not yet reported" repeats identically
across all 4 surfaces above, introduce one small shared `EmptyState` component and
use it in all 4 places, rather than four separate inline blocks.

**Fresh start** — existing `reports` rows don't need to carry forward. Delete
existing reports (and dependent rows, e.g. review/feedback records) rather than
backfilling the new column. **This is a destructive step on real data and requires
explicit confirmation before running**, separate from approval of this pitch.

**Removal** — drop the daily `attendance` table and its supporting code, since no
historical daily-attendance data needs preserving:
- Backend: migration to drop the `attendance` table, delete
  `attendanceController.ts`, delete `routes/attendance.ts`.
- Frontend: delete `useAttendance`/`useSaveAttendance` from `useApi.ts`, delete the
  daily Mark Attendance UI, remove the "Mark Attendance" quick action from the
  Teacher Dashboard.

## Rabbit holes

- **`AttendanceMarking.tsx` rewrite**: this file's entire data model is per-day
  present/absent/late records; repurposing `/teacher/attendance` into a
  report-driven quarterly read view is closer to a rewrite than an edit.
- **Two publish paths**: `PUT /:id` and `POST /:id/publish` both need the guard
  (see Validation above) — easy to fix one and miss the other.

## No-gos

- No monthly granularity — quarterly only, matching the report cadence.
- No computation from historical daily attendance records.
- No migration/backfill of existing reports — clean slate.
- No school-calendar / instructional-days modeling.

## Deferred (tracked separately)

Admin's unconditional access to the Teacher Portal (sidebar link + route
`allowedRoles` both include `admin`/`super_admin`) is a related but separate
question, intentionally left for a later decision.
