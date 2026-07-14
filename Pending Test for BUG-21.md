# Pending Test — BUG-21: Password reset link 404s (missing frontend page)

## Summary
The backend password reset flow (`/auth/forgot-password`, `/auth/reset-password`) and
`AuthContext.resetPassword()` were already fully implemented, but no `/reset-password`
route or page existed in the frontend — the emailed reset link always 404'd.

**Fix applied:**
- New `src/components/auth/ResetPasswordForm.tsx` + `src/pages/ResetPassword.tsx`.
- Registered at `/reset-password` inside the `AuthLayout` route group in `src/App.tsx`.

---

## Pre-conditions
1. Latest **frontend** deployed to Vercel.
2. Resend configured on the backend (`RESEND_API_KEY` set) so reset emails actually send.
3. An existing user account (any role) whose email you can check.

---

## Test A — Full reset flow

**Steps:**
1. Go to `/login` → "Forgot Password?" → enter the account's email → submit.
2. Check that inbox for "Password Reset Request".
3. Click the link in the email.

**Expected ✅**
- Lands on a real "Reset Password" form (not a 404) at `/reset-password?token=...`.
- Enter a new password (8+ chars, upper+lower+digit per backend rule) + confirm → submit.
- Success screen appears with a "Go to Login" button.
4. Log in with the new password.

**Expected ✅**
- Login succeeds with the new password.
- Old password no longer works.
- All previous sessions were invalidated (backend deletes `refresh_tokens` on reset) — any other logged-in device/tab should require re-login.

**Failure ❌**
- Link still 404s
- "Passwords don't match" / validation errors block a correctly-matching, valid password
- Old password still works after reset

---

## Test B — Missing/invalid token

**Steps:**
1. Visit `/reset-password` directly (no `?token=`).
2. Visit `/reset-password?token=not-a-real-token`.

**Expected ✅**
- No token: shows "Invalid Link" card with a link back to "Request New Link" (`/forgot-password`).
- Invalid/expired token: form submits, shows a destructive toast ("This link may be invalid or expired...").

---

## Quick Smoke Test (minimum viable)
1. Request reset → click email link → lands on real form (not 404). ✅
2. Set new password → login works with it. ✅

If both pass, the core fix is working.

---

## Status
- [x] Code fix applied
- [x] TypeScript passes (zero errors, frontend)
- [ ] Test A — Full reset flow verified end-to-end
- [ ] Test B — Missing/invalid token states verified
