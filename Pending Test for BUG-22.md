# Pending Test — BUG-22: Invite Sponsor token flow disconnected from Register page

## Summary
"Invite Sponsor" emailed a working `/register?token=...` link, and the backend's
`POST /auth/register/:token` endpoint correctly created the account and logged the
user in — but the frontend `RegisterForm.tsx` never read the token, so every
invitee was instead routed into the generic self-serve registration flow
(`POST /auth/register`), which just creates a `pending_registrations` row awaiting
manual admin approval.

**Fix applied:**
- `RegisterForm.tsx` now detects `?token=` and, when present, validates it
  (`GET /invitations/validate/:token`), locks the email field to the invited
  address, and submits via a new `registerWithInvitation()` (`POST /auth/register/:token`)
  which logs the user in immediately.

---

## Pre-conditions
1. Latest **frontend** deployed to Vercel, latest **backend** deployed to Render.
2. Logged in as admin/super_admin, with access to Sponsors → Invite Sponsor.
3. An email inbox you can check for the invite (or use the invitation record's token directly from the DB/`GET /invitations`).

---

## Test A — Accept a valid invitation

**Steps:**
1. Dashboard → Sponsors → **Invite Sponsor** → enter an email not already registered → send.
2. Open the invite email → click "Accept Invitation".

**Expected ✅**
- Lands on "Accept Your Invitation" (not the generic "Become a Sponsor" form).
- Email field is pre-filled with the invited address and **read-only**.
- Fill in Full Name, Password, Confirm Password → submit.
- Immediately logged in and redirected to `/sponsor` — **no** "wait for approval" message.

**Check in DB:**
```sql
SELECT id, email, roles: (SELECT role FROM user_roles WHERE user_id = u.id) FROM users u WHERE email = '<invited_email>';
SELECT status, accepted_at FROM sponsor_invitations WHERE email = '<invited_email>';
```

**Expected ✅**
- A `users` row exists with `sponsor` role.
- The invitation's `status = 'accepted'`, `accepted_at` populated.
- **No** row created in `pending_registrations` for this email.

**Failure ❌**
- User is sent to `/registration-pending` instead of being logged in
- A `pending_registrations` row was created instead of a real `users` row

---

## Test B — Invalid / expired token

**Steps:**
1. Visit `/register?token=not-a-real-token`.

**Expected ✅**
- Shows "Invitation Invalid" card with the option to "Register Without Invitation" (falls back to the normal self-serve form at plain `/register`).

---

## Test C — Normal self-serve registration still works (regression check)

**Steps:**
1. Visit `/register` directly (no token) → fill out the form → submit.

**Expected ✅**
- Behaves exactly as before: creates a `pending_registrations` row, shows "wait for approval" messaging, redirects to `/registration-pending`.
- Admins still see it in Pending Approvals.

---

## Quick Smoke Test (minimum viable)
1. Invite Sponsor → click emailed link → email locked/pre-filled, set password → logged in as sponsor directly. ✅
2. Plain `/register` (no token) still goes to pending approval as before. ✅

If both pass, the core fix is working without regressing the existing flow.

---

## Status
- [x] Code fix applied
- [x] TypeScript passes (zero errors, frontend + backend)
- [ ] Test A — Valid invitation acceptance verified (immediate login, correct DB state)
- [ ] Test B — Invalid/expired token state verified
- [ ] Test C — Regular self-serve registration unaffected
