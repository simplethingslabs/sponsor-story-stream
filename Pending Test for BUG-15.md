# Pending Test — BUG-15: Env Var Validation at Startup

## Summary
The server had no centralised env check. Missing Cloudinary vars only produced
a vague one-line warning; missing `JWT_SECRET` threw a raw JS error deep in the
module load chain.

**Fix applied — commit `1661945`:**  
New `config/env.ts` → `validateEnv()` runs immediately after `dotenv.config()`
in `app.ts`. It prints a per-var OK/MISSING table, then:

| Var type | Vars | Behaviour when missing |
|---|---|---|
| **Hard required** | `DATABASE_URL`, `JWT_SECRET` | Logs exact var name + exits with code 1 |
| **Soft required** | `CLOUDINARY_*` (3 vars), `RESEND_API_KEY`, `FROM_EMAIL` | Logs warning + app continues |

Placeholder detection: values like `your-cloud-name` / `re_your_api_key`
copied straight from `.env.example` are treated as missing.

---

## Pre-conditions
- Access to the Render service dashboard (to view deploy logs and temporarily
  remove/add env vars).
- Current deploy is working normally (all vars set).

---

## Test A — Normal startup (all vars present)

**Action:** Deploy normally with all env vars configured.

**Expected in Render deploy log ✅**
```
🔍 Environment check:
  ✅  DATABASE_URL             OK
  ✅  JWT_SECRET               OK
  ✅  CLOUDINARY_CLOUD_NAME    OK
  ✅  CLOUDINARY_API_KEY       OK
  ✅  CLOUDINARY_API_SECRET    OK
  ✅  RESEND_API_KEY           OK
  ✅  FROM_EMAIL               OK

🚀 Server running on port ...
```

No warnings, no errors, server starts.

---

## Test B — Missing Cloudinary vars (soft failure)

**Action:** In Render dashboard → Environment → temporarily **delete**
`CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_API_KEY` → trigger a manual deploy.

**Expected in deploy log ✅**
```
🔍 Environment check:
  ✅  DATABASE_URL             OK
  ✅  JWT_SECRET               OK
  ❌  CLOUDINARY_CLOUD_NAME    MISSING  — Cloudinary cloud name (file uploads)
  ❌  CLOUDINARY_API_KEY       MISSING  — Cloudinary API key (file uploads)
  ✅  CLOUDINARY_API_SECRET    OK
  ✅  RESEND_API_KEY           OK
  ✅  FROM_EMAIL               OK

⚠️  Some optional services are not configured:
   • CLOUDINARY_CLOUD_NAME: Cloudinary cloud name (file uploads)
   • CLOUDINARY_API_KEY: Cloudinary API key (file uploads)
   These features will be unavailable until the vars are set.

🚀 Server running on port ...
```

**Check:** Server still starts and the `/health` endpoint returns `200`.

```http
GET {{BASE_URL}}/health
```

```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "cloudinary": "not configured",
    "resend": "configured"
  }
}
```

**Restore:** Re-add the deleted Cloudinary vars before proceeding.

---

## Test C — Missing JWT_SECRET (hard failure)

**Action:** In Render dashboard → temporarily **delete** `JWT_SECRET` → trigger
a manual deploy.

**Expected in deploy log ✅**
```
🔍 Environment check:
  ✅  DATABASE_URL             OK
  ❌  JWT_SECRET               MISSING  — JWT signing secret
  ...

❌ Missing required environment variables:
   • JWT_SECRET: JWT signing secret

   Set these variables and restart the server.
```

**Check:** Deploy log shows the process exited with code 1. The service shows
as **crashed / failed** in the Render dashboard — it does NOT start serving
requests.

**Restore:** Re-add `JWT_SECRET` → redeploy → confirm normal startup (Test A).

---

## Test D — Placeholder value treated as missing

**Action:** Set `CLOUDINARY_CLOUD_NAME` to the literal string `your-cloud-name`
(the `.env.example` placeholder value) → redeploy.

**Expected in deploy log ✅**  
`CLOUDINARY_CLOUD_NAME` shows as `MISSING` in the env check table, even though
the variable is technically set.

**Restore:** Set the var back to the real cloud name → redeploy.

---

## Push Instructions (if not yet deployed)

```bash
git push origin main
```

Wait for Render deploy to complete, then run Tests A–D above against the
Render deploy logs.

---

## Status
- [x] Code fix applied (commit `1661945`)
- [x] TypeScript typecheck passes
- [ ] Test A — normal startup verified on Render
- [ ] Test B — soft failure (missing Cloudinary) verified on Render
- [ ] Test C — hard failure (missing JWT_SECRET) verified on Render
- [ ] Test D — placeholder detection verified on Render
