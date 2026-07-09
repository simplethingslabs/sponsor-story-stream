# Pending Test — BUG-05: Pagination Shape Mismatch

## Summary
Backend returns `{ data, pagination: { page, limit, total, totalPages } }` but
all 14 frontend hooks expected a flat `{ data, total, page, limit, hasMore }`.

Before the fix, every list view silently received `total = undefined`,
`hasMore = undefined`, `page = undefined` — row counts showed 0/blank, "Next"
buttons were permanently disabled or broken.

**Fix applied — commit `10cd63d`:**
Added `BackendPaginatedResponse<T>` + `normalizePagination()` in `useApi.ts`.
All 14 paginated hooks now transform the nested backend shape into the flat
`PaginatedResponse<T>` shape components expect. No component changes required.

---

## Pre-conditions
1. Latest frontend deployed to Vercel (`git push origin main` → Vercel auto-deploys).
2. Backend running on Render.
3. Seed data present:
   - At least **3–5 children** in the DB
   - At least **3–5 reports**
   - At least **1 sponsor** with a **sponsorship assigned**
   - At least **1 notification** for a user

---

## Test A — Children list renders with correct count (Admin)

**Login as:** admin / super_admin  
**Navigate to:** Dashboard → Children

**Expected ✅**
- Rows render (children are visible, not empty)
- Total count label shows the real number (e.g. "Showing 1 to 5 of 5 entries")
- If there are > 20 children: "Next" button is enabled; after clicking, page 2 loads

**Failure ❌ (bug still present)**
- No rows shown despite children existing in the DB
- Count shows "0" or "NaN" or "undefined"
- "Next" button permanently disabled even when more rows exist

---

## Test B — Reports list renders with correct count (Admin/Teacher)

**Login as:** admin or teacher  
**Navigate to:** Dashboard → Reports

**Expected ✅**
- Report rows are visible
- Total / page count is correct
- Pagination buttons behave correctly

**Failure ❌**
- Empty list despite reports existing
- Count shows "0", "NaN", or blank

---

## Test C — Sponsor's children and reports list (Sponsor)

**Login as:** sponsor  
**Navigate to:** My Children / My Reports

**Expected ✅**
- Sponsor sees only their assigned children and published reports
- Counts are correct

**Failure ❌**
- Empty list even though sponsorship and published reports exist

---

## Test D — Notifications unread count badge (any user)

**Login as:** any user with at least 1 unread notification  
**Check:** Notification bell icon in the header

**Expected ✅**
- Badge shows the correct unread count (e.g. "3")
- Opening the dropdown lists the notifications
- Marking one as read decrements the badge

**Failure ❌**
- Badge shows 0 or disappears despite unread notifications existing
- Notification list is empty

---

## Test E — Pagination "Next / Previous" navigation

**Pre-condition:** At least 21+ children or reports exist (to force page 2).

**Navigate to:** any list page with 20+ rows.  
**Click "Next".**

**Expected ✅**
- Page 2 loads with the next batch of rows
- "Previous" button becomes enabled
- Row count label updates (e.g. "Showing 21 to 40 of 45 entries")

**Failure ❌**
- "Next" is permanently disabled
- Clicking "Next" does nothing / reloads page 1

---

## Test F — Payments list (Admin)

**Navigate to:** Dashboard → Payments

**Expected ✅**
- Payment rows render with sponsor name and child name
- Total count is correct

**Failure ❌**
- Empty list / broken counts

---

## Quick Smoke Test (minimum viable)

If you only have time for one check, do this:

1. Login as admin
2. Go to Children list
3. Confirm at least 1 child row is visible **and** the count label shows a real number
4. Go to Reports list — same check
5. Check the notification bell badge shows a number

If all three pass, the core fix is working. ✅

---

## Push Instructions (if not yet deployed to Vercel)

```bash
git push origin main
```

Vercel auto-deploys on push to `main`. Wait for the Vercel deploy to finish,
then run the tests above on the live URL.

---

## Status
- [x] Code fix applied (commit `10cd63d`)
- [x] Frontend build passes (zero TS errors)
- [ ] Test A — Children list verified
- [ ] Test B — Reports list verified
- [ ] Test C — Sponsor view verified
- [ ] Test D — Notifications unread count verified
- [ ] Test E — Pagination Next/Previous verified
- [ ] Test F — Payments list verified
