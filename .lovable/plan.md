

# Build Backend for Classroom Moments

## Implementation Plan

### 1. Database Migration (`backend/migrations/006_classroom_moments.sql`)
- `classroom_moments` table: id, teacher_id, type (image/video), url, caption, event_id, status, timestamps
- `moment_tags` junction table: moment_id, child_id (for tagged students)

### 2. Backend Controller (`backend/src/controllers/momentsController.ts`)
- `getMoments`: Fetch moments with aggregated tagged children
- `createMoment`: Insert moment + tags in a transaction
- `deleteMoment`: Remove moment (tags cascade)

### 3. Routes (`backend/src/routes/moments.ts`)
- `GET /` — List all moments (optionally filter by status)
- `POST /` — Create new moment with tags
- `DELETE /:id` — Delete moment

### 4. Frontend API Hooks (`src/hooks/useApi.ts`)
- Add `useMoments()`, `useCreateMoment()`, `useDeleteMoment()` hooks

### 5. Update `ClassroomMoments.tsx`
- Remove mock data, use `useMoments()` hook
- In `handleUpload`: 
  1. POST file to `/api/upload/image` or `/api/upload/video` to get Cloudinary URL
  2. Call `createMoment` with URL, caption, tags, event

