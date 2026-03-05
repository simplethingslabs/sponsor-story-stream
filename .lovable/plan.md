

# Root Cause: Teacher Portal Uses Hardcoded Mock Data

## Finding

All 5 teacher pages directly import from `@/data/mockData` instead of using the `useApi` hooks that connect to the real backend:

| Page | Import |
|------|--------|
| `TeacherDashboard.tsx` | `mockChildren, mockProgressReports` |
| `TeacherStudents.tsx` | `mockChildren, mockProgressReports, mockSponsorships` |
| `TeacherReports.tsx` | `mockChildren, mockProgressReports` |
| `AttendanceMarking.tsx` | `mockChildren` |
| `ClassroomMoments.tsx` | `mockChildren, mockEvents` |

By contrast, all admin pages use `useApi` hooks (e.g., `useChildren`, `useReports`, `useEvents`) which call the real backend API. The teacher pages were never migrated from the initial mock data phase.

Additionally, `src/pages/sponsor/Payments.tsx` has the same issue — it imports `mockChildren`.

## Fix

Refactor all 5 teacher pages to replace `mockData` imports with the existing `useApi` hooks:

1. **TeacherDashboard.tsx** — Replace `mockChildren` with `useChildren()`, `mockProgressReports` with `useReports()`. Add loading/error states.

2. **TeacherStudents.tsx** — Replace `mockChildren` with `useChildren()`, `mockProgressReports` with `useReports()`, `mockSponsorships` with `useSponsorships()`.

3. **TeacherReports.tsx** — Replace `mockChildren` with `useChildren()`, `mockProgressReports` with `useReports()`.

4. **AttendanceMarking.tsx** — Replace `mockChildren` with `useChildren()`. Note: attendance marking currently saves to local state only — the backend has no attendance endpoint yet, so we'll keep local state for marking but load students from the API.

5. **ClassroomMoments.tsx** — Replace `mockChildren` with `useChildren()`, `mockEvents` with `useEvents()`. Moments upload is currently local-only (no backend endpoint), so we keep local state for uploads but load students/events from the API.

Each page will follow the same pattern already established in the admin pages: use React Query hooks, show a `Loader2` spinner while loading, and display an error message if the API call fails.

