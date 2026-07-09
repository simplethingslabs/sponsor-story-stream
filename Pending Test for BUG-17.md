# Pending Test — BUG-17: Sponsor Route URL Mismatch

## Summary
The frontend `useApi.ts` was calling `/reports/sponsor` and `/children/sponsor`. These hit the `GET /:id` wildcard handler with `id = "sponsor"`, causing a PostgreSQL **error 22P02** (invalid UUID) instead of returning sponsor data.

**Fix applied:** URLs corrected in `src/hooks/useApi.ts`:
| Hook | Old (broken) URL | Fixed URL |
|---|---|---|
| `useMyReports` | `/reports/sponsor` | `/reports/my-reports` |
| `useMyChildren` | `/children/sponsor` | `/children/my-children` |

---

## Pre-conditions

1. Backend deployed and running on Render.
2. A **sponsor** account exists and is active.
3. That sponsor has at least one **child assigned** via a sponsorship.
4. That child has at least one **published progress report**.
5. You have the Render backend base URL (e.g. `https://your-app.onrender.com/api`).

---

## Step 1 — Get a Sponsor Auth Token

```http
POST {{BASE_URL}}/auth/login
Content-Type: application/json

{
  "email": "sponsor@example.com",
  "password": "yourpassword"
}
```

**Expected:** `200 OK` with `accessToken` in the response body.  
Save the token — it's used as `Bearer <token>` in all steps below.

---

## Step 2 — Test `GET /reports/my-reports`

```http
GET {{BASE_URL}}/reports/my-reports
Authorization: Bearer <token>
```

**Expected ✅**
```json
{
  "data": [ /* array of ProgressReport objects */ ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "hasMore": false
}
```

**Failure ❌ (bug still present)**
```json
{
  "error": "invalid input syntax for type uuid: \"sponsor\""
}
```
or a `500` status.

---

## Step 3 — Test `GET /children/my-children`

```http
GET {{BASE_URL}}/children/my-children
Authorization: Bearer <token>
```

**Expected ✅**
```json
{
  "data": [ /* array of Child objects for this sponsor */ ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "hasMore": false
}
```

**Failure ❌ (bug still present)**
```json
{
  "error": "invalid input syntax for type uuid: \"my-children\""
}
```
or a `500` status.

---

## Step 4 — Confirm Role Guard Works

Test with a **non-sponsor** token (admin or teacher) — should be rejected:

```http
GET {{BASE_URL}}/reports/my-reports
Authorization: Bearer <admin-token>
```

**Expected:** `403 Forbidden` — the route is guarded by `requireRole('sponsor')`.

---

## Step 5 — Confirm Old Broken URLs Now Return 404

```http
GET {{BASE_URL}}/reports/sponsor
Authorization: Bearer <token>
```

**Expected:** `404 Not Found` or `400 Bad Request` (UUID parse error) — confirms the old path is no longer called by the frontend.  
> This is acceptable behaviour; the frontend no longer calls these URLs.

---

## Push Instructions (if not yet deployed)

```bash
git push origin main
```

Wait for Render to finish the deploy (check the Render dashboard), then run the steps above against the live URL.

---

## Status
- [x] Code fix applied  
- [ ] Tested on Render  
