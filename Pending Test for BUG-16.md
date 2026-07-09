# Pending Test — BUG-16: Deduplicate Role-Array Parsing

## Summary
The PostgreSQL `array_agg()` result for user roles was being parsed from `"{role1,role2}"` string format to a JS array in **4 separate places** with copy-pasted logic. This was consolidated into a single `parsePostgresArray()` utility in `helpers.ts`.

**Fix applied — commit `01dea4b`:**
| Call site | File |
|---|---|
| `login()` | `authController.ts` |
| `refreshToken()` | `authController.ts` |
| `getCurrentUser()` | `authController.ts` |
| `authenticate()` middleware | `middleware/auth.ts` |

---

## What to Verify
Roles must come back as a **proper JS array** (e.g. `["sponsor"]`) — not a string (`"{sponsor}"`) — in every auth response. If the parsing breaks, roles will be a raw string and every role-guard middleware will silently fail (the `includes()`/`some()` checks return `false` on a string).

---

## Pre-conditions
1. Backend deployed and running on Render.
2. Accounts ready for testing:
   - A **sponsor** account (single role)
   - An **admin** or **teacher** account (to verify multi-role edge case if available)
3. Render backend base URL: `https://your-app.onrender.com/api`

---

## Step 1 — Login: roles returned as array

```http
POST {{BASE_URL}}/auth/login
Content-Type: application/json

{
  "email": "sponsor@example.com",
  "password": "yourpassword"
}
```

**Expected ✅**
```json
{
  "user": {
    "id": "...",
    "email": "sponsor@example.com",
    "roles": ["sponsor"]
  },
  "access_token": "...",
  "refresh_token": "..."
}
```

**Check:** `user.roles` is a JSON **array** `["sponsor"]`, NOT a string `"{sponsor}"`.  
Save `access_token` and `refresh_token` for the next steps.

---

## Step 2 — Get current user: roles returned as array

```http
GET {{BASE_URL}}/auth/me
Authorization: Bearer <access_token>
```

**Expected ✅**
```json
{
  "id": "...",
  "email": "sponsor@example.com",
  "roles": ["sponsor"]
}
```

**Check:** `roles` is an array, not a string.

---

## Step 3 — Refresh token: roles still intact

```http
POST {{BASE_URL}}/auth/refresh
Content-Type: application/json

{
  "refresh_token": "<refresh_token from Step 1>"
}
```

**Expected ✅**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_at": "..."
}
```

Decode the new `access_token` JWT payload (use [jwt.io](https://jwt.io)) and confirm:
```json
{
  "userId": "...",
  "roles": ["sponsor"]
}
```

**Check:** `roles` inside the JWT is an array, not a string.

---

## Step 4 — Role guard still works after login

Using the `access_token` from Step 1, hit a **sponsor-only** route:

```http
GET {{BASE_URL}}/reports/my-reports
Authorization: Bearer <access_token>
```

**Expected ✅** `200 OK` with report data (or empty array if no reports exist).  
**Failure ❌** `403 Forbidden` → roles were not parsed correctly, so the `requireRole('sponsor')` guard rejected the request.

---

## Step 5 — Admin route blocked for sponsor (role guard sanity check)

```http
GET {{BASE_URL}}/children
Authorization: Bearer <access_token>
```

**Expected ✅** `403 Forbidden` — sponsors cannot access the admin children list.  
**Failure ❌** `200 OK` → role guard is not working at all.

---

## Failure Symptoms to Watch For
| Symptom | Likely cause |
|---|---|
| `roles: "{sponsor}"` (string) in response | `parsePostgresArray` not called |
| `403` on sponsor routes after login | Roles parsed as string, `includes()` returns false |
| `200` on admin routes with sponsor token | Role guard broken entirely |

---

## Push Instructions (if not yet deployed)

```bash
git push origin main
```

Wait for Render deploy to complete, then run the steps above.

---

## Status
- [x] Code fix applied (commit `01dea4b`)
- [x] TypeScript typecheck passes
- [ ] Tested on Render
