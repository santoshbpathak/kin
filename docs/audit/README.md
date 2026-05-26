# KIN MVP1 - Go-Live Readiness Report

**Audit date:** 2026-05-26
**Branch:** main (with 26 uncommitted modifications - included in scope)
**Stack evaluated:** POC (Supabase + Vercel + Sentry free tier) per `~/.claude/projects/.../memory/CLAUDE.md`
**PRD reference:** [KIN_PRD_v3.md](../../KIN_PRD_v3.md)
**Methodology:** Full static read of every backend/frontend module, dynamic boot of API+web on SQL.js, end-to-end 7-step flow probe via curl, load tests via ApacheBench (k6 unavailable on this machine, no Homebrew).

---

## TL;DR - GO / NO-GO recommendation

**Recommendation: NO-GO for POC pilot in current state.**

The code shows strong architectural intent — clean module boundaries, IRDAI-aligned audit entity, DPDP consent model, vault elevated-scope JWT, immutability hooks, rule-versioning, request-id propagation. But several wiring-level defects mean the system **does not actually deliver the PRD guarantees** in the current build:

1. **Score, Trust, Diagnostic, and Auth (vault-token, consent) endpoints crash with HTTP 500** when invoked, because `JwtAuthGuard` is never registered globally and these controllers omit `@UseGuards(AuthGuard('jwt'))`. Confirmed dynamically: `POST /v1/score/calculate` returns 500 on 200/200 load test requests.
2. **The frontend never calls the backend** for score, recommendations, vault, discovery, or audit logging. All calculations run client-side in TypeScript, results stored in `sessionStorage` / `localStorage`. This means the IRDAI `recommendation_audit` records are **never written**, breaking the PRD's hard requirement that "every recommendation has a logged audit record."
3. **WhatsApp OTP auth is broken end-to-end** due to a field-name mismatch: frontend sends `{phone}`, backend DTO requires `{mobile}` and rejects unknown properties.
4. **`See the Math` API returns a placeholder stub** instead of the basis text - PRD CG-8 violation if the frontend ever switches to using the backend.
5. **Database schema diverges from entity definitions**: migration creates `recommendation_audit` (singular) but the TypeORM entity is annotated `@Entity('recommendation_audits')` (plural). With `synchronize: true` (dev/SQL.js) tables get the entity name and the DB-level immutability trigger from the migration is **never installed**. With `synchronize: false` (intended for production Postgres) the entities can't find their tables.
6. **No `vercel.json`**, **no Supabase client wiring**, **no Sentry init**, **no CI/CD**, **no test files** despite test infrastructure being installed.
7. **PII leakage in logs**: OTP plus mobile number written to console plaintext.
8. **Rate limit ineffective under burst**: 110 concurrent requests in 1 second returned all 200/201, despite the throttler being configured for 100/minute.

The 7 features themselves are mostly **built in the frontend** as client-side simulations - they look correct, they pass the user through the 10-step flow, and the deterministic engines are well-implemented. But because the audit trail never reaches the database and key auth-protected endpoints crash, the system would **fail the regulator-facing integrity guarantees** the moment a real pilot user generated a recommendation.

### Estimate to GO

Roughly **5-8 engineer-days** of focused work to clear the blockers in section §06. None of the gaps are deep architectural rewrites — they are wiring fixes, missing test files, deployment config, and one DB schema reconciliation.

---

## Report structure

| File | Contents |
|------|----------|
| [00-codebase-snapshot.md](00-codebase-snapshot.md) | Tech stack, module inventory, working-tree state, what's actually in the repo |
| [01-feature-matrix.md](01-feature-matrix.md) | 7 features × PRD acceptance criteria × ✅/⚠️/❌ verdicts with file evidence |
| [02-integration-status.md](02-integration-status.md) | Per-integration: WhatsApp, Google SSO, S3/Supabase, DB, Sentry, partner webhook, CI/CD |
| [03-security-findings.md](03-security-findings.md) | Zero-PII boundary, DPDP, IRDAI audit trail, OWASP scan |
| [04-performance-findings.md](04-performance-findings.md) | Static review + ab load test results + index coverage |
| [05-gtm-readiness.md](05-gtm-readiness.md) | Pilot metrics instrumentation, content readiness, partner SDK docs |
| [06-critical-blockers.md](06-critical-blockers.md) | P0 items that block go-live - with line-level evidence |
| [07-action-list.md](07-action-list.md) | Must-fix / should-fix / can-defer with effort estimates |
| [loadtest/](loadtest/) | ApacheBench load test artifacts |

---

## Severity legend

| Tag | Meaning |
|-----|---------|
| 🔴 P0 | Blocks POC go-live. Must fix before any user enters the system. |
| 🟠 P1 | Should fix before POC, but pilot can run with explicit acknowledgment. |
| 🟡 P2 | Fix during pilot, doesn't block launch. |
| 🟢 OK | Verified working as expected. |
| ⚠️ POC-deferred | Acknowledged not built per POC scope (CloudWatch, SAST, partner analytics). |

---

## How to verify findings

Every claim cites a file path and (where relevant) a line number. Recommended spot-checks:

1. **JWT guard missing globally**: read [apps/api/src/app.module.ts](../../apps/api/src/app.module.ts) lines 134-137 — only `ThrottlerGuard` is registered as `APP_GUARD`.
2. **Frontend bypasses backend**: search `grep -rn "fetch.*api/v1" apps/web/src` — only 4 calls (3 auth, 1 partner brand).
3. **Audit immutability trigger never runs in dev**: migration is at [InitialSchema1700000000000](../../apps/api/src/database/migrations/1700000000000-InitialSchema.ts) lines 109-126 but `migrationsRun: false` (app.module.ts line 86) and entity table name is plural.
4. **Score endpoint crashes**: run `pnpm dev:local`, then `curl -X POST http://localhost:3001/api/v1/score/calculate -H "Authorization: Bearer $(curl -s -X POST http://localhost:3001/api/v1/auth/session | jq -r .token)" -H "Content-Type: application/json" -d '{...}'` — returns HTTP 500.
5. **OTP PII in logs**: `grep -n "console.log.*OTP" apps/api/src/modules/auth/auth.service.ts` → line 48.

The audit was conducted against the working tree (modified-but-uncommitted files included).
