# RIBAL HealthTech site

Static frontend + Netlify Functions backend. Forms submit to a serverless
endpoint that emails RIBAL via Resend. The API key lives in your laptop's
`.env.local` (gitignored) and in Netlify's encrypted env-var store — it is
never in this repository.

## Repo layout

```
.
├── index.html                ← homepage (iPhone icon grid)
├── contact.html              ← contact + Discovery Call form
├── assets/                   ← CSS, JS, images (the frontend)
├── netlify/
│   └── functions/
│       ├── submit.js         ← serverless backend — sends email
│       └── package.json
├── netlify.toml              ← Netlify config (publish dir + redirects)
├── package.json              ← root dev dependencies
├── .gitignore                ← keeps .env* out of git
├── .env.example              ← template — DO commit this
└── .env.local                ← REAL secrets — DO NOT commit (gitignored)
```

## One-time setup on your Mac

```bash
# 1. install Netlify CLI (free, official)
npm install -g netlify-cli

# 2. clone your repo (skip if you already have it)
git clone https://github.com/seeneen10/Ribal.git
cd Ribal

# 3. drop these site files in (or unzip ribal-website.zip here)

# 4. create your local secrets file
cp .env.example .env.local
# now open .env.local in TextEdit and paste your real RESEND_API_KEY

# 5. run locally with hot-reload
netlify dev
# → opens http://localhost:8888 with the function available at /api/submit
```

## Getting a Resend API key (one-time, 2 minutes)

1. Sign up at <https://resend.com> — free tier is 3,000 emails / month.
2. Verify your email.
3. Go to **API Keys → Create API key**, give it a name (e.g. "RIBAL site"),
   pick scope "Sending access" → **Add**.
4. Copy the key (starts with `re_…`) and paste it into `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. For the `EMAIL_FROM` value:
   - Quick start: use `onboarding@resend.dev` (Resend's shared sender).
   - Production: in Resend → **Domains → Add** → verify `ribal.sa` via DNS,
     then set `EMAIL_FROM=forms@ribal.sa`.

## Deploying to Netlify

### Option A — connect GitHub to Netlify (recommended)

1. Push the code to GitHub (the `.env.local` stays on your Mac — it is gitignored).
2. Go to <https://app.netlify.com> → **Add new site → Import an existing project**.
3. Pick your `Ribal` repo. Netlify reads `netlify.toml` automatically — no
   build command needed.
4. In **Site settings → Environment variables**, add:
   - `RESEND_API_KEY` = your real key
   - `NOTIFY_EMAIL`   = `dsinai@calx.sa`
   - `EMAIL_FROM`     = `onboarding@resend.dev` (or your verified domain)
5. Trigger a deploy. Done — every future `git push` auto-deploys.

### Option B — direct Netlify deploy (no GitHub)

```bash
netlify login
netlify init        # link or create a new site
netlify deploy --prod
```

Then add the same env vars in the Netlify dashboard.

## Security guarantees

- `.gitignore` excludes every `.env*` file. Running `git status` will
  never list your real key.
- The `RESEND_API_KEY` is only read inside `netlify/functions/submit.js`,
  on Netlify's server. It is never sent to the browser.
- The frontend only POSTs the form data to `/api/submit`. It has no
  access to the key.
- If the backend is offline, the frontend still works — it shows the
  WhatsApp + mailto buttons as a fallback so submissions are never lost.

## Sanity check

After deploying, visit your live site and submit a test assessment.
Check:
1. **Inbox** at `dsinai@calx.sa` — formatted email arrived.
2. **Netlify dashboard → Functions** — should show one invocation, status 200.
3. **Resend dashboard → Logs** — should show one sent email.

If any step fails, the function logs in Netlify will tell you why.
