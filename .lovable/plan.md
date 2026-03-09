` tag.
No `lov-tool-use` allowed. Just text.

The user asked to "Build backend endpoints for Classroom Moments so photo/video uploads persist to the database instead of local state".

I'll present the plan:
1. **Database Migration**: Create `006_classroom_moments.sql`.
   - `classroom_moments` table: id, type (image/video), url, caption, event_id, status, teacher_id, timestamps.
   - `moment_children` table for tags: moment_id, child_id.
2. **Backend API**:
   - `momentsController.ts`: `getMoments` (with joined tags), `createMoment` (transaction for moment + tags), `deleteMoment`.
   - `moments.ts` routes and register in `routes/index.ts`.
3. **Frontend Integration**:
   - `useApi.ts`: Add `useMoments()`, `useCreateMoment()`, `useDeleteMoment()`.
   - `ClassroomMoments.tsx`: 
     - Remove `mockMoments`.
     - In `handleUpload`: first use `FormData` to POST to existing `/api/upload/image` (or `video`) to get the Cloudinary URL.
     - Call `createMoment` with the Cloudinary URL, caption, event, and `taggedChildren`.

Everything looks solid and adheres to existing patterns.
I will structure the presentation plan.
End of thoughts.
Post response.
<lov-plan>
# Plan: Build Backend for Classroom Moments

To persist classroom moments to the database, we need to create the database schema, a new set of API endpoints, and update the frontend to upload media to Cloudinary before saving the moment data.

## 1. Database Migration (`006_classroom_moments.sql`)
We will create a migration for two tables:
- `classroom_moments`: Stores the media URL, caption, type, event link, and status.
- `moment_tags`: A junction table to store which students are tagged in each moment.

```sql
CREATE TABLE IF NOT EXISTS classroom_moments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(10) NOT NULL CHECK (type IN ('image', 'video')),
    url TEXT NOT NULL,
    caption TEXT NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS moment_tags (
    moment_id UUID REFERENCES classroom_moments(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    PRIMARY KEY (moment_id, child_id)
);
```

## 2. Backend Implementation
- **Controller (`momentsController.ts`)**:
  - `getMoments`: Fetch all moments, optionally filtering by status, and aggregate tagged children into an array.
  - `createMoment`: Insert the new moment and its associated tags into the database within a transaction.
  - `deleteMoment`: Remove a moment (tags are auto-deleted via cascade).
- **Routes (`moments.ts`)**:
  - Set up `GET /`, `POST /`, and `DELETE /:id` routes.
  - Register `/api/moments` in `backend/src/routes/index.ts`.

## 3. Frontend Integration
- **API Hooks (`useApi.ts`)**: Add React Query hooks `useMoments`, `useCreateMoment`, and `useDeleteMoment`.
- **`ClassroomMoments.tsx` Updates**:
  - Remove all mock data and use the new `useMoments()` hook.
  - Update `handleUpload` to actually upload the file:
    1. Send the file to the existing `/api/upload/image` (or `video`) endpoint via `FormData`.
    2. Extract the secure `url` from the Cloudinary upload response.
    3. Call `createMoment` with the URL, caption, tags, and event ID to save it to the database.

Would you like me to go ahead and implement this plan?
