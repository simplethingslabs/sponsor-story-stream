

# Fix TypeScript Build Errors in `momentsController.ts`

## Problem
Two errors at lines 81 and 91:
- `TS18046: 'moment' is of type 'unknown'` — accessing `.id` on an unknown type
- `TS2698: Spread types may only be created from object types` — spreading `unknown`

## Root Cause
The `query<T>` generic defaults to `unknown` when no type parameter is provided, so `momentResult.rows[0]` is `unknown`.

## Fix
Cast the query result row to a typed record:

```typescript
const moment = momentResult.rows[0] as { id: string; [key: string]: any };
```

This one-line change at line 72 resolves both errors — `.id` access and spread become valid.

