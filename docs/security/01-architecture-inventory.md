# 01 — Architecture inventory

Prepared as part of the open-source readiness review (branch
`prep/open-source-release`, October 2026). Everything below was established
by reading the repository; nothing was inferred from external systems.

## 1. Repository shape

pnpm 9 monorepo, Node 20+ (verified on Node 24), TypeScript throughout.

| Workspace | Role | Framework | Entry points |
|---|---|---|---|
| `apps/api` (`@kin/api`) | REST API, financial engines (server copy), AI orchestration, persistence | NestJS 10, TypeORM 0.3, Passport-JWT, class-validator, Helmet, Throttler | `src/main.ts` (long-running), `src/serverless.ts` + `api/index.ts` (Vercel function) |
| `apps/web` (`web`) | Installable PWA, all user-facing flows, client-side financial engines (the ones the UI uses) | React 18, Vite 5, React Router 6, Tailwind 3, vite-plugin-pwa | `src/main.tsx`, `index.html` |
| `packages/shared-types` | Type-only package | TypeScript | `src/index.ts` |
| `scripts/` | Operator helpers | bash | `generate-secrets.sh`, `smoke-test-prod.sh` |
| `docs/` | Audit history, brand guidelines, security notes, this review | Markdown | — |

Size: 224 tracked files, ~37k lines before this work.

## 2. Runtime topology

```
                         ┌──────────────────────────────────────────┐
                         │  Partner host app (optional, iframe)     │
                         │  ?partner_id=… → brand tokens only       │
                         └───────────────┬──────────────────────────┘
                                         │
   Browser / PWA                         ▼
┌──────────────────────────────────────────────────────────────────────┐
│ apps/web  (React 18 + Vite, served as static files, strict CSP)      │
│  ┌──────────────┐ ┌────────────────┐ ┌───────────┐ ┌──────────────┐  │
│  │ Diagnostic   │ │ Score / Recs   │ │ Discovery │ │ Vault / Nom. │  │
│  │ chat UI      │ │ engines (TS)   │ │ engine    │ │ (local+API)  │  │
│  └──────┬───────┘ └───────┬────────┘ └─────┬─────┘ └──────┬───────┘  │
│         │ JWT in sessionStorage (anonymous session minted on demand) │
└─────────┼─────────────────┼────────────────┼──────────────┼──────────┘
          │  /api/v1 (Vite proxy in dev, vercel.json rewrite in prod)  │
          ▼                 ▼                ▼              ▼
┌──────────────────────────────────────────────────────────────────────┐
│ apps/api  (NestJS 10)                                                │
│  Global: Helmet · CORS allow-list · ValidationPipe(whitelist,forbid) │
│          JwtAuthGuard (APP_GUARD) · ThrottlerGuard · RequestId · Filter│
│                                                                      │
│  auth ─ partner ─ diagnostic ─ score ─ trust ─ discovery ─ vault      │
│  engagement ─ content ─ connect(advisory) ─ lifecycle ─ health       │
│                                                                      │
│  shared/openai  ──► OpenAI (gpt-4o, gpt-4o-mini)  │ or scripted demo │
│  shared/compliance (regex guard on every AI message)                 │
│  lib/supabase  ──► Supabase Storage (signed URLs, service role)      │
│  lifecycle/whatsapp ──► Meta Graph API (sandbox unless token set)    │
│  common/sentry ──► Sentry (no-op without DSN)                        │
└───────────────┬──────────────────────────────────────────────────────┘
                │ TypeORM
        ┌───────┴────────┐
        │ Postgres       │  production: Supabase (transaction pooler)
        │ or SQL.js file │  local/demo: DATABASE_DRIVER=sqljs
        └────────────────┘
```

Trust boundaries: (1) partner host ↔ web (only brand tokens cross; no PII);
(2) browser ↔ API (bearer JWT, two scopes: `standard`, `vault`); (3) API ↔
third parties (OpenAI, Supabase, Meta, Sentry) with server-side secrets
only; (4) API ↔ database (service-role credentials; RLS policies exist as
defence in depth but are bypassed by the service role).

