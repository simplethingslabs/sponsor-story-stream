

# Fix: Make Backend Resilient Without Resend API Key

## Problem
The `Resend` client is created at import time (line 6 of `resend.ts`). If `RESEND_API_KEY` is missing, the constructor throws immediately and crashes the entire backend.

## Code Change

**File: `backend/src/config/resend.ts`**

Replace eager instantiation with lazy initialization:

```typescript
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

let resend: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export const emailConfig = {
  from: `${process.env.FROM_NAME || 'Sponsor Portal'} <${process.env.FROM_EMAIL || 'noreply@example.com'}>`,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

export function verifyResendConfig(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export default { getResendClient };
```

**File: `backend/src/services/emailService.ts`** -- Update to use `getResendClient()` instead of the direct import.

**File: `backend/src/controllers/authController.ts`** -- Update the direct `resend.emails.send()` calls to use `getResendClient()?.emails.send()`.

## Where to Add the API Key Later

In your **Render Dashboard**:

1. Go to your **Web Service** (`sponsor-portal-api`)
2. Click **Environment** in the left sidebar
3. Click **Add Environment Variable**
4. Add: `RESEND_API_KEY` = your key from [resend.com/api-keys](https://resend.com/api-keys)
5. Optionally also add `FROM_EMAIL` and `FROM_NAME`
6. Click **Save Changes** -- Render will auto-redeploy

No code changes needed after that -- the lazy loader will pick up the key automatically.

## Technical Details

Three files are modified, all in `backend/src/`:
- `config/resend.ts` -- lazy `getResendClient()` instead of top-level `new Resend()`
- `services/emailService.ts` -- use `getResendClient()` with null check
- `controllers/authController.ts` -- use `getResendClient()` with null check

