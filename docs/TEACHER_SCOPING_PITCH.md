# Pitch: Scope Students and Reports to the Logged-In Teacher

## Problem

Every teacher account sees the exact same single student ("Nandini Sharma", LKG)
on the dashboard and "My Students" page, and the "Reports Needing Attention"
widget is not reliably tied to the logged-in teacher's own reports either. Both
bugs share one root cause: the backend never scopes these queries by `req.user.id`.

**Students** — there is no `teacher_id` column on `children`, and no
assignment/join table in any migration (checked 001–008). `getChildren`
(`backend/src/controllers/childrenController.ts:8`) builds its `WHERE` clause
only from `search`/`status`/`grade` query params — it never reads `req.user`.
So `GET /children` returns the entire `children` table to every caller,
regardless of role or identity. The dashboard renders whatever comes back under
the label "Students assigned to you" (`src/pages/teacher/TeacherDashboard.tsx:30`),
which is misleading since nothing is actually scoped. "Nandini Sharma" is not
hardcoded or mock data anywhere in source (confirmed via full-repo search) — she's
a real row that happens to be the only (or first) active child in the live DB, so
every teacher sees her.

**Reports** — the status lifecycle
(`draft → pending_review → needs_revision → approved → published`) and the admin
"request revision" flow are genuinely implemented end-to-end: `requestRevision`
(`backend/src/controllers/reportsController.ts:369`) updates status, feedback,
`reviewed_by`, and fires a notification — this is not a stub. `getReports`
already supports a `teacher_id` filter (`backend/src/controllers/reportsController.ts:24-27`),
but it's opt-in via query param, and the frontend calls `useReports()` with no
params at all (`src/pages/teacher/TeacherDashboard.tsx:31`). The widget then
filters client-side over *every teacher's* reports system-wide. It currently
shows "All caught up!" for everyone, which is coincidental — a symptom of there
being nothing in `draft`/`needs_revision` status globally right now, not proof
the widget is scoped correctly per teacher.

## Appetite

Small batch. Two backend query changes plus one schema migration for the
assignment relationship. No frontend rewrite — `TeacherDashboard.tsx` and
`TeacherStudents.tsx` keep calling the same hooks once the backend enforces
scoping.

**Confirmed: no assignment UI exists anywhere in the stack today**, not even a
partial or unused piece. Checked every layer:
- `AddChild.tsx` / `EditChild.tsx` forms have no teacher field — only
  `first_name/last_name/dob/grade/photo_url/enrollment_date/status`.
- `createChildSchema`/`updateChildSchema` (`backend/src/schemas/child.ts`)
  define no teacher-related field, and `childrenController.ts`'s
  `createChild`/`updateChild` INSERT/UPDATE statements don't reference one.
- `TeachersList.tsx` / `TeacherDetail.tsx` show only account info (name, email,
  phone, created date) — no roster or student count.