## 3. Frameworks, runtimes, databases

- **Runtime:** Node ≥ 20 (`engines`), pnpm 9.12 (now pinned via `packageManager`).
- **API:** NestJS 10.4 (final 10.x), Express 4 adapter, TypeORM 0.3.31.
- **Databases:** PostgreSQL via Supabase in production (4 migrations under
  `apps/api/src/database/migrations`, RLS policies in migration 002);
  SQL.js single-file database for local/demo (`synchronize: true`, never
  used against Postgres).
- **Object storage:** Supabase Storage bucket `kin-vault-documents`, private,
  per-user key prefix `vault/<userId>/<docId>`, RLS SQL in
  `apps/api/sql/storage-policies.sql`. AWS S3 config keys exist in
  `configuration.ts` but nothing uses them (legacy).
- **Web:** React 18.3, Vite 5.4, React Router 6.30, Tailwind 3.4, PWA with
  Workbox. State is mostly `sessionStorage`/`localStorage`; several modules
  (vault, streak, quiz, briefs) are local-first with API persistence only
  for the audit trail.

## 4. Authentication and authorization

| Mechanism | Where | Notes |
|---|---|---|
| Anonymous session → JWT (`scope: standard`, 7 d) | `POST /auth/session` | No PII; `consentedPii: false` |
| WhatsApp OTP → verified identity | `POST /auth/whatsapp/otp`, `/verify` | 6-digit, SHA-256 hashed at rest, single-use (consumed on any attempt), 5-min TTL, now 5 req/min/IP |
| Google OAuth | `POST /auth/google` | Stub, returns 501 |
| Vault step-up JWT (`scope: vault`, 1 h, separate secret) | `POST /auth/vault-token` | Requires verified phone; recency re-auth noted as future work |
| Global `JwtAuthGuard` (`APP_GUARD`) | all routes unless `@Public()` | Vault controller is `@Public()` + `VaultGuard` (vault scope) |
| Ownership checks | every service that loads by id | `findOne({ id, userId })` or explicit `userId !==` → 403/404 |
| Rate limiting | `ThrottlerGuard` 100/min/IP global; vault 10/min; OTP 5/min | in-process store (per instance) |
| DPDP erasure | `DELETE /auth/me` | cascades; audit rows retained with PII scrubbed |

## 5. Third-party APIs and integrations

