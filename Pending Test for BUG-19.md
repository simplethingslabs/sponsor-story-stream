# Pending Test — BUG-19: Publish flow created report with invalid status

## Summary
`CreateReport.tsx` tried to publish a report by calling `createReport.mutateAsync()`
directly with `status: 'published'`. The backend's create schema only allows
`draft` or `pending_review` on `POST /reports`, so this always failed with a 400.
If "Save as Draft" had already been clicked once, a second "Publish Report" click
also hit a 409 (duplicate `child_id` + `quarter` + `year`).

**Fix applied:**
- `CreateReport.tsx`: `onSubmit` now always creates the report with `status: 'draft'`,
  then — only if the user clicked "Publish Report" — calls the existing
  `usePublishReport()` hook (`POST /reports/:id/publish`) using the new report's id.

---

## Pre-conditions
1. Latest **frontend** deployed to Vercel.
2. Logged in as a teacher, admin, or super_admin.
3. At least 1 active child with no existing report for the quarter/year you'll test.
4. A sponsor linked to that child, to verify the publish notification.

---

## Test A — Publish directly (no prior draft save)

**Login as:** teacher, admin, or super_admin
**Navigate to:** Dashboard → Progress Reports → Create Report

**Steps:**
1. Select a child, quarter, and year that has no existing report yet.
2. Fill in Growth Narrative, Activities, and Teacher Observations (10+ characters each).
3. Click **Publish Report** directly — do NOT click "Save as Draft" first.
4. Confirm the success toast: *"Report has been published successfully."*
5. Open DevTools → Console/Network — confirm no 400 or 409 errors on `/reports` or `/reports/:id/publish`.

**Check in DB:**
```sql
SELECT id, status, published_at
FROM progress_reports
WHERE child_id = '<child_id>' AND quarter = '<quarter>' AND year = <year>;
```

**Expected ✅**
- Exactly **one** row exists for this child/quarter/year.
- `status = 'published'`
- `published_at` is populated (not NULL)
- A notification exists for the child's sponsor(s):
  ```sql
  SELECT * FROM notifications WHERE user_id = '<sponsor_id>' ORDER BY created_at DESC LIMIT 1;
  ```

**Failure ❌**
- 400 or 409 shown in console
- Two rows created for the same child/quarter/year
- `status` stuck at `draft`

---

## Test B — Save as Draft, then Publish separately

**Steps:**
1. Select a different child/quarter/year combination.
2. Fill in the form and click **Save as Draft**.
3. Confirm toast: *"Report has been saved as draft."* and you're returned to the reports list.
4. Re-open that report (View or Edit) and trigger Publish from there (e.g. via Report Review or Edit screen's publish action).

**Expected ✅**
- No duplicate row is created — the same report transitions from `draft` → `published`.

**Failure ❌**
- A second row is created for the same child/quarter/year (would indicate the create-then-publish id isn't being reused correctly somewhere else in the flow).

---

## Quick Smoke Test (minimum viable)
1. Create Report → fill form → click **Publish Report** directly.
2. Check DB: one row, `status='published'`, `published_at` not null. ✅
3. No 400/409 in the Network tab. ✅

If both pass, the core fix is working.

---

## Status
- [x] Code fix applied
- [x] TypeScript passes (zero errors)
- [ ] Test A — Direct publish verified (single row, correct status, notification sent)
- [ ] Test B — Draft-then-publish verified (no duplicate row)
