# Pending Test — BUG-10: Sponsor Stats Field Name Mismatch

## Summary
`GET /sponsors/stats` existed and worked correctly. The bug was that
`SponsorHome.tsx` accessed `statsData?.totalQuarters` and
`statsData?.newReportsCount` — neither field exists in the backend response.
The backend returns snake_case fields: `total_reports`, `recent_reports`, etc.

Both stat widgets permanently showed **0** even when the sponsor had active
sponsorships and published reports.

**Fix applied — commit `f86e13c`:**
- Added `SponsorStats` interface to `src/types/index.ts`
- `useSponsorStats`: `api.get<any>` → `api.get<SponsorStats>`
- `SponsorHome.tsx`: mapped `totalQuarters` → `total_reports`,
  `newReportsCount` → `recent_reports`

---

## Pre-conditions
1. Latest frontend deployed to Vercel (`git push origin main` → Vercel auto-deploys).
2. Backend running on Render.
3. Seed data present:
   - At least **1 sponsor** user in the DB
   - At least **1 active sponsorship** assigned to that sponsor
   - At least **1 published progress report** for a sponsored child

---

## Test — Sponsor Home stats show real numbers

**Login as:** sponsor (a user with an active sponsorship)  
**Navigate to:** Sponsor Home (default landing page after login)

**Look at the three stat cards:**

| Card | Expected ✅ | Failure ❌ |
|------|------------|-----------|
| Children Sponsored | Count of sponsor's active children (e.g. "2") | Shows 0 |
| Quarters of Support | Total published reports for sponsored children (e.g. "4") | Shows **0** (was the bug) |
| New Reports | Published reports from the last 30 days (e.g. "1") | Shows **0** (was the bug) |

**Note:** "Quarters of Support" maps to `total_reports` (all published quarterly
reports = quarters the sponsor has received updates). "New Reports" maps to
`recent_reports` (published in the last 30 days).

---

## Quick Verification (Network Tab)

If stats still show 0, open DevTools → Network → filter for `stats`:

1. Find the `GET /sponsors/stats` request
2. Check **Response** — it should look like:
   ```json
   {
     "active_children": 1,
     "total_reports": 4,
     "recent_reports": 1,
     "total_newsletters": 3,
     "upcoming_events": 2
   }
   ```
3. If the response has these fields with real numbers → frontend bug is fixed ✅
4. If the response is empty or has an error → backend/auth issue (unrelated to BUG-10)

---

## Status
- [x] Code fix applied (commit `f86e13c`)
- [x] Frontend build passes (zero TS errors)
- [ ] Sponsor Home stats verified on live Vercel URL
