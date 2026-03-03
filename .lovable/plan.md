

# Root Cause Analysis: Reports 500 Error (PostgreSQL 42803)

## The Bug

**File:** `backend/src/controllers/reportsController.ts`, line 56

```sql
(SELECT json_agg(rm.*) FROM report_media rm WHERE rm.report_id = r.id ORDER BY rm.order) as media
```

PostgreSQL error `42803` = "column must appear in GROUP BY clause or be used in an aggregate function."

`json_agg()` is an aggregate function, which makes this subquery an implicit aggregate query (one result row). The `ORDER BY rm.order` references a non-aggregated column outside the aggregate, which PostgreSQL rejects.

## The Fix

Move `ORDER BY` **inside** the `json_agg()` call:

```sql
(SELECT json_agg(rm.* ORDER BY rm."order") FROM report_media rm WHERE rm.report_id = r.id) as media
```

This same pattern appears in **3 places** in the file that need fixing:
1. **Line 56** — `getReports` function
2. **Line 76** — `getReport` function (already has correct syntax `json_agg(rm.* ORDER BY rm.order)` but `order` is a reserved word and should be quoted as `rm."order"`)
3. Lines 119, 168, 194 — other queries with the same subquery pattern

Additionally, line 61 has a **SQL injection risk**: `ORDER BY r.${sort_by} ${sort_order}` interpolates user input directly. Should whitelist-validate these values (the Zod schema already constrains them via enum, so this is low risk but still worth noting).

## Summary

Single-line fix in the SQL subquery — move `ORDER BY` inside `json_agg()`. Apply to all report queries in the file. Redeploy backend on Render.