- The only existing `teacher_id` columns in the schema
  (`progress_reports`, `classroom_moments`) are authorship references ("who
  wrote this"), not roster/assignment relationships — nothing to repurpose.

So this is a feature to build from scratch, not a wiring fix. Confirmed model:
**one teacher per student, reassignable by admin at any time** — a single
nullable `teacher_id` on `children` (not a join table), since it's a
current-state pointer rather than a history of assignments. The sketch is:

- **Migration**: add `teacher_id UUID NULL REFERENCES users(id)` to the
  `children` table. Nullable because existing rows have no assignment yet, and
  a child could plausibly be momentarily unassigned (e.g. between teachers).
- **Admin UI**:
  - Add a teacher-select field to `AddChild.tsx` and `EditChild.tsx`, editable
    at any time on the edit form — this is the reassignment path, not just
    initial creation.
  - Add a roster/student-list section to `TeacherDetail.tsx` (and/or a student
    count on `TeachersList.tsx`) so admin can see current assignments before
    changing them.
- **Backend**: add `teacher_id` to `createChildSchema`/`updateChildSchema` and
  wire it into `createChild`/`updateChild` in `childrenController.ts` —
  `updateChild` in particular must allow setting it to a *different* teacher on
  an existing child, not just at creation.
- **`getChildren`**: when `req.user.role === 'teacher'`, force-filter by
  `teacher_id = req.user.id`, mirroring the pattern already used correctly in
  `getChildrenForSponsor` (`backend/src/controllers/childrenController.ts:319`).
- **`getReports`**: same fix — force `teacher_id = req.user.id` when the caller's
  role is `teacher`, using the filter that already exists in the query builder
  but currently isn't auto-applied. Reports already carry their own
  `teacher_id` set at creation time (the report's author) — reassigning a
  child to a new teacher should **not** retroactively change authorship on
  past reports; only future reports for that child are written by the new
  teacher. Worth flagging to admin/product as a explicit behavior, not an
  oversight.
- **Backfill**: every existing `children` row needs a real `teacher_id`, set by
  an admin through the new UI once it exists — no scripted/guessed assignment.

## Rabbit holes

- **Reassignment and report history interact**: since `progress_reports.teacher_id`
  is set per-report at creation and `children.teacher_id` can change later, a
  child's report history can legitimately span multiple teachers over time.
  Any "reports for my students" view for a teacher must stay scoped to reports
  *they* authored, not all reports for children currently assigned to them —
  otherwise reassigning a child mid-term would surface another teacher's past
  reports.
- **This is UI + backend + migration, not just a query fix**: the original
  framing ("admin already assigns this somewhere") turned out to be wrong —
  budget for building the assignment surface itself, not only scoping existing
  queries.
- **Backfill is manual**: there's no existing source of truth for "which
  teacher has which student," so every current child record needs to be
  assigned one at a time through the new UI after it ships.

## No-gos

- No many-to-many co-teaching model — one teacher per student, confirmed.
- No assignment-history table (who was assigned when) unless later requested —
  `children.teacher_id` is a current-state pointer only.
- No changes to the in-progress attendance rework (`AttendanceOverview.tsx`,
  `008_quarterly_attendance.sql`) — unrelated, separate effort already underway.
- No changes to the "request revision" flow itself — it already works correctly
  once report queries are scoped.

## Implementation Slices

Ordered so each slice is independently shippable and testable, and so
read-side enforcement (Slice 5) only lands after real data exists to be
scoped — enforcing scoping before backfill would just show every teacher an
empty dashboard instead of a wrong one.

**Slice 1 — Migration only.**
Add `teacher_id UUID NULL REFERENCES users(id)` to `children`
(`backend/migrations/009_children_teacher_id.sql`). No app code changes. Purely
additive and backwards-compatible — nothing reads or writes the column yet.
Test: migration runs clean on a copy of prod data; existing queries unaffected.

**Slice 2 — Backend write support.**
Add `teacher_id` (optional, nullable) to `createChildSchema` and
`updateChildSchema` (`backend/src/schemas/child.ts`); wire it into the
`createChild`/`updateChild` INSERT/UPDATE statements in
`childrenController.ts`. Confirm `updateChild` allows changing an
already-set `teacher_id` to a different one (the reassignment path), not just
setting it once. No frontend changes yet — verify via direct API calls
(Postman/curl) against a staging admin token.
Test: create a child with a teacher_id; update it to a different teacher_id;
confirm both persist correctly.

**Slice 3 — Admin UI: assign on create/edit.**
Add a teacher-select field to `AddChild.tsx` and `EditChild.tsx`, populated
from the existing teachers list endpoint. Ship with `getChildren`/`getReports`
still unscoped, so this is low-risk — it only adds the ability to set data,
doesn't change what anyone sees yet.
Test: admin can set and change a child's teacher from the UI; value round-trips
on page reload.

**Slice 4 — Admin UI: visibility before enforcement.**
Add a roster/student-list section to `TeacherDetail.tsx` (and/or a student
count column on `TeachersList.tsx`), so admin can see current assignments.
This is the check-your-work step before backfill — confirms Slice 2/3 actually
persisted correctly across all existing children.
Test: admin can see, for any teacher, exactly which children are currently
assigned.

**Slice 5 — Backfill (data, not code).**
Admin goes through every existing child record via the Slice 3 UI and assigns
the correct real teacher, using Slice 4's roster view to confirm as they go.
Blocking dependency for Slice 6 — do not enable enforcement until this is
complete, or teachers will see partially-empty rosters.
Test: Slice 4's roster view shows zero unassigned active children.

**Slice 6 — Enforce scoping on `getChildren`.**
In `childrenController.ts`, when `req.user.role === 'teacher'`, force-filter
by `teacher_id = req.user.id`, mirroring `getChildrenForSponsor`
(`backend/src/controllers/childrenController.ts:319`). This is the slice that
actually fixes the "everyone sees Nandini Sharma" bug.
Test: log in as two different teacher accounts with known distinct
assignments; each sees only their own students on the dashboard and
`TeacherStudents.tsx`.

**Slice 7 — Enforce scoping on `getReports`.**
Force `teacher_id = req.user.id` (the report's author) when caller role is
`teacher`, using the filter that already exists in `getReports`
(`backend/src/controllers/reportsController.ts:24-27`) but isn't
auto-applied. Scope by report authorship, not by the child's current
`teacher_id` — see the Rabbit hole above on reassignment vs. report history.
Test: as a teacher with existing draft/needs_revision reports, confirm only
their own reports appear in "Reports Needing Attention"; confirm a
reassigned child's past reports (authored by a different teacher) don't leak
into the new teacher's view.

**Slice 8 — Regression pass.**
Re-check `TeacherDashboard.tsx`'s other stats that depend on the
now-filtered children/reports lists (student count, attendance %, moments
count) render correctly per-teacher, and that admin-side views
(`AttendanceOverview.tsx`, `ReportsList.tsx`, etc.) — which should remain
unscoped/global for admin — are unaffected by the new filters.
