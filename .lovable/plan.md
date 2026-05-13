## What the screenshot tells us

- Deployment **Status: Ready** (green dot) — the build itself didn't crash.
- But the preview thumbnail and the live URL both show Vercel's **404: NOT_FOUND**.
- Source commit: `f0c9cb2 Added vercel.json to root` — so the `vercel.json` move did sync to GitHub and Vercel did redeploy. That part worked.

When a deployment is **Ready** but the root URL still 404s, it almost always means **Vercel built something but is looking for `index.html` in the wrong folder**. Our app outputs to `dist/` (Vite default), but if Vercel's Framework Preset is "Other" it defaults to looking in `public/` — and our `public/` only contains `placeholder.svg` and `robots.txt`, no `index.html`. That produces exactly this 404.

There's also one repo-specific gotcha worth ruling out: this project has a `backend/` folder at the root with its own `package.json`. Vercel's auto-detector usually picks the root one correctly, but if Root Directory ever got set to `backend/`, the build would "succeed" but produce no frontend.

## The plan (all dashboard, no code changes)

### Step 1 — Open Vercel project Settings → Build and Deployment

Confirm and, if needed, **explicitly override** these four values (click the toggle next to each to override the auto-detection):

| Setting | Must be |
|---|---|
| Framework Preset | **Vite** |
| Root Directory | `./` (empty / repo root) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

The most likely culprit is **Framework Preset = Other** with **Output Directory = public**. Switching to Vite fixes both at once.

Click **Save** after any change.

### Step 2 — Set the required environment variable

Settings → **Environment Variables**. Confirm this exists for **Production** (and Preview):

- `VITE_API_URL` = `https://sponsor-portal-api-a49s.onrender.com/api`

If it's missing or wrong, add/fix it. Vite bakes env vars in at build time, so you must redeploy after changing.

### Step 3 — Redeploy without cache

Deployments → click the `⋯` on the latest deployment → **Redeploy** → **uncheck "Use existing Build Cache"** → Redeploy.

### Step 4 — Verify

Once status goes Ready:
- Visit `https://sponsor-story-stream.vercel.app` — should show the login page, not 404.
- Try a deep link like `/login` and refresh — should still load (this confirms `vercel.json` rewrite is active).

### Step 5 — If still 404 after the above

Open Deployments → latest → **Build Logs** and look at the very end for a line like:
```
Build Completed in /vercel/output [xxxms]
```
And earlier:
```
> vite build
dist/index.html  ...
dist/assets/...
```

Send me a screenshot of the build log tail if you don't see `dist/index.html` being emitted — then the issue is the build itself, not Vercel config.

## What I will change in code

**Nothing.** The code-side fix (moving `vercel.json` to the root) is already done and deployed (commit `f0c9cb2`). Everything remaining is in the Vercel dashboard.
