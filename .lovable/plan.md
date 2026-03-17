

# Admin: Add Teacher & Add Sponsor Accounts

## What We're Building
A unified "Add User" feature that lets admins directly create teacher and sponsor accounts from the admin dashboard — no invitation/approval flow required. Plus a new "Teachers" section in the sidebar to list and manage teacher accounts.

## Changes

### 1. Backend — New `POST /api/auth/create-user` endpoint
- Add a new route in `backend/src/routes/auth.ts` protected by `requireAdmin`
- Controller logic in `authController.ts`: accepts `email`, `password`, `full_name`, `phone`, and `role` (teacher or sponsor)
- Creates the user in `users` table, inserts the role in `user_roles`, hashes the password
- Returns the created user data
- Validation: check for duplicate email, validate role is only `teacher` or `sponsor`

### 2. Frontend — Add Teacher Page (`src/pages/admin/AddTeacher.tsx`)
- Form with fields: Full Name, Email, Phone (optional), Password
- On submit, calls `POST /api/auth/create-user` with `role: 'teacher'`
- Success toast and redirect to teachers list

### 3. Frontend — Add Sponsor Page (`src/pages/admin/AddSponsor.tsx`)
- Same form as Add Teacher but with `role: 'sponsor'`
- Accessible from the existing Sponsors section

### 4. Frontend — Teachers List Page (`src/pages/admin/TeachersList.tsx`)
- Lists all users with the `teacher` role (reuses the existing `GET /api/sponsors` pattern but for teachers)
- Table with name, email, phone, created date
- "Add Teacher" button linking to the add page

### 5. Backend — New `GET /api/sponsors/teachers` or `GET /api/auth/users?role=teacher` endpoint
- Query users joined with `user_roles` filtered by role
- Protected by `requireAdmin`

### 6. Routing & Navigation Updates
- **`App.tsx`**: Add routes for `/dashboard/teachers`, `/dashboard/teachers/new`, `/dashboard/sponsors/new`
- **`AdminLayout.tsx`**: Add "Teachers" nav item under the main navigation section; add teacher count
- **`useApi.ts`**: Add `useTeachers`, `useCreateUser` hooks

### 7. Files to Create
- `src/pages/admin/AddTeacher.tsx`
- `src/pages/admin/AddSponsor.tsx`
- `src/pages/admin/TeachersList.tsx`

### 8. Files to Modify
- `backend/src/controllers/authController.ts` — add `createUser` function
- `backend/src/routes/auth.ts` — add `POST /create-user` route
- `src/hooks/useApi.ts` — add hooks
- `src/App.tsx` — add routes
- `src/components/layouts/AdminLayout.tsx` — add Teachers nav + Add Sponsor nav entry

