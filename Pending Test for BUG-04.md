# Pending Test — BUG-04: Approve / Request-Revision Report Workflow

## Summary
Two controller functions (`approveReport`, `requestRevision`) existed in the backend
with notification logic and reviewer tracking, but had **no routes** wired up.
`ReportReview.tsx` worked around this by calling `useUpdateReport()` with a status
patch — which silently skipped teacher notifications and left `reviewed_by`,
`reviewed_at`, and `feedback` unpopulated in the DB.

**Fix applied — commit `f4b599d`:**
- Backend: added `POST /reports/:id/approve` and `POST /reports/:id/request-revision`
  (admin / super_admin only, with audit log)
- Frontend: added `useApproveReport()` and `useRequestRevision()` hooks
- `ReportReview.tsx`: swapped `useUpdateReport()` workarounds for the new hooks

---

## Pre-conditions
1. Latest **backend** deployed to Render (`git push origin main` → Render auto-deploys).
2. Latest **frontend** deployed to Vercel.
3. Seed data:
   - At least **1 teacher** account with a created report in `pending_review` status
   - At least **1 admin or super_admin** account for the reviewer role
   - At least **1 sponsor** with a sponsorship (to verify notification reaches them on publish)
   - Notification delivery working (check the DB `notifications` table if email isn't set up)

---

## Test A — Approve a report (single)

**Login as:** admin or super_admin  
**Navigate to:** Dashboard → Report Review → Pending tab

**Steps:**
1. Find a report with status `pending_review`
2. Click **Approve**
3. Confirm the success toast: *"Report approved — The report is ready for publishing."*

**Check in DB:**
```sql
SELECT id, status, reviewed_by, reviewed_at
FROM progress_reports
WHERE id = '<report_id>';
```

**Expected ✅**
- `status = 'approved'`
- `reviewed_by` = the admin's user ID (not NULL)
- `reviewed_at` is populated (not NULL)

**Failure ❌**
- `reviewed_by` or `reviewed_at` still NULL → old workaround path still running (backend routes not deployed)
- 404 / 500 error in the Network tab on `POST /reports/:id/approve`

---

## Test B — Request revision on a report

**Login as:** admin or super_admin  
**Navigate to:** Dashboard → Report Review → Pending tab

**Steps:**
1. Find a report with status `pending_review`
2. Click **Request Revision** → feedback dialog opens
3. Enter feedback text (e.g. *"Please add more detail on activities"*)
4. Submit
5. Confirm the success toast: *"Revision requested — Teacher has been notified to improve the report."*

**Check in DB:**
```sql
SELECT id, status, reviewed_by, reviewed_at, feedback
FROM progress_reports
WHERE id = '<report_id>';
```

**Expected ✅**
- `status = 'needs_revision'`
- `reviewed_by` = admin's user ID
- `reviewed_at` populated
- `feedback` = the text you entered
- A notification row exists for the teacher:
  ```sql
  SELECT * FROM notifications
  WHERE user_id = '<teacher_id>'
  ORDER BY created_at DESC LIMIT 1;
  ```

**Failure ❌**
- `feedback` or `reviewed_by` NULL → backend routes not deployed
- No notification row for the teacher → route wired but notification logic not running

---

## Test C — Bulk approve

**Login as:** admin or super_admin  
**Navigate to:** Dashboard → Report Review → Pending tab

**Steps:**
1. Select 2+ reports using the checkboxes
2. Click **Bulk Approve**
3. Confirm success toast shows the correct count

**Expected ✅**
- All selected reports change to `status = 'approved'`
- `reviewed_by` / `reviewed_at` populated on all of them

**Failure ❌**
- Only some reports approved (race condition) or none approved

---

## Test D — Role guard (negative test)

**Login as:** teacher or sponsor  
**Attempt:** Call `POST /reports/<any_id>/approve` directly (e.g. via browser DevTools or Postman)

**Expected ✅**
- Response: `403 Forbidden` — route requires `admin` or `super_admin`

**Failure ❌**
- `200 OK` or `404` → role guard not applied

---

## Quick Smoke Test (minimum viable)

1. Log in as admin → Report Review → Pending tab
2. Approve one report → check DB: `status='approved'`, `reviewed_by` not null ✅
3. Request revision on another → check DB: `status='needs_revision'`, `feedback` not null ✅

If both DB checks pass, the core fix is working.

---

## Status
- [x] Code fix applied (commit `f4b599d`)
- [x] TypeScript passes (zero errors — frontend and backend)
- [ ] Test A — Single approve verified (DB reviewed_by / reviewed_at populated)
- [ ] Test B — Request revision verified (DB feedback populated, teacher notification created)
- [ ] Test C — Bulk approve verified
- [ ] Test D — Role guard (403 for teacher/sponsor) verified
