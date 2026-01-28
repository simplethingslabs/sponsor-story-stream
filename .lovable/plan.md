

## Plan: Connect Frontend to Deployed Render API

This plan updates the frontend to connect to your deployed Express.js API on Render, replacing demo/mock data with real API calls.

---

### Overview

| Part | Description | Files Modified |
|------|-------------|----------------|
| **Part 1** | Update API Configuration | 1 file |
| **Part 2** | Update AuthContext for Real API | 1 file |
| **Part 3** | Update Admin Forms to Use API Hooks | 8 files |
| **Part 4** | Add Sidebar Navigation for New Pages | 1 file |
| **Part 5** | Update List Pages to Use API Hooks | 6 files |

**Total: 17 files**

---

### Part 1: Update API Configuration

**File: `src/lib/api.ts`**

Changes:
- Add token refresh logic for automatic token renewal
- Add request interceptor for 401 handling (auto-logout on expired tokens)
- Add retry logic for failed requests
- Improve error handling with more specific error messages

```typescript
// Key additions:
- refreshToken() method
- Auto-refresh on 401 response
- Logout and redirect on refresh failure
- Request queue during token refresh
```

---

### Part 2: Update AuthContext for Real API

**File: `src/contexts/AuthContext.tsx`**

Changes:
- Remove DEMO_USERS object (no more hardcoded demo credentials)
- Add proper token refresh handling
- Add `/auth/me` endpoint call to verify session on app load
- Store refresh token separately
- Add token refresh on 401 responses
- Handle session expiration gracefully

```typescript
// Key changes:
- Remove lines 18-52 (DEMO_USERS)
- Update checkAuth() to call /auth/me endpoint
- Update login() to handle access + refresh tokens
- Add refreshToken() function
- Add auto-logout on session expiration
```

**Note:** After deployment, login with:
- Email: `admin@sponsorportal.com`
- Password: `Admin123!`

---

### Part 3: Update Admin Forms to Use API Hooks

Replace `useData()` context calls with React Query API hooks:

| File | Current | Updated |
|------|---------|---------|
| `src/pages/admin/AddChild.tsx` | `useData().addChild()` | `useCreateChild()` mutation |
| `src/pages/admin/EditChild.tsx` | `useData().updateChild()` | `useUpdateChild()` mutation |
| `src/pages/admin/CreateReport.tsx` | `useData().addReport()` | `useCreateReport()` mutation |
| `src/pages/admin/EditReport.tsx` | `useData().updateReport()` | `useUpdateReport()` mutation |
| `src/pages/admin/AddNewsletter.tsx` | `useData().addNewsletter()` | `useCreateNewsletter()` mutation |
| `src/pages/admin/AddEvent.tsx` | `useData().addEvent()` | `useCreateEvent()` mutation |
| `src/pages/admin/InviteSponsor.tsx` | Mock data | `useSendInvitation()` mutation |
| `src/pages/admin/PendingApprovals.tsx` | Mock data | `useApproveRegistration()`, `useRejectRegistration()` mutations |

**Example change for AddChild.tsx:**

```typescript
// Before:
import { useData } from '@/contexts/DataContext';
const { addChild } = useData();
addChild({ ...data });

// After:
import { useCreateChild } from '@/hooks/useApi';
const createChild = useCreateChild();
await createChild.mutateAsync({ ...data });
```

---

### Part 4: Add Sidebar Navigation for Audit Logs and Trash

**File: `src/components/layouts/AdminLayout.tsx`**

Add navigation links for the two new admin pages:
- Audit Logs: `/dashboard/audit-logs` with `FileText` icon
- Trash: `/dashboard/trash` with `Trash2` icon

These will be added to the sidebar navigation menu under a "System" section (for super_admin only).

---

### Part 5: Update List Pages to Use API Hooks

Replace mock data loading with React Query hooks:

| File | Current | Updated |
|------|---------|---------|
| `src/pages/admin/ChildrenList.tsx` | `useData().children` | `useChildren()` query |
| `src/pages/admin/SponsorsList.tsx` | `useData().sponsors` | `useSponsors()` query |
| `src/pages/admin/ReportsList.tsx` | `useData().reports` | `useReports()` query |
| `src/pages/admin/NewslettersList.tsx` | `useData().newsletters` | `useNewsletters()` query |
| `src/pages/admin/EventsList.tsx` | `useData().events` | `useEvents()` query |
| `src/pages/admin/ManageSponsorships.tsx` | Mock data | `useSponsorships()`, `useAssignSponsorship()`, `useRemoveSponsorship()` |

**Benefits of React Query:**
- Automatic caching and background refetching
- Loading states built-in (`isLoading`, `isFetching`)
- Error handling (`isError`, `error`)
- Optimistic updates for mutations
- Cache invalidation on mutations

---

### Implementation Details

#### API URL Configuration

You will need to provide your Render API URL. The code will be updated to use:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-api.onrender.com/api';
```

**Note:** You'll need to update this URL after deploying your backend to Render.

#### Error Handling

All API calls will include:
- Loading spinners during requests
- Error toast notifications on failure
- Retry buttons for failed requests
- Graceful fallbacks for network errors

#### Authentication Flow

```
1. User enters credentials
2. POST /auth/login returns { user, accessToken, refreshToken }
3. Store tokens in localStorage
4. Include accessToken in all API requests
5. On 401 response, try refreshing token
6. If refresh fails, logout user
```

---

### Files Summary

| File | Action |
|------|--------|
| `src/lib/api.ts` | Update with token refresh |
| `src/contexts/AuthContext.tsx` | Remove demo users, add real API auth |
| `src/components/layouts/AdminLayout.tsx` | Add Audit Logs & Trash nav links |
| `src/pages/admin/AddChild.tsx` | Use `useCreateChild()` |
| `src/pages/admin/EditChild.tsx` | Use `useUpdateChild()` |
| `src/pages/admin/CreateReport.tsx` | Use `useCreateReport()` |
| `src/pages/admin/EditReport.tsx` | Use `useUpdateReport()` |
| `src/pages/admin/AddNewsletter.tsx` | Use `useCreateNewsletter()` |
| `src/pages/admin/AddEvent.tsx` | Use `useCreateEvent()` |
| `src/pages/admin/InviteSponsor.tsx` | Use `useSendInvitation()` |
| `src/pages/admin/PendingApprovals.tsx` | Use registration mutations |
| `src/pages/admin/ChildrenList.tsx` | Use `useChildren()` |
| `src/pages/admin/SponsorsList.tsx` | Use `useSponsors()` |
| `src/pages/admin/ReportsList.tsx` | Use `useReports()` |
| `src/pages/admin/NewslettersList.tsx` | Use `useNewsletters()` |
| `src/pages/admin/EventsList.tsx` | Use `useEvents()` |
| `src/pages/admin/ManageSponsorships.tsx` | Use sponsorship hooks |

---

### Before You Implement

Make sure you have:
1. Deployed your backend to Render
2. Run the database migration
3. Noted your Render API URL (e.g., `https://sponsor-portal-api.onrender.com/api`)

I will ask you for the API URL during implementation so I can set it correctly in the code.

