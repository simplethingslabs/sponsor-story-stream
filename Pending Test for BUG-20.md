# Pending Test — BUG-20: Teachers could publish reports directly, bypassing review

## Summary
`CreateReport.tsx` only offered "Save as Draft" or "Publish Report" — there was no
way to submit a report into the `pending_review` queue, and any role allowed on
the create-report route (including plain `teacher`) could publish straight to
sponsors, skipping the admin approval workflow that already exists in
`ReportReview.tsx`.

**Fix applied:**
- Teachers now see **"Submit for Review"** instead of "Publish Report" — creates
  the report with `status: 'pending_review'`.
- Admins/super_admins still see **"Publish Report"** and can publish directly
  (BUG-19's create-then-publish flow), since they are the reviewers.

---

## Pre-conditions
1. Latest **frontend** deployed to Vercel.
2. A teacher-only account (no admin/super_admin role) with at least 1 assigned/active child.
3. An admin or super_admin account for the reviewer role.
4. A sponsor linked to that child, to verify no premature "report published" notification.

---

## Test A — Teacher submits for review (should NOT publish)

**Login as:** teacher (teacher role only)
**Navigate to:** Create Report (or Dashboard → Progress Reports → Create Report)

**Steps:**
1. Fill in the form for a child/quarter/year with no existing report.
2. Confirm the second action button reads **"Submit for Review"** (not "Publish Report").
3. Click it. Confirm toast: *"Report submitted for review. An admin will approve it before it publishes."*

**Check in DB:**
```sql
SELECT id, status, published_at FROM progress_reports
WHERE child_id = '<child_id>' AND quarter = '<quarter>' AND year = <year>;
```

**Expected ✅**
- `status = 'pending_review'`
- `published_at` is NULL
- Report appears in admin's Report Review → **Pending** tab
- No "report published" notification sent to sponsors yet

**Failure ❌**
- `status = 'published'` → role gating not applied, teacher bypassed review
- Button still reads "Publish Report" for a teacher account

---

## Test B — Admin/super_admin still publishes directly

**Login as:** admin or super_admin
**Navigate to:** Create Report

**Steps:**
1. Fill in the form for a different child/quarter/year.
2. Confirm the second button still reads **"Publish Report"**.
3. Click it. Confirm toast: *"Report has been published successfully."*

**Expected ✅**
- `status = 'published'`, `published_at` populated
- Sponsor notification created (same as BUG-19 Test A)

**Failure ❌**
- Admin also forced into `pending_review` (over-restrictive — not the agreed policy)

---

## Test C — Full lifecycle after teacher submission

**Steps:**
1. Using the report submitted in Test A, log in as admin/super_admin.
2. Go to Report Review → Pending tab → find the report → Approve (or Request Revision).
3. If approved, publish it from Report Review.

**Expected ✅**
- Status transitions `pending_review → approved → published` correctly
- `reviewed_by` / `reviewed_at` populated after approval (see BUG-04)

---

## Quick Smoke Test (minimum viable)
1. Teacher account → Create Report → button says "Submit for Review" → submit → DB shows `pending_review`. ✅
2. Admin account → Create Report → button says "Publish Report" → publish → DB shows `published`. ✅

If both pass, the role-gated workflow fix is working.

---

## Status
- [x] Code fix applied
- [x] TypeScript passes (zero errors)
- [ ] Test A — Teacher submit-for-review verified (status=pending_review, no premature publish)
- [ ] Test B — Admin/super_admin direct publish verified (unchanged)
- [ ] Test C — Full lifecycle (submit → approve → publish) verified
