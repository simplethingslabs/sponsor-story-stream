

# Phase 6: Notification System Integration

## Overview

The notification infrastructure is **partially built** - backend services and API routes exist, but the frontend uses mock data and doesn't sync with the real database. Phase 6 will complete the integration and add automatic notification triggers throughout the application.

## Current State Analysis

| Component | Status | Location |
|-----------|--------|----------|
| Database table | Done | `backend/migrations/001_initial_schema.sql` - notifications table exists |
| Backend API | Done | `backend/src/routes/notifications.ts` - GET, PUT, DELETE endpoints |
| Backend service | Done | `backend/src/services/notificationService.ts` - helpers for bulk notifications |
| Frontend context | Partial | Uses hardcoded mock data, not connected to API |
| React Query hooks | Done | `useNotifications`, `useMarkNotificationRead`, `useMarkAllNotificationsRead` |
| UI component | Done | `NotificationDropdown.tsx` - fully functional UI |

## What Phase 6 Will Implement

### 1. Connect Frontend to Backend API

**Update `NotificationContext.tsx`:**
- Replace mock data with API calls using existing React Query hooks
- Add polling interval to fetch new notifications (every 30 seconds)
- Sync mark-as-read and delete actions with backend

### 2. Add Backend Notification Triggers

Integrate `notificationService` calls into existing controllers when:

| Trigger Event | Recipients | Notification Type |
|---------------|------------|-------------------|
| Report published | Child's sponsors | `report_published` |
| Newsletter created | All sponsors | `newsletter_published` |
| Event created | All sponsors | `event_created` |
| Sponsorship assigned | Sponsor | `sponsorship_assigned` |
| Registration approved | New sponsor | `registration_approved` |
| Report needs revision | Teacher | `system` |
| Report approved | Teacher | `system` |
| Payment reminder (future) | Sponsor | `system` |

### 3. Add New Notification Types to Schema

Update database migration to include new types:
- `report_needs_revision` - for teachers when admin requests changes
- `report_approved` - for teachers when admin approves
- `payment_reminder` - for payment due alerts
- `classroom_moment` - when teacher uploads photos of sponsored child

### 4. Create Notification Settings Page

New page for users to manage their preferences:
- Email notification toggles (on/off per category)
- In-app notification toggles
- Notification sound preferences

### 5. Admin Notification Management

Admin page to:
- View all system notifications
- Send manual announcements to all sponsors
- Send targeted notifications to specific users

## Implementation Files

| File | Action | Description |
|------|--------|-------------|
| `src/contexts/NotificationContext.tsx` | Modify | Connect to API, add polling |
| `src/components/NotificationDropdown.tsx` | Modify | Use API mutations, add loading states |
| `src/types/index.ts` | Modify | Add Notification type |
| `backend/src/controllers/reportsController.ts` | Modify | Add notification triggers for review workflow |
| `backend/src/controllers/newslettersController.ts` | Modify | Notify all sponsors on publish |
| `backend/src/controllers/eventsController.ts` | Modify | Notify sponsors on event creation |
| `backend/src/controllers/sponsorshipsController.ts` | Modify | Notify on sponsorship changes |
| `backend/migrations/002_notification_types.sql` | Create | Add new notification types |
| `src/pages/settings/NotificationSettings.tsx` | Create | User preferences page |
| `src/pages/admin/NotificationCenter.tsx` | Create | Admin broadcast system |

## Technical Details

### Polling Strategy

```text
Frontend NotificationContext
           |
           v
    useQuery with refetchInterval: 30000
           |
           v
    GET /api/notifications?unread_only=true
           |
           v
    Update local state & badge count
```

### Notification Flow (Example: Report Published)

```text
Admin clicks "Publish Report"
         |
         v
reportsController.publishReport()
         |
         v
Update report status to 'published'
         |
         v
notifyChildSponsors(childId, 'report_published', title, message, link)
         |
         v
Sponsors receive in-app notification on next poll
         |
         v
(Optional) Send email via Resend if user has email notifications enabled
```

## Dependencies

- No new packages required
- Uses existing: React Query, Resend (already configured)

## Future Enhancements (Not in Phase 6)

- WebSocket/SSE for real-time push notifications
- Push notifications (Web Push API)
- SMS notifications via Twilio/MSG91
- Notification digest emails (daily/weekly summary)