| Integration | Purpose | Secret | Status | Can run without it? |
|---|---|---|---|---|
| OpenAI (`openai` SDK) | Conversational diagnostic, Tier-1 advisor, escalation detector, advisor brief | `OPENAI_API_KEY` (paid) | Live when key set | **Yes** — demo mode substitutes a deterministic scripted client |
| Supabase Postgres | Primary DB | `DATABASE_URL` | Live in prod | Yes — SQL.js driver |
| Supabase Storage | Vault document files | `SUPABASE_SERVICE_ROLE_KEY` | Live in prod | Yes — stub URLs are returned |
| Meta WhatsApp Cloud API | OTP delivery, nudges, inbound STOP | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET`, verify token | **Sandbox only** — send path is commented out; OTP is printed to the dev log | Yes |
| Sentry | Error capture | `SENTRY_DSN` | Optional | Yes — no-op |
| Vercel | Hosting (web static + API function) | Vercel project env | `apps/*/vercel.json` | Not needed locally |
| Google Fonts | Manrope typeface | none | `index.html` link + CSP allow | Yes (falls back to system font) |

Outbound hosts referenced in code/docs: `api.openai.com` (via SDK),
`*.supabase.co`, `graph.facebook.com` (commented), `fonts.googleapis.com`,
`fonts.gstatic.com`, Sentry ingest, plus public links to IRDAI, EPFO,
Jan Suraksha, insurer purchase pages. No analytics, tag managers, pixels
or session-replay SDKs exist in the codebase.

## 6. CI/CD and deployment

- No CI existed. This branch adds `.github/workflows/ci.yml` (typecheck,
  tests, build, prod audit, gitleaks history scan).
- Deployment is Vercel for both apps (`apps/web/vercel.json`,
  `apps/api/vercel.json`); `DEPLOYMENT.md` is the runbook. The web
  `vercel.json` carries a strict CSP, HSTS, frame-ancestors none.
- Secrets live in Vercel project environment variables; nothing is
  committed (see `02-secrets-audit.md`).

## 7. Environment variables

The full, placeholder-only template is `apps/api/.env.example`. Sensitive
ones: `JWT_SECRET`, `VAULT_JWT_SECRET`, `DATABASE_URL`/`DATABASE_PASS`,
`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `WHATSAPP_ACCESS_TOKEN`,
`WHATSAPP_APP_SECRET`, `SENTRY_DSN`. Startup refuses to boot in production
if any required secret is missing or still a `change-me` default
(`apps/api/src/config/configuration.ts`). New on this branch:
`KIN_DEMO_MODE`, `WHATSAPP_APP_SECRET`, `DATABASE_SSL_REJECT_UNAUTHORIZED`,
`DATABASE_SSL_CA`, `DATABASE_LOG_QUERIES`, `MAX_CONVERSATION_TURNS`.
The web app has exactly one public variable, `VITE_API_BASE_URL`.

## 8. Financial protection engine

Three implementations exist (documented in detail in
`../financial-methodology.md`):

1. `apps/web/src/modules/score/scoreEngine.ts` — **authoritative at runtime**;
   the UI computes the score here and posts the result to `/score/save`.
2. `apps/api/src/modules/score/protection-score.service.ts` — server copy
   used by `/score/calculate`; same shape, different constants.
3. `apps/web/src/modules/trust/recommendationEngine.ts` and
   `apps/api/src/modules/trust/recommendation.service.ts` — rule-based
   recommendations with "See the Math" basis text; both deterministic.

Supporting engines: `discoveryEngine` (hidden coverage such as EDLI, PMSBY),
`peer-benchmark.service` (static table), `profile-mapper.service`
(conversation → profile, with estimation rules).

## 9. Logging, monitoring, analytics

- Nest `Logger` to stdout; Vercel function logs in production.
- Sentry optional, with a `beforeSend` scrubber for auth headers and
  phone/OTP/Aadhaar fields.
- No product analytics or tracking of any kind.
- Logging hygiene fixes on this branch: WhatsApp phone masking, compliance
  guard session-token truncation, SQL parameter logging now opt-in.

## 10. Tests and existing controls

Before this branch: 6 jest specs (38 tests, 2 stale failures), no web
tests, no CI, lint non-functional (ESLint 9 without flat config). After:
12 jest suites / 114 tests, 3 vitest suites / 26 tests, CI workflow, web
lint config. See `../../OPEN_SOURCE_READINESS_REPORT.md` §11.

## 11. Classification

| Question | Answer |
|---|---|
| Essential components | `apps/web`, `apps/api` (auth, diagnostic, score, trust, discovery, vault, health), `packages/shared-types`, migrations |
| Components holding sensitive configuration | `apps/api` only (`.env`, Vercel env). The web bundle contains no secrets. |
| Integrations that could expose production systems | Supabase service-role key (bypasses RLS), WhatsApp access token, OpenAI key, Sentry DSN — all server-side env vars, none committed |
| Services requiring paid keys | OpenAI; WhatsApp Cloud API (per-conversation pricing); Supabase/Vercel beyond free tiers |
| Components that run on mock/synthetic data | Everything: SQL.js DB, demo-mode AI, stub storage URLs, sandbox WhatsApp, static partner list, static briefs/quiz |
| Features needing extra configuration to be real | AI diagnostic/advisor (OpenAI), file upload/download (Supabase Storage), OTP delivery and nudges (WhatsApp), partner embedding (partner_configs rows + CORS origins), Google login (not implemented) |
