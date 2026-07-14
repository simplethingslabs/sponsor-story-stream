# Pending Test — BUG-23: No email sent when admin creates a teacher/sponsor account

## Summary
"Add Teacher" and "Add Sponsor" already set a real, admin-chosen password on account
creation, but never emailed the new user — the admin had to communicate the
email/password manually. `createUser` now sends a welcome email with the login
credentials via the existing Resend integration.

**Fix applied:**
- `backend/src/controllers/authController.ts` (`createUser`): sends an email with
  the account's email, password, and a login link, guarded by `verifyResendConfig()`
  and wrapped in try/catch so an email failure doesn't block account creation.
- `AddTeacher.tsx` / `AddSponsor.tsx` toasts mention the email was sent.

---

## Pre-conditions
1. Latest **backend** deployed to Render.
2. `RESEND_API_KEY` configured on Render (check via the BUG-15 startup validation log).
3. Access to an inbox you can use for a test teacher/sponsor account.

---

## Test A — Add Teacher sends credentials email

**Login as:** admin or super_admin
**Steps:**
1. Dashboard → Teachers → Add Teacher.
2. Fill in name, a real email you can check, phone (optional), and a password.
3. Submit.

**Expected ✅**
- Toast: "Teacher account created successfully — An email with their login details has been sent."
- The inbox receives an email ("Your AVPSponsorConnect Account") containing:
  - The exact email address
  - The exact password you typed
  - A working link to `/login`
4. Log in with that exact email + password.

**Expected ✅**
- Login succeeds immediately.

**Failure ❌**
- No email arrives (check Render logs for "Failed to send account creation email")
- Email arrives but password shown doesn't match what was typed
- Account creation itself fails/blocks because of an email-sending error (should NOT happen — errors are caught)

---

## Test B — Add Sponsor sends credentials email

Repeat Test A via Dashboard → Sponsors → Add Sponsor. Same expectations.

---

## Test C — Email failure doesn't block account creation

**Steps:**
1. Temporarily unset/break `RESEND_API_KEY` on Render (or test when Resend is down).
2. Add a teacher or sponsor.

**Expected ✅**
- Account is still created successfully (toast still shows success).
- Backend logs show "Failed to send account creation email" (or Resend is simply skipped if unconfigured) — but the HTTP response is still `201`.

---

## Quick Smoke Test (minimum viable)
1. Add Teacher with a real inbox → email arrives with correct credentials → login works. ✅
2. Add Sponsor → same. ✅

If both pass, the core fix is working.

---

## Status
- [x] Code fix applied
- [x] TypeScript passes (zero errors, backend)
- [ ] Test A — Add Teacher email verified
- [ ] Test B — Add Sponsor email verified
- [ ] Test C — Email failure doesn't block account creation
