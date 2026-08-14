# Pitch: Teacher Management (View / Edit / Delete)

Status: Shipped — see [TEACHER_MANAGEMENT_CHANGELOG.md](./TEACHER_MANAGEMENT_CHANGELOG.md)
for what was actually built and the decisions made along the way.
Framework: Shape Up (pitch + scopes, no dates)

## Problem

The Teachers admin page (`/dashboard/teachers`) lists teacher accounts but offers
no way to act on a row. Admins can only create new teachers
(`AddTeacher.tsx`); there is no view detail, edit, or delete/deactivate path.
Fixing a wrong phone number or removing a departed teacher currently requires
direct DB access.

This is a real gap, not a nice-to-have: Children and Sponsors already have
full/partial row actions (`ChildrenList.tsx`, `SponsorsList.tsx`); Teachers is
the odd one out.

## Appetite

Small batch. This is CRUD on an existing entity with an established pattern
to copy (`ChildrenList.tsx` + `useApi.ts` child hooks + `children.ts`
backend route). No new design system, no new state machine. Target: a few
focused work sessions, not a big rethink of teacher accounts.

## Rabbit holes (explicitly out of scope for this pitch)

- **Auth/session invalidation on delete.** Deleting a teacher who is
  mid-session is a real edge case but belongs to a separate auth-hardening
  pitch, not here. For v1, deleting just removes the account; we don't chase
  active-session cleanup.
- **Bulk actions** (multi-select delete, CSV export). Not requested, not
  shaped here.
- **Role reassignment** (turning a teacher into an admin/sponsor). Out of
  scope — this pitch only touches teacher CRUD, not cross-role changes.
- **Self-service teacher profile editing** (teacher edits their own info).
  This pitch is admin-facing only.
- **Soft-delete / archive semantics.** Deciding whether delete is a hard
  delete or a status flag is a real question (see Open Question below) but we
  should pick the simplest option that matches how `children.ts` already
  does it, not design a new archival system.

## No-gos

- Don't build a generic `/users/:id` CRUD abstraction shared across
  roles "for the future" — build the teacher path the same shape as the
  children path already in the codebase. Consistency over cleverness.
- Don't add a new UI pattern (e.g., a slide-over panel) — reuse
  `DropdownMenu` + `AlertDialog`, same as `ChildrenList.tsx`.

## Open question to settle before Scope 1 starts

Does "Delete Teacher" mean hard delete from `auth.users`/profile tables, or a
status flag (e.g. `is_active = false`)? Children's delete
(`childrenController.deleteChild`) should be checked first — whichever it
does, mirror it for consistency, unless there's a specific reason teachers
need different handling (e.g. FK constraints from assigned classes/moments).
Flag this in Scope 1 shaping, don't guess mid-implementation.

## Solution sketch

Mirror the Children pattern end to end:

```
TeachersList.tsx
  ┌─────────────────────────────────────────────┐
  │ Name        Email        Phone     Created  ⋮│  <- Actions column (new)
  ├─────────────────────────────────────────────┤
  │ Prerna K.   prerna@..    +91...    09/07/26 ⋮│
  └─────────────────────────────────────────────┘
                                              │
                                    ┌─────────▼────────┐
                                    │ 👁 View            │ -> /dashboard/teachers/:id
                                    │ ✎ Edit            │ -> /dashboard/teachers/:id/edit
                                    │ 🗑 Delete (red)    │ -> AlertDialog confirm
                                    └───────────────────┘
```

## Breadboard — scopes

Each scope should be independently shippable and reviewable; later scopes
depend on earlier ones but not vice versa.

### Scope 1 — Backend: teacher CRUD-by-id endpoints
- Add `GET /auth/users/:id`, `PUT /auth/users/:id`, `DELETE /auth/users/:id`
  (or a dedicated `teachers.ts` route if that reads cleaner given
  `authController.ts`'s current shape).
- Gate with `requireAnyRole(['super_admin', 'admin'])`, same as children.
- Wrap mutations in `auditLog('teachers')` (or whatever the equivalent call
  is), matching `children.ts`.
- Resolve the hard-delete-vs-deactivate question here (see Open Question).
- **Done when:** endpoints are reachable, permission-checked, and covered by
  whatever test convention `children.ts` uses (if any).

### Scope 2 — Frontend data layer: hooks
- Add `useTeacher(id)`, `useUpdateTeacher`, `useDeleteTeacher` to
  `src/hooks/useApi.ts`, invalidating the `teachers` query key on
  mutation, following `useUpdateChild`/`useDeleteChild` exactly.
- **Done when:** hooks exist and are typed against `User`, no UI wiring yet.
- Depends on: Scope 1 (needs real endpoints to call, though it can be built
  against a stub/mock in parallel if we want to unblock Scope 3 early).

### Scope 3 — View teacher detail page
- New `TeacherDetail.tsx` at `/dashboard/teachers/:id`, read-only display of
  name/email/phone/created (+ anything else `User`/`UserWithRoles` exposes).
- **Done when:** page renders real data via `useTeacher(id)`.
- Depends on: Scope 2.

### Scope 4 — Edit teacher page
- New `EditTeacher.tsx` at `/dashboard/teachers/:id/edit`, reusing
  `AddTeacher.tsx`'s form fields pre-filled via `useTeacher(id)`, submitting
  via `useUpdateTeacher`.
- **Done when:** editing a teacher persists and reflects in the list.
- Depends on: Scope 2.

### Scope 5 — Row actions + delete confirmation in the list
- Add Actions column + `DropdownMenu` (Eye/Edit/Trash2 icons) to
  `TeachersList.tsx`, copying `ChildrenList.tsx`'s structure exactly
  (including the `AlertDialog` delete-confirm flow and `deleteId` state).
- Wire View → Scope 3 route, Edit → Scope 4 route, Delete →
  `useDeleteTeacher`.
- Tighten the existing `any` typing at `TeachersList.tsx:60` to `User` while
  in the file.
- **Done when:** all three actions work end-to-end from the list view.
- Depends on: Scopes 2, 3, 4 (or can stub View/Edit links first and land
  Delete alone if we want an even smaller first slice — see below).

## Suggested slicing if we want to ship even smaller

If a single cycle feels too big, the natural cut is:
- **Slice A:** Scope 1 + 2 + Delete-only in Scope 5 (skip View/Edit routes
  for now, just wire the Trash2 action). Delivers the highest-value,
  lowest-surface-area piece (removing departed teachers) fastest.
- **Slice B:** Scopes 3 + 4 + the rest of Scope 5 (View/Edit menu items).
  Delivers the polish/completeness piece.

## Circuit breaker

If Scope 1's hard-delete-vs-deactivate question turns out to be non-trivial
(e.g., FK constraints from classes/moments/attendance referencing
teacher_id), stop and re-shape rather than improvising a migration mid-cycle.
