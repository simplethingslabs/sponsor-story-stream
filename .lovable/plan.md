

# Build Attendance Backend Endpoint

## What needs to happen

Create a full attendance persistence layer: a new database table, backend route/controller, and update the frontend to call it instead of simulating.

## Database Migration (`backend/migrations/005_attendance_table.sql`)

```sql
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    notes TEXT,
    marked_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(child_id, date)
);
```

Unique constraint on `(child_id, date)` ensures one record per child per day. Add an `updated_at` trigger and indexes on `child_id` and `date`.

## Backend Files

1. **`backend/src/routes/attendance.ts`** — Express router with:
   - `POST /` — Bulk upsert attendance for a date (array of `{child_id, status, notes}`)
   - `GET /` — Fetch attendance by date (`?date=2026-03-06`), optionally by child

2. **`backend/src/controllers/attendanceController.ts`** — Controller with:
   - `saveAttendance` — Uses `INSERT ... ON CONFLICT (child_id, date) DO UPDATE` for upsert. Requires `teacher` or `admin` role.
   - `getAttendance` — Returns attendance records for a given date.

3. **`backend/src/routes/index.ts`** — Register the new `/attendance` route.

## Frontend Update (`AttendanceMarking.tsx`)

- Add a `useAttendance` hook or use the API client directly to `POST /api/attendance` on save and `GET /api/attendance?date=...` on date change.
- Replace the simulated `handleSave` with a real API call.
- On date selection, fetch existing attendance for that date and pre-populate the status/notes.

## Scope

- Classroom Moments remains local-only per your preference.
- Attendance history viewing (reports/analytics) can be added later.

