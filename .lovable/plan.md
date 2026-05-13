## What's wrong

Two separate issues are stacked on top of each other:

### Issue 1 — `vercel.json` is in the wrong folder
It currently lives at `src/vercel.json`. Vercel only reads `vercel.json` from the **project root** (next to `package.json`). So your rewrite rule is being completely ignored, which is why deep links 404.

### Issue 2 — The root URL itself is 404, not just deep links
A Vercel-branded "404: NOT_FOUND" on the root URL usually means **Vercel is not finding your built files**. For a Vite app it should serve `dist/index.html`. Most common causes:
- **Framework Preset** is set to "Other" instead of **Vite** → Vercel doesn't know the output folder is `dist`
- **Root Directory** in Vercel project settings is wrong (e.g. pointing to `src/` or `backend/`)
- **Build failed** silently — check the Deployments → latest → Build Logs

### Issue 3 — The URL is `sponsorstorystream` not your subdomain
That's fine — that's just Vercel's auto-generated URL. The custom subdomain `sponsorportal.avpschool.in` gets attached separately under Settings → Domains. We'll do that after the site loads.

---

## The Plan

### Step 1 — Move `vercel.json` to the project root (I'll do this)
- Delete `src/vercel.json`
- Create `vercel.json` at the repo root with the SPA rewrite rule

This auto-syncs to GitHub and triggers a Vercel redeploy.

### Step 2 — You check Vercel project settings (2 min, in dashboard)
Open your Vercel project → **Settings → General** and confirm:

| Setting | Should be |
|---|---|
| Framework Preset | **Vite** |
| Root Directory | `./` (leave empty / project root) |
| Build Command | `npm run build` (or leave default) |
| Output Directory | `dist` (or leave default) |
| Install Command | `npm install` (or leave default) |

If Framework Preset says "Other", change it to **Vite** and click **Save**, then go to **Deployments** → click the **⋯** on the latest one → **Redeploy**.

### Step 3 — Check the build logs if it still 404s
Vercel → **Deployments** → click the latest deployment → **Build Logs** tab. Look for:
- "Build Completed" with files listed under `dist/` ✅
- Any red error messages ❌ (TypeScript errors, missing env vars, etc.)

Send me a screenshot of the build log if you see errors. The most common one is a missing `VITE_API_URL` — confirm in **Settings → Environment Variables** it exists and is set to `https://sponsor-portal-api-a49s.onrender.com/api`.

### Step 4 — Once the root URL loads, attach your real subdomain
Vercel project → **Settings → Domains** → add `sponsorportal.avpschool.in` → copy the CNAME it gives you → add that CNAME in GoDaddy DNS (as planned earlier).

You can also rename the Vercel project from `sponsor-story-stream` to anything you want under **Settings → General → Project Name** — but it doesn't matter once the custom domain is attached, because users will only ever see `sponsorportal.avpschool.in`.

---

## What I'll change in code

Only one tiny thing:
- **Delete** `src/vercel.json`
- **Create** `vercel.json` at the project root with the same content

Everything else is dashboard clicks on your end.
