# Pending Test — BUG-12: `useRemoveSponsorship` Drops `end_date`

## Summary
`useRemoveSponsorship` accepted an `end_date` parameter but `api.delete()`
had no body parameter, so `end_date` was silently discarded on every call.
The backend controller already reads `req.body.end_date` and falls back to
`NOW()` — the backend was never broken.

**Fix applied — commit `dce474e`:**
- `api.delete()` now accepts an optional `body?` argument (consistent with
  `post`, `put`, `patch`)
- `useRemoveSponsorship` passes `{ end_date }` as the DELETE body when
  provided; omits the body when `end_date` is undefined (preserving the
  backend's `NOW()` fallback)

---

## Important Caveat
Neither current UI caller (`SponsorDetail.tsx`, `ManageSponsorships.tsx`)
passes `end_date` — both only pass the `id`. This means:

- **Test A** (UI smoke test) only verifies the `NOW()` fallback path — i.e.
  that ending a sponsorship through the admin panel still works after the
  fix. This was never broken.
- **Test B** (API direct test) is the only way to verify that a custom
  `end_date` is now actually forwarded and saved. Use Postman or DevTools
  for this.

---

## Pre-conditions
1. Latest frontend deployed to Vercel.
2. Backend running on Render.
3. Seed data:
   - At least **1 active sponsorship** in the DB
   - Admin or super_admin account to perform the action

---

## Test A — UI smoke test: ending a sponsorship still works

**Login as:** admin or super_admin  
**Navigate to:** Dashboard → Sponsorships (or Sponsor Detail page)

**Steps:**
1. Find a sponsor with an active child sponsorship
2. Click the **Remove** / **End Sponsorship** button
3. Confirm the success toast appears

**Check in DB:**
```sql
SELECT id, status, end_date
FROM sponsorships
WHERE id = '<sponsorship_id>';
```

**Expected ✅**
- `status = 'ended'`
- `end_date` is today's date (set by the backend's `NOW()` fallback)

**Failure ❌**
- 4xx / 5xx error in the Network tab → body parsing broken
- `status` still `'active'` → request not reaching the controller

---

## Test B — API direct test: custom end_date is forwarded

> **Use Postman or browser DevTools console for this test.**
> No UI component currently exposes an end_date date picker.

**Set up:** Have a valid admin JWT token and an active sponsorship ID.

**Request:**
```
DELETE /api/sponsorships/<sponsorship_id>
Authorization: Bearer <admin_token>
Content-Type: application/json

{ "end_date": "2025-03-31" }
```

**Or via DevTools console (on the Vercel app, so auth token is in localStorage):**
```javascript
const token = localStorage.getItem('auth_token');
const res = await fetch('https://<your-render-url>/api/sponsorships/<id>', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ end_date: '2025-03-31' }),
});
console.log(await res.json());
```

**Check in DB:**
```sql
SELECT id, status, end_date
FROM sponsorships
WHERE id = '<sponsorship_id>';
```

**Expected ✅**
- `status = 'ended'`
- `end_date = '2025-03-31'` (the custom date, NOT today's date)

**Failure ❌**
- `end_date` = today's date instead of `'2025-03-31'` → body still not
  being forwarded (fix not deployed)

---

## Status
- [x] Code fix applied (commit `dce474e`)
- [x] TypeScript passes (zero errors)
- [ ] Test A — UI sponsorship removal still works; `end_date` set in DB
- [ ] Test B — Custom `end_date` forwarded and saved correctly (Postman / DevTools)
