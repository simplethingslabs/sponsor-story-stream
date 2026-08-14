# Teacher Portal Navigation Dead-End: Implementation Record

Status: Shipped
Commit: `b3aa95e` (back-link) — the admin-sidebar removal landed in the same
working session but was folded into the concurrent `23d0236` attendance
commit's diff to `AdminLayout.tsx` rather than its own commit.

This records the bug, why it happened, and what was changed, so the
reasoning isn't lost after the fact.

## Problem

Reported by the user: clicking into the Teacher Portal from the admin
sidebar made the admin sidebar disappear entirely, with no way back to
the Admin Dashboard — except that clicking "Create Report" from inside
the Teacher Portal happened to bring the admin sidebar back, which was
confusing on its own.

## Root cause

The app has two fully independent layout shells, each with its own
self-contained sidebar/header:

- `src/components/layouts/AdminLayout.tsx`
- `src/components/layouts/TeacherLayout.tsx`

Routing in `src/App.tsx` is flat — there is no nested parent route or
shared shell wrapping both `/dashboard/*` and `/teacher/*`. Each page
component wraps itself in whichever layout it imports. Clicking the
admin sidebar's "Teacher Portal" link navigated to `/teacher`, a sibling
route tree rendered by `TeacherDashboard`, which wraps itself in
`TeacherLayout` — a full swap of chrome, not a nested view. `TeacherLayout`
had no link back to `/dashboard` anywhere, so every teacher-portal page
(Dashboard, My Students, Attendance, Classroom Moments, Progress Reports)
was a dead end for an admin who'd navigated in.

The "Create Report" exception was incidental, not a real exit path:
`/teacher/reports/new` and `/dashboard/reports/new` both route to the
same `src/pages/admin/CreateReport.tsx` component, which is hardcoded to
always render `AdminLayout` regardless of which route reached it. That's
why the admin sidebar reappeared there and nowhere else.

## Decision

Two changes, chosen for being the smallest fix that closes the dead end
without touching routing or the `CreateReport` page:

**1. Add a role-gated "Back to Admin Dashboard" link inside `TeacherLayout`.**
`Sidebar()` in `TeacherLayout.tsx` now reads `hasRole` from `useAuth()`
and, when the viewer is `super_admin` or `admin`, renders a link to
`/dashboard` above the main nav list. Real teachers (`role: 'teacher'`)
never see it, since they have no admin dashboard to return to.

**2. Remove the "Teacher Portal" entry from the admin sidebar.**
Once discussing the fix, the user asked why the Teacher Portal link was
in the admin nav at all. Answer: it's a legitimate escape hatch for
admins to act as a teacher directly — covering for an absent teacher,
or previewing the teacher-facing UI — not a mistake to remove outright.
But since it was mostly a dead end today, the simplest cleanup was to
stop surfacing it as a discoverable nav item in `AdminLayout.tsx`
(removed the `teacherNavigation` array and its "Teacher" section from
`Sidebar()`), while leaving the `/teacher` route's role protection in
`App.tsx` untouched — `super_admin`/`admin` can still reach it directly
if needed, they just no longer have a one-click link into it.

The two changes are complementary: hiding the link reduces how often an
admin lands in the Teacher Portal at all, and the back-link is a safety
net for the cases where they still do (direct URL, browser back/forward,
a bookmark, or a future re-add of the link).

## What changed

- `src/components/layouts/TeacherLayout.tsx` — `Sidebar()` now computes
  `isAdminViewing = hasRole('super_admin') || hasRole('admin')` and
  conditionally renders a `Link` to `/dashboard` (icon: `ArrowLeft`)
  above the main navigation, followed by a divider.
- `src/components/layouts/AdminLayout.tsx` — removed the
  `teacherNavigation` array and the "Teacher" section of `Sidebar()`
  that rendered the "Teacher Portal" link. `GraduationCap` (still used
  for the logo and the "Teachers" list nav item) and `App.tsx`'s
  `/teacher` route protection were left untouched.

## Rabbit holes avoided (per the plan)

- Did not unify `AdminLayout` and `TeacherLayout` into one shared shell
  with nested `<Outlet>` routes. That's a legitimate bigger refactor but
  would touch every admin and teacher route in `App.tsx` — out of scope
  for closing a navigation dead end.
- Did not make `CreateReport.tsx` context-aware (choosing `AdminLayout`
  vs. `TeacherLayout` based on which route reached it). The bug wasn't
  about that page; it was about the other four teacher pages having no
  exit.

## Verification

- `tsc --noEmit` clean after both changes.
- Manually traced: admin → Teacher Portal (previously via sidebar, now
  only via direct `/teacher` navigation) → back-link visible on every
  `TeacherLayout` page → click returns to `/dashboard` with the admin
  sidebar restored.
- Confirmed the back-link's role gate: a `teacher`-role user hitting any
  `/teacher/*` page does not see it.
- Confirmed "Create Report" from inside the Teacher Portal still works
  as before (no regression to that path).
- Did not re-verify behavior against the concurrent attendance-feature
  commit (`23d0236`) that also touched `AdminLayout.tsx` in the same
  session; the two diffs are non-overlapping (different `Sidebar()`
  sections) and `tsc`/`git status` confirm both landed cleanly together.
