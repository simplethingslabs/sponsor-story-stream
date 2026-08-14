# Teacher Management: Implementation Record

Status: Shipped (all 5 scopes from [TEACHER_MANAGEMENT_PITCH.md](./TEACHER_MANAGEMENT_PITCH.md))
Commits: `b87154b` (feature), `946550c` (API URL fallback fix)

This records what was actually built and the decisions made while
implementing the pitch, so the reasoning isn't lost once the PR is merged.

## Problem recap

The Teachers admin page (`/dashboard/teachers`) only supported creating
accounts. There was no way to view, edit, or remove a teacher from the UI.

## What shipped

### Scope 1 — Backend CRUD-by-id endpoints

- `GET /auth/users/:id`, `PUT /auth/users/:id`, `DELETE /auth/users/:id`
  added to `backend/src/routes/auth.ts`, gated by `requireAdmin`.
- Handlers `getUserById`, `updateUser`, `deleteUser` added to
  `backend/src/controllers/authController.ts`.
- `updateUserSchema` (optional `email`/`full_name`/`phone`) added to
  `backend/src/schemas/auth.ts`.
- Mutations wrapped in `auditLog('users')` (`'users'` was already in
  `AUDITED_TABLES`, just unused until now).

**Decision — hard delete vs. deactivate:** resolved by mirroring the
existing convention rather than inventing a new one. Every soft-deletable
table in the schema (`children`, `progress_reports`, `newsletters`,
`events`, `sponsorships`, and **already** `users`) uses
`deleted_at`/`deleted_by` columns (`backend/migrations/001_initial_schema.sql`,
`003_add_missing_columns.sql`). Since `users.deleted_at` and
`users.deleted_by` already existed and every read path
(`login`, `getCurrentUser`, `listUsersByRole`, etc.) already filters on
`deleted_at IS NULL`, `deleteUser` does `UPDATE users SET deleted_at = NOW(),
deleted_by = $1` — a soft delete, consistent with `childrenController.deleteChild`.
No migration was needed.

**Decision — generic user endpoint, not a teacher-only route:** the
existing `GET /auth/users?role=` is already role-agnostic (serves both
teachers and sponsors). `/auth/users/:id` follows the same shape rather
than adding a parallel `/teachers/:id` route, per the pitch's no-go
against building parallel abstractions per role.

**Decision — no route/schema for role reassignment:** `updateUserSchema`
deliberately excludes `role`. Changing a user's role was explicitly a
rabbit hole in the pitch; the update endpoint can't accidentally promote
a teacher to admin.

### Scope 2 — Frontend data hooks

Added to `src/hooks/useApi.ts`:
- `queryKeys.teacher(id)`
- `useTeacher(id)` — `GET /auth/users/:id`, `enabled: !!id`
- `useUpdateTeacher()` — `PUT /auth/users/:id`, invalidates both the
  teachers list and the single-teacher cache
- `useDeleteTeacher()` — `DELETE /auth/users/:id`, invalidates the list

All three mirror `useChild`/`useUpdateChild`/`useDeleteChild` exactly —
no new patterns introduced.

### Scopes 3–5 — View, Edit, row actions

- `src/pages/admin/TeacherDetail.tsx` (new) — read-only view at
  `/dashboard/teachers/:id`, styled after `ChildDetail.tsx`'s profile card.
- `src/pages/admin/EditTeacher.tsx` (new) — edit form at
  `/dashboard/teachers/:id/edit`, reuses `AddTeacher.tsx`'s plain
  `useState` form pattern (not react-hook-form) pre-filled via
  `useTeacher`, submits via `useUpdateTeacher`.
- `src/pages/admin/TeachersList.tsx` — added an Actions column with a
  `DropdownMenu` (View/Edit/Delete) and an `AlertDialog` delete
  confirmation, copied from `ChildrenList.tsx`. Also tightened the
  `teachers.map((teacher: any) => ...)` typing to `User` while in the file.
- Routes added in `src/App.tsx`: `/dashboard/teachers/:id` and
  `/dashboard/teachers/:id/edit`, both gated to `super_admin`/`admin`,
  matching the existing `/dashboard/teachers` and `/dashboard/teachers/new`
  gating.

**Decision — plain form over react-hook-form for Edit:** `EditTeacher.tsx`
matches `AddTeacher.tsx`'s existing style (uncontrolled `useState` object,
manual `onSubmit`) rather than the `react-hook-form` + `zodResolver`
pattern used in `EditChild.tsx`. Consistency with the sibling Add/Edit
pair for the *same* entity took priority over consistency with a
different entity's edit page.

## Verification

- `tsc --noEmit` clean on both `backend/` and the frontend after every
  scope.
- ESLint run on touched files; the only `no-explicit-any` hit
  (`EditTeacher.tsx`, `catch (error: any)`) matches the pre-existing
  convention in `AddTeacher.tsx` and every other Add/Edit page — not a
  new deviation.
- Visual check: ran the Vite dev server locally against the **real**
  Railway backend (see below) and manually confirmed View, Edit, and
  Delete are all present and reachable from the Teachers list.
- Did not exercise the Delete confirmation against real data — deferred,
  per the earlier decision to test read/UI paths first and treat
  destructive operations as a separate, deliberate step.

## Side finding: stale backend URL

While setting up the visual check, discovered `src/lib/api.ts` still
hardcoded a Render URL
(`https://sponsor-portal-api-a49s.onrender.com/api`) as the fallback for
`VITE_API_URL`, left over from before the backend moved to Railway.
Confirmed the real backend at
`https://sponsor-story-stream-production.up.railway.app/api` via its
`/health` endpoint, then updated the fallback (commit `946550c`). This was
unrelated to the teacher-management work itself but was blocking the
visual check, so it's fixed as part of this record rather than filed
separately.

## Explicitly not done (per the pitch's rabbit holes / no-gos)

- No auth/session invalidation on delete.
- No bulk actions.
- No role reassignment.
- No self-service teacher profile editing.
- No local/seeded-DB test pass for the Delete path (only a visual check
  against real, non-destructive reads was performed).
