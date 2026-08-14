# Feature Flags — Why, How, and What's Left

## Why

The frontend was vibe-coded, and a number of features shipped over-engineered and buggy — financial/payment tooling, audit logs, notifications, newsletters, events, invite-a-friend, and classroom moments among them. Debugging all of that before launch would block the core product (auth, children management, progress reports, the sponsor and teacher portals, and sponsor management), which already works and is what the launch actually depends on.

Rather than deleting the unfinished features or racing to debug everything at once, we decoupled **deploy** from **release**: ship the working core now, keep the unfinished code in the repo, and hide it from users until it's actually debugged. See [`MASTER_BUG_LIST.md`](../MASTER_BUG_LIST.md) for the existing bug-tracking convention this complements.

## How

- **`src/config/featureFlags.ts`** — single source of truth. Each feature is a boolean key in `FEATURE_FLAGS`. Core, already-working features are listed as `true` for reference/documentation only — they are not wired into any gating check, since a flag that's always `true` and never toggled is just indirection.
- **`src/App.tsx`** — a `FeatureRoute` wrapper checks the relevant flag around each deferred route. If the flag is `false`, the route renders `NotFound` instead of the real page — the page component and route registration stay intact, so re-enabling later is a one-line flip, not a rebuild.
- **`AdminLayout.tsx` / `SponsorLayout.tsx` / `TeacherLayout.tsx`** — sidebar nav items carry an optional `flag` field and are filtered out when their flag is off, so a hidden feature never shows a dead link. In `AdminLayout`, the "Financials" and "System" section headers only render if they'd have at least one visible item left.
- Also removed a dead "Upload Photos" link in `TeacherLayout` that pointed to `/teacher/moments/upload` — no route for it ever existed, so it was a guaranteed 404 independent of the flag work.

To launch a deferred feature: debug it, then flip its flag to `true` in `featureFlags.ts`. No route or nav changes are needed.

## What's Remaining

These flags are currently `false` and hidden from all users. None of the underlying bugs have been investigated yet — that's the next phase of work:

| Flag | Feature | Route(s) |
|---|---|---|
| `financialDashboard` | Financial Dashboard (admin) | `/dashboard/financials` |
| `paymentManagement` | Payment Management (admin) | `/dashboard/payments` |
| `sponsorPayments` | Payments & Receipts (sponsor) | `/sponsor/payments` |
| `auditLogs` | Audit Logs | `/dashboard/audit-logs` |
| `trash` | Trash / soft-delete recovery | `/dashboard/trash` |
| `notificationCenter` | Notification Center (admin) | `/dashboard/notifications` |
| `newsletters` | Newsletters (admin + sponsor) | `/dashboard/newsletters`, `/dashboard/newsletters/new`, `/sponsor/newsletters` |
| `events` | Events (admin + sponsor) | `/dashboard/events`, `/dashboard/events/new`, `/sponsor/events` |
| `inviteFriend` | Invite a Friend (sponsor) | `/sponsor/invite` |
| `classroomMoments` | Classroom Moments (teacher) | `/teacher/moments` |

Next steps for each: investigate and fix the underlying bugs (log new ones in `MASTER_BUG_LIST.md` following the existing BUG-XX convention as they're found), test the fixed flow end to end, then flip the flag and remove its row from this table.
