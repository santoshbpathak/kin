# 02 — Secrets and credential exposure audit

Scope: full working tree (tracked, untracked and ignored files), all 22
commits on all 5 branches of `santoshbpathak/kin-mvp`, configuration,
scripts, documentation, test fixtures, build artefacts and logs present on
the machine. Tools: **gitleaks 8.30.1** (history scan `gitleaks git` and
directory scan `gitleaks dir`), targeted greps for provider key formats
(AWS `AKIA…`, OpenAI `sk-…`, Supabase JWTs `eyJ…`, Meta `EAA…`, Postgres
URLs, private-key PEM headers), and manual review of every configuration
file. TruffleHog and Semgrep were not installed; gitleaks plus manual review
covered the same classes of secret.

No secret values appear in this document.

## Summary

| Area | Result |
|---|---|
| Git history (22 commits, all branches) | **No leaks.** gitleaks: 0 findings. No `.env`, key, PEM, dump or backup file was ever committed. |
| Tracked working tree | **No real secrets.** Only documented placeholders in `.env.example`. |
| Ignored / untracked files | One local tool token in `.gstack/browse.json` (gitignored, not part of the project, belongs to a developer utility). |
| Hard-coded fallbacks in source | Three dev-only defaults, one of which (WhatsApp verify token) was a real risk once public — **fixed**. |
| Commit metadata | Author email is a personal address (see `03-privacy-audit.md`). |

## Findings

| # | Location | Category | Severity | In history? | Exposed? | Remediation | Rotation needed? |
|---|---|---|---|---|---|---|---|
| S-1 | `apps/api/src/modules/lifecycle/lifecycle.controller.ts:79` (before) | Hard-coded webhook verify token fallback `kin_webhook_verify_2026` | **HIGH once public** (anyone could complete the Meta webhook handshake) | Yes, since initial commit | Repo was private; no evidence of use | Removed. No default exists; unset token disables the handshake. Also read from the correct config key (was `WHATSAPP_VERIFY_TOKEN`, config defines `WHATSAPP_WEBHOOK_VERIFY_TOKEN`). | **Yes** — if that value was ever pasted into a Meta app, change it there. |
| S-2 | `apps/api/src/config/configuration.ts:64-67`, `jwt.strategy.ts:17`, `vault-jwt.strategy.ts:13` | Dev-only JWT secret fallbacks (`dev-secret-change-in-prod`, `dev-vault-secret`, `dev-secret`) | LOW | Yes | N/A (dev) | Kept; production startup already refuses any secret starting with `change-me` or missing. Added to documentation. Note the strategy fallbacks can never be reached because `ConfigService` always returns the configured default. | No |
| S-3 | `apps/api/.env.example:14-20` | Local Postgres credentials `kin_user:kin_pass@localhost` | INFO | Yes | Placeholder | Kept (obvious placeholder); allow-listed in `.gitleaks.toml`. | No |
| S-4 | `apps/api/.env.example` (`OPENAI_API_KEY=sk-...`) | Placeholder that looks like a key prefix | INFO | Yes | Placeholder | Changed to `sk-REPLACE_ME`, which the client code recognises and treats as "not set". | No |
| S-5 | `.gstack/browse.json` (ignored) | Local developer-tool API token | INFO (outside repo) | No | No | Already gitignored; `.gitignore` now also excludes `.env.*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `.vercel/`. | No |
| S-6 | `scripts/smoke-test-prod.sh` | Hard-coded dummy phone that would receive a real OTP once WhatsApp goes live | LOW | Yes | N/A | Replaced with a required `SMOKE_PHONE` env var. | No |
| S-7 | `apps/api/src/modules/auth/auth.service.ts:69-73` | Dev log prints the full OTP (phone masked) | LOW | Yes (initial version printed the full phone) | Dev only; gated on `NODE_ENV !== 'production'` | Kept for local testing; comment corrected; production asserts `NODE_ENV`. | No |
| S-8 | `apps/api/src/app.module.ts` | TypeORM query logging in development prints bound parameters (phone numbers) to stdout | LOW | Yes | Dev only | Now opt-in via `DATABASE_LOG_QUERIES=true`; default dev logging is errors/warnings/migrations only. | No |

Checked and clean: Supabase project refs, Vercel ids, Sentry DSNs, OpenAI
org ids, WhatsApp phone-number ids, AWS keys, SSH/TLS keys, OAuth client
secrets, SMTP/SMS credentials, payment gateway keys (Stripe/Razorpay — not
used at all), Docker/CI files (none existed), build artefacts (`dist/`
ignored), logs (only local scratch logs, outside the repo).

## Protection going forward

- `.gitleaks.toml` added with the placeholder allow-list; CI runs gitleaks
  over the full history on every push and PR.
- `.gitignore` hardened (see S-5).
- `configuration.ts` refuses to start in production without real secrets
  and now warns when database TLS verification is off or demo mode is on.
- `scripts/generate-secrets.sh` remains the documented way to mint
  `JWT_SECRET`/`VAULT_JWT_SECRET`.

## Historical exposure statement

Because no secret was ever committed, **no history rewrite is required for
secrets.** History rewriting is still recommended for the confidential
documents and image metadata described in `03-privacy-audit.md`; that is a
separate decision for the owner.
