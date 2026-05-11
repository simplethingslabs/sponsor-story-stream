# Going Live Without Upgrading Lovable

## The Situation (in plain English)

Lovable's "Connect Custom Domain" feature is a **paid** add-on. You don't want to pay for it. That's fine — Lovable lets you **export your code** and host it anywhere else for free.

So the new plan is:
- **Frontend** (what users see) → host for **free on Vercel** (or Netlify, same idea)
- **Backend** (the API, already on Render) → stays exactly where it is
- **Subdomain** `sponsorportal.avpschool.in` → points to Vercel instead of Lovable

You pay nothing extra. You just do the hosting yourself in 15 minutes.

---

## Why Vercel?

- 100% free for projects this size
- Built specifically for React/Vite apps like yours
- Custom subdomains are free and unlimited
- Automatic HTTPS (the green padlock) — free
- Auto-redeploys whenever you push code to GitHub

Netlify works the same way if you prefer it. Steps are nearly identical.

---

## The Plan, Step by Step

### Step 1 — Get your code into GitHub (one-time, ~5 min)
Lovable already syncs your project to GitHub. If you haven't connected GitHub yet:
1. In Lovable, click the **+** button in the chat → **GitHub** → **Connect project**
2. Authorize Lovable, pick a repo name, done.
Now every change you make in Lovable is automatically saved to GitHub.

### Step 2 — Create a free Vercel account (~2 min)
1. Go to **vercel.com** → **Sign Up** → choose **Continue with GitHub**
2. That's it. Free "Hobby" plan is enough.

### Step 3 — Import your project into Vercel (~3 min)
1. In Vercel, click **Add New → Project**
2. Pick the GitHub repo Lovable created
3. Vercel auto-detects it as Vite. Leave defaults.
4. Before clicking Deploy, scroll to **Environment Variables** and add:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://sponsor-portal-api-a49s.onrender.com/api`
5. Click **Deploy**. Wait ~1 minute. Your app is now live at something like `sponsor-portal-xyz.vercel.app`.

### Step 4 — Point your subdomain at Vercel (~5 min + DNS wait)
1. In Vercel: open your project → **Settings → Domains** → enter `sponsorportal.avpschool.in` → **Add**
2. Vercel will show you **one DNS record** to add. It will look like:
   - **Type:** CNAME
   - **Name:** `sponsorportal`
   - **Value:** `cname.vercel-dns.com`
3. Go to **GoDaddy → My Products → avpschool.in → DNS** (the same place I showed you before, the **DNS Records** tab — NOT the "Child nameservers" one).
4. Click **Add New Record** and enter exactly what Vercel showed you.
5. Save. Wait 5 minutes to a few hours for DNS to propagate.
6. Vercel will automatically issue a free HTTPS certificate. You'll see a green checkmark when it's ready.

Visit `https://sponsorportal.avpschool.in` — your app is live.

### Step 5 — Tell the backend about the new address (~2 min)
On Render, open your backend service → **Environment** → set/update:
- `FRONTEND_URL` = `https://sponsorportal.avpschool.in`

Then in this Lovable project, I'll update `backend/src/app.ts` so CORS only allows your real subdomain (and Lovable previews) — locking out random origins for security.

### Step 6 — Going forward
- Edit your app in Lovable as usual.
- When you're happy, those changes flow into GitHub automatically, and Vercel auto-deploys them to your subdomain within ~60 seconds.
- You never need to "publish" in Lovable for the live site.

---

## What I'll Change in the Code

Just one small backend file:
- `backend/src/app.ts` — replace the "allow all origins" fallback with a strict list:
  - `https://sponsorportal.avpschool.in`
  - Lovable preview URLs (so you can keep editing safely)

Everything else (Vercel signup, GitHub, GoDaddy DNS, Render env var) you do once in those dashboards — no code changes needed.

---

## Cost Summary

| Item | Cost |
|------|------|
| Vercel Hobby plan (frontend hosting + subdomain + HTTPS) | **Free** |
| GitHub | **Free** |
| Render backend (current free tier) | **Free** (sleeps after 15 min idle) |
| Render Postgres (free tier) | **Free** (expires after 90 days — upgrade later) |
| Lovable (no domain upgrade) | **No change** |
| **Total extra spend right now** | **₹0** |

The only thing I'd still recommend paying for *eventually* is Render Starter ($7/mo ≈ ₹600/mo) so the backend doesn't sleep — but only when you're ready for real users. For stakeholder review, free is fine.

---

## Open Questions Before I Proceed

1. Are you OK with using **Vercel** (recommended), or do you prefer **Netlify** / Cloudflare Pages? Steps are nearly identical.
2. Have you already connected this project to **GitHub**? (If yes, we skip Step 1.)
3. Once you confirm, I'll make the small CORS edit in `backend/src/app.ts` and walk you through the dashboard clicks live.
