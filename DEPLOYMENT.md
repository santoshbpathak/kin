# KIN MVP1 — Go-Live Deployment Runbook

This is a single-pass, copy-paste runbook to take KIN from "works locally on SQL.js" to "live on `https://app.kin.ai.in` backed by `https://api.kin.ai.in`".

Estimated total time: **~3 hours of active work** (most of it waiting for DNS propagation and Supabase migration). WhatsApp + Sentry are deferred — see [Appendix A](#appendix-a--enabling-sentry-later) and [Appendix B](#appendix-b--enabling-whatsapp-later).

---

## Pre-flight checklist

Tick these off before you start:

- [ ] You have a [Supabase](https://supabase.com) account.
- [ ] You have a [Vercel](https://vercel.com) account with the team you want this deployed under.
- [ ] You have ownership / DNS-zone access for `kin.ai.in` (Cloudflare, GoDaddy, Route53, etc.).
- [ ] `node >= 20`, `pnpm >= 9`, `vercel` CLI, `openssl`, `curl`, `python3` installed locally.
- [ ] The git working tree is clean (`git status` shows no uncommitted local changes you do not want deployed).
- [ ] All tests pass locally: `pnpm typecheck && pnpm build`.

```bash
vercel --version    # >= 32
pnpm --version      # >= 9
openssl version     # >= 1.1
```

---

## Step 1 — Provision Supabase (15 min)

1. Sign in at https://supabase.com → **New project**.
2. Project name: `kin-prod`. Region: **Southeast Asia (Singapore)** (closest to India; Supabase has no India region on free tier).
3. Generate a strong DB password → save to your password manager as "Supabase kin-prod DB password".
4. Wait ~2 min for provisioning.
5. Once the dashboard loads, capture these 4 values into a temporary secrets doc:

| Value | Where to find it in Supabase dashboard |
|-------|----------------------------------------|
| `DATABASE_URL` | **Project Settings → Database → Connection string → Transaction (pooler, port 6543)**. NOT the "Direct connection". |
| `SUPABASE_URL` | **Project Settings → API → Project URL** |
| `SUPABASE_ANON_KEY` | **Project Settings → API → Project API keys → `anon` (public)** |
| `SUPABASE_SERVICE_ROLE_KEY` | **Project Settings → API → Project API keys → `service_role` (secret)** |

> ⚠️ The transaction-mode pooler URL is **mandatory** for Vercel. The direct port-5432 URL will exhaust your connection pool under serverless load.

> ⚠️ The service role key bypasses RLS. Never paste it into anything client-facing.

---

## Step 2 — Run database migrations (10 min)

We have two migrations: initial schema and RLS policies. We run them with the same `migration:run` script that points at your new Supabase DB.

```bash
cd apps/api

# Point at your Supabase DB for this single command
export DATABASE_DRIVER=postgres
export DATABASE_URL='<paste the pooler URL from step 1>'
export DATABASE_SSL=true

# Build the migration JS files
pnpm build

# Run both migrations
pnpm migration:run
```

You should see:
```
Migration InitialSchema1700000000000 has been executed successfully.
Migration RlsPolicies1700000000001 has been executed successfully.
```

Verify in Supabase dashboard → **Table Editor**: you should see 13 tables (user_profiles, protection_scores, recommendation_audits, vault_documents, nominees, streak_records, partner_configs, unlock_triggers, otp_requests, consent_records, notification_prefs, advisor_bookings, quiz_attempts).

---

## Step 3 — Create vault Storage bucket + policies (5 min)

1. Supabase dashboard → **SQL Editor** → **New query**.
2. Open [apps/api/sql/storage-policies.sql](apps/api/sql/storage-policies.sql) in your editor, copy the whole file.
3. Paste into the Supabase SQL editor → **Run**.
4. Verify in **Storage**: a bucket named `kin-vault-documents` exists and is **private** (no green "public" badge).
5. Verify in SQL editor: `select policyname from pg_policies where tablename = 'objects' and schemaname = 'storage';` returns 4 `kin_vault_owner_*` rows.

---

## Step 4 — Generate secrets (1 min)

```bash
cd /Users/santoshpathak/kin-mvp/kin-mvp     # repo root
./scripts/generate-secrets.sh
```

Copy the output into your password manager note ("KIN go-live secrets") alongside the Supabase values from step 1. You should now have all 9 production env vars ready:

```
DATABASE_URL          (from Supabase, pooler)
DATABASE_SSL=true
SUPABASE_URL          (from Supabase)
SUPABASE_ANON_KEY     (from Supabase)
SUPABASE_SERVICE_ROLE_KEY  (from Supabase)
JWT_SECRET            (generated)
VAULT_JWT_SECRET      (generated)
WHATSAPP_WEBHOOK_VERIFY_TOKEN  (generated, even though WhatsApp is deferred)
PARTNER_EMBED_ALLOWED_ORIGINS=https://app.kin.ai.in
```

---

## Step 5 — Deploy the API to Vercel (30 min)

```bash
cd apps/api

# First-time auth
vercel login

# Link to a fresh project
vercel link
# When prompted: link to existing project? N
# Project name: kin-api
# In which directory is your code located? ./
```

This creates `.vercel/project.json` (gitignored).

**Set all 9 env vars** — easiest path is via the Vercel dashboard:
1. https://vercel.com/<your-team>/kin-api/settings/environment-variables
2. Add each of the 9 vars from your secrets note. **Scope: Production only** for `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `VAULT_JWT_SECRET`, `DATABASE_URL`. Public ones (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `NODE_ENV`, `PARTNER_EMBED_ALLOWED_ORIGINS`) can be all 3 scopes.

(CLI alternative: `vercel env add VAR_NAME production`)

**Deploy to production**:
```bash
vercel --prod
```

You should see something like:
```
Vercel CLI
🔗  Linked to your-team/kin-api
🔍  Inspect: https://vercel.com/...
✅  Production: https://kin-api-<hash>.vercel.app
```

**Verify the deploy:**
```bash
curl -X POST https://kin-api-<hash>.vercel.app/api/v1/auth/session
```
Should return `{"sessionToken":"...","token":"...","request_id":"..."}` with HTTP 201.

If you get HTTP 500: check Vercel function logs (dashboard → Deployments → click the latest → Functions → click the function → Logs). Most common causes: a missing env var, a typo in `DATABASE_URL`, or `DATABASE_SSL` not set to `true`.

---

## Step 6 — Deploy the web to Vercel (15 min)

```bash
cd ../web
vercel link
# Project name: kin-web
# In which directory is your code located? ./
```

**Set 1 env var** in https://vercel.com/<your-team>/kin-web/settings/environment-variables:
```
VITE_API_BASE_URL=https://api.kin.ai.in/api/v1
```

> Note: until the custom domain is bound in Step 8, this URL won't resolve. The web app will still build, but calls to the backend will 502 until step 8 finishes. That is expected.

```bash
vercel --prod
```

You should get something like `https://kin-web-<hash>.vercel.app`.

Open the URL — you should see the KIN consent screen render (no API calls yet, so the UI works even without the backend domain).

---

## Step 7 — Bind custom domains (20 min + DNS propagation)

### 7a. Add domain in Vercel

For the API:
1. https://vercel.com/<your-team>/kin-api/settings/domains
2. Add `api.kin.ai.in` → Vercel will show you the required DNS record (a CNAME pointing at `cname.vercel-dns.com`).

For the web:
3. https://vercel.com/<your-team>/kin-web/settings/domains
4. Add `app.kin.ai.in` → same CNAME instructions.

### 7b. Add DNS records at your registrar

In your DNS console (Cloudflare / GoDaddy / Route53 / wherever `kin.ai.in` is hosted), add 2 CNAME records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `api` | `cname.vercel-dns.com` | 300 |
| CNAME | `app` | `cname.vercel-dns.com` | 300 |

(If your zone is `kin.ai.in` itself, "Name" is `api` and `app`. If your registrar wants fully-qualified names, use `api.kin.ai.in` and `app.kin.ai.in`.)

If you are on Cloudflare, set the proxy status to **DNS only** (grey cloud) — Vercel will manage the TLS cert itself and the orange-cloud proxy breaks that.

### 7c. Wait for propagation + SSL issuance

In Vercel → Domains, the status will go from "Pending DNS Verification" → "Valid Configuration" → "SSL Certificate Issued". This usually takes 2-10 minutes but can be up to an hour if your DNS provider is slow.

Verify:
```bash
dig +short api.kin.ai.in    # should return a cname.vercel-dns.com CNAME
dig +short app.kin.ai.in    # same

curl -I https://api.kin.ai.in/api/v1/auth/session   # should return HTTP 405 (POST-only) or 201 if you change to POST
curl -I https://app.kin.ai.in/                       # should return HTTP 200
```

---

## Step 8 — End-to-end smoke test (10 min)

This script runs the full 13-test pack against the production URLs.

```bash
cd /Users/santoshpathak/kin-mvp/kin-mvp
./scripts/smoke-test-prod.sh https://api.kin.ai.in
```

You should see 13 PASS lines and a final `ALL 13 SMOKE TESTS PASSED` banner. If any test fails the script exits non-zero with a FAIL message and which test failed.

### Common smoke-test failures and fixes

| Failure | Likely cause | Fix |
|---------|--------------|-----|
| Test 1 returns 500 | DB connection fails | Verify `DATABASE_URL` is the pooler URL with `?sslmode=require` (or `DATABASE_SSL=true`). Check Vercel function logs for the actual error. |
| Test 1 takes >10s | Cold start | Normal on first request after idle. Re-run; second pass should be <500ms. |
| Test 11 returns the `.local` stub URL | Supabase keys not set in Vercel | Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars on kin-api and redeploy. |
| Test 12 returns 403 from Supabase | Bucket missing or policies not applied | Re-run [apps/api/sql/storage-policies.sql](apps/api/sql/storage-policies.sql) in SQL editor. |
| Test 13 download returns wrong content | Wrong bucket / policy mismatch | Check `SUPABASE_VAULT_BUCKET=kin-vault-documents` env var; check bucket name in Storage UI. |

### Web app spot-checks

Open in browser:
1. https://app.kin.ai.in — consent screen renders, 3 toggles visible.
2. Click "Skip — stay anonymous" → diagnostic flow loads → complete 7 questions → score dial renders → recommendations page renders.
3. Open dev tools → Network tab → look for `POST /api/v1/score/save` returning 201 and `POST /api/v1/trust/recommendations` returning 201. These confirm the audit trail is being written.
4. https://api.kin.ai.in/api/docs → **must 404** (Swagger off in production).

---

## Step 9 — Lock down access (5 min)

Before sharing the URL with pilot users:

1. Vercel → kin-api → Settings → **Members**: remove anyone who should not see live OTPs in function logs.
2. Vercel → kin-api → Settings → **Deployment Protection** → enable "Vercel Authentication" for preview deploys (so PR previews are not publicly accessible).
3. Supabase → Project Settings → **API → JWT Settings**: rotate the JWT secret if you ever shared it during setup. (We don't actually use the Supabase JWT; our app issues its own with `JWT_SECRET`.)
4. Save a calendar reminder for **24h post-launch** to check Vercel function logs for unexpected errors and Supabase **Database → Reports** for slow queries.

---

## Step 10 — Hand-off

Generate the go-live report:

```bash
# Capture the smoke-test output to a file
./scripts/smoke-test-prod.sh https://api.kin.ai.in 2>&1 | tee docs/go-live-report-$(date -u +%Y%m%d-%H%M%S).log
```

Share with the pilot team:
- Web URL: `https://app.kin.ai.in`
- Where to read OTP during week-1: Vercel dashboard → kin-api → Deployments → Functions → Logs (search "[DEV] OTP issued for")
- Rollback procedure (if something breaks): `cd apps/api && vercel rollback`
- Sentry: not yet enabled — errors only in Vercel function logs for now

---

## Appendix A — Enabling Sentry later

We deferred Sentry for week-1 launch. To enable it:

1. Follow Appendix A in the plan file (`/Users/santoshpathak/.claude/plans/poc-infrastructure-context-graceful-sketch.md`) to create a Sentry project and get a DSN.
2. Vercel dashboard → kin-api → Settings → Environment Variables → add:
   ```
   SENTRY_DSN=<paste from Sentry dashboard>
   ```
   Production scope only.
3. Either trigger a redeploy (`vercel --prod` from `apps/api`) or wait for the next cold start (~10 min). The lazy-load helper picks up the DSN on init.
4. Verify: trigger a 500 (e.g. POST to `/api/v1/trust/recommendations` with malformed body) and check Sentry → Issues. The error should appear within 30 seconds.

No code change required. The `@sentry/node` package is already a dependency.

---

## Appendix B — Enabling WhatsApp later

We deferred WhatsApp for week-1 launch. To enable real send:

1. Follow Appendix B in the plan file to create a Meta Business account, get a permanent system-user token, and submit the 5 message templates for approval.
2. Once Meta approves the templates (status "Approved" in WhatsApp Manager), add 3 env vars in Vercel kin-api:
   ```
   WHATSAPP_PHONE_NUMBER_ID=<from Meta>
   WHATSAPP_ACCESS_TOKEN=<from Meta>
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=<value already in Vercel from step 4 of this runbook>
   ```
3. In Meta WhatsApp Manager → Configuration → Webhooks, set the callback URL to `https://api.kin.ai.in/api/v1/lifecycle/whatsapp/webhook` with your verify token. Subscribe to the `messages` field.
4. Redeploy (`vercel --prod` from `apps/api`).
5. Verify: trigger an OTP send (`curl -X POST https://api.kin.ai.in/api/v1/auth/whatsapp/otp -H "Content-Type: application/json" -d '{"phone":"+91XXXXXXXXXX"}'`) and confirm you receive the OTP on the phone.

`whatsapp.service.ts` already switches from sandbox to real send when `WHATSAPP_ACCESS_TOKEN` is set. No code change required.

---

## Troubleshooting

### "Refusing to start: required production env vars missing"
The `configuration.ts` startup assertion is doing its job — one of `JWT_SECRET`, `VAULT_JWT_SECRET`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` is missing or still set to `change-me-...`. Check Vercel env vars.

### CORS errors in browser console
The API's `PARTNER_EMBED_ALLOWED_ORIGINS` must include `https://app.kin.ai.in`. Verify in Vercel kin-api env vars; redeploy if you changed it.

### "Could not connect to database"
Make sure `DATABASE_SSL=true` is set on Vercel kin-api. Supabase requires SSL.

### Vercel function exceeds 30s timeout
`vercel.json` sets `maxDuration: 30`. If a query takes longer, check `pg_stat_activity` in Supabase for stuck queries; likely a missing index on a new query path.

### Web app shows "Failed to start session"
The web app falls back to a local-only session when the API is unreachable. If you see this in production, the API host or CORS is broken. Test the API directly with `curl` first.
