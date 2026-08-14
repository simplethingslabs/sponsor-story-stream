# Implementation Record: Teacher–Student Scoping

Companion to [TEACHER_SCOPING_PITCH.md](./TEACHER_SCOPING_PITCH.md) — that
document is the plan; this one records what was actually built, why, and what
to watch out for. Written after all 8 slices shipped.

## Why

Every teacher account showed the exact same single student ("Nandini Sharma")
on their dashboard, and the "Reports Needing Attention" widget wasn't
reliably tied to the logged-in teacher's own reports. Root cause: `children`
had no concept of which teacher a student belonged to, and even where a
`teacher_id` filter already existed (on reports), nothing forced it to apply
automatically for a teacher's own requests. Investigation also found there
was no admin UI to make such an assignment in the first place — this was a
feature to build, not a bug to patch.

## What was built, slice by slice

**Slice 1 — Migration.** `backend/migrations/009_children_teacher_id.sql`
adds a nullable `teacher_id UUID REFERENCES users(id)` to `children`, plus a
partial index (`WHERE deleted_at IS NULL`) for the scoped queries added
later. Applied directly to the production Supabase database. Purely
additive — no behavior changed at this point.

**Slice 2 — Backend write path.** `backend/src/schemas/child.ts` gained an
optional/nullable `teacher_id` on `createChildSchema` (inherited by
`updateChildSchema` via `.partial()`). `backend/src/controllers/childrenController.ts`
wired it into `createChild`'s INSERT and `updateChild`'s conditional UPDATE
builder — the latter specifically supports reassignment (setting an
already-assigned child to a *different* teacher, or to `null` to unassign),
not just first-time assignment.

**Slice 3 — Admin UI to assign.** `src/pages/admin/AddChild.tsx` and
`EditChild.tsx` each gained a teacher `Select` populated from the existing
`useTeachers()` hook, using an `"unassigned"` sentinel value (Radix `Select`
disallows an empty-string item value). On submit: `unassigned` → `undefined`
on create (field omitted), `unassigned` → `null` on update (field explicitly
cleared) — the create/update asymmetry mirrors how `updateChild` only skips
fields that are `undefined`, so unassigning on edit requires sending `null`.

**Slice 4 — Admin UI to verify.** `TeacherDetail.tsx` gained an "Assigned
Students" card listing everyone currently pointed at that teacher, linking
through to `ChildDetail.tsx`. `TeachersList.tsx` gained a "Students" count
column. Both compute this client-side from `useChildren({ limit: 100 })`
grouped/filtered by `teacher_id` — no backend change, since the fetched
dataset is small enough at current school scale (see Caveats).

**Slice 5 — Backfill.** Data-only step, no code. There was exactly one real
child record in the database ("Nandini Sharma", LKG). Asked which teacher she
should be assigned to (answer: Prerna Kaushik), applied it directly against
the production DB, and confirmed zero unassigned active children remained.

**Slice 6 — Enforce scoping on `getChildren`.**
`backend/src/controllers/childrenController.ts`: when the caller's roles
include `teacher` but not `admin`/`super_admin`, `getChildren` now forces
`AND c.teacher_id = <user id>` into the query. Admins/super-admins are
unaffected regardless of whether they also happen to hold the `teacher` role
— this mirrors the existing `isAdmin`/`isStaff` role-combination checks
already used in `backend/src/middleware/authorize.ts`.

**Slice 7 — Enforce scoping on `getReports`.**
`backend/src/controllers/reportsController.ts`: same role check: teacher-only
callers get `AND r.teacher_id = <user id>` forced in, which **overrides**
(not just defaults) any `teacher_id` query param the client sends — a teacher
can no longer pass someone else's ID to see their reports. Admins keep the
existing opt-in `teacher_id` filter, unscoped by default. Note this scopes by
report *authorship*, not by the child's *current* teacher assignment — see
Caveats.

**Slice 8 — Regression pass.** No code changes; verified by reading through
every page that calls `useChildren`/`useReports` (teacher and admin) and by
checking route role-gates in `App.tsx`. All teacher-portal pages inherit
correct scoping automatically, since the fix lives entirely server-side. All
admin-only pages remain unaffected because the scoping check requires the
`teacher` role and *not* `admin`/`super_admin`.

## How it was verified

No automated tests exist for this area, so verification was done directly
against the production database at each stage that touched data or query
behavior:
- Slice 1: confirmed column + index via `\d children` before and after.
- Slice 2: inserted a test child with a `teacher_id`, updated it to a
  *different* teacher, confirmed both persisted, deleted the test row.
- Slice 5: confirmed `SELECT COUNT(*) ... WHERE teacher_id IS NULL` returns 0
  for active children after the backfill.
- Slice 6: simulated the exact `getChildren` WHERE clause for two different
  teacher accounts (one assigned, one not) and for the admin account,
  confirming each saw exactly what they should.
- Slice 7: inserted two synthetic `progress_reports` rows authored by two
  different teachers, ran the scoped query for each, confirmed no
  cross-visibility, deleted the test rows.
- Throughout: `tsc --noEmit` on both `backend/` and the frontend after every
  code change, all clean.
- Not done: a full browser walkthrough of the Add/Edit Child forms and the
  Teacher/Admin dashboards. The dev server didn't stay up in this shell
  environment and there's no browser-automation tool available here — code
  review and type-checking were the substitute. Worth a manual click-through
  before considering this fully done.

## Caveats and things to watch

- **Report authorship vs. current assignment can diverge.** `children.teacher_id`
  is a current-state pointer that can change (Slice 3's edit form allows
  reassignment at any time). `progress_reports.teacher_id` is fixed at
  creation — who wrote it. If a child is reassigned mid-term, their past
  reports stay attributed to the old teacher and won't appear in the new
  teacher's "Reports Needing Attention" widget, by design. If this ever
  needs to change (e.g. a new teacher should see a reassigned child's full
  report history regardless of author), that's a deliberate follow-up
  decision, not something to silently patch.
- **Roster views cap at 100 children.** `TeachersList.tsx` and
  `TeacherDetail.tsx` fetch children with `limit: 100` and filter
  client-side. Fine at current scale (one real child in the system); if the
  school's roster ever exceeds 100, these views will silently undercount
  until pagination is added. No alarm is raised today — just noting it.
- **No visual/browser verification.** All checks were type-level or
  direct-SQL simulations of the exact queries the controllers run. The
  actual UI (dropdowns rendering, form submission round-trips, dashboard
  card layout with real teacher accounts) has not been visually confirmed in
  a browser in this session.
- **`teacher_id` accepts any UUID, not just teachers.** The Zod schema
  validates it's a UUID but doesn't check the referenced user actually has
  the `teacher` role — the DB foreign key only requires it reference *some*
  row in `users`. Not a practical risk today since the only place it's set
  is the admin form's teacher dropdown (which only lists real teachers), but
  worth knowing if `teacher_id` is ever set through a different path later.
- **`children.teacher_id` has no assignment history.** By design (see
  pitch's No-gos) — it's a pointer, not a log. If "who was this child's
  teacher last quarter" is ever needed, that's new scope, not something this
  work tracks.
- **Unrelated pre-existing bug spotted, not fixed**: `TeacherDashboard.tsx`'s
  "Moments This Month" stat is still a hardcoded `'12'`, unconnected to any
  of this work. Left alone since it's out of scope for this pitch.
