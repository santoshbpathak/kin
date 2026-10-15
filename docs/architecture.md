# Architecture

KIN is a two-app pnpm monorepo: a React PWA (`apps/web`) and a NestJS API
(`apps/api`), with a types-only package (`packages/shared-types`). A full
inventory with the trust-boundary diagram lives in
[`security/01-architecture-inventory.md`](security/01-architecture-inventory.md);
this page is the short tour.

## Request flow

```
browser ──(JWT bearer)──► /api/v1/* ──► NestJS guards ──► module controller ──► service ──► TypeORM ──► Postgres | SQL.js
                                                            │
                                                            ├──► OpenAI (or scripted demo client)
                                                            ├──► Supabase Storage (signed URLs)
                                                            └──► WhatsApp Cloud API (sandbox by default)
```

1. The web app mints an **anonymous session** on first API call
   (`POST /auth/session`) and keeps the JWT in `sessionStorage`.
2. Every route is behind the global `JwtAuthGuard` unless marked
   `@Public()`. The global `ValidationPipe` whitelists request bodies.
3. The **vault** uses a second, short-lived JWT scope that only a
   WhatsApp-verified user can obtain.
4. Everything AI-related goes through `shared/openai/openai.client.ts`;
   in demo mode that returns a deterministic scripted client.
5. Every AI reply passes the `ComplianceGuardService` regex layer before it
   reaches a user.

## User journey and the modules behind it

| Step | Web module | API module | Persistence |
|---|---|---|---|
| Consent + anonymous session | `auth` | `auth`, `partner` | `user_profiles`, `consent_records` |
| Conversational diagnostic | `diagnostic` (chat UI) | `diagnostic` (intake agent, mapper) | `intake_conversation_sessions`, `user_profiles` |
| Protection Score | `score` (**engine runs here**) | `score` (`/save` for audit; `/calculate` server copy) | `protection_scores` |
| Recommendations + "See the Math" | `trust` (engine runs here) | `trust` (immutable audit rows) | `recommendation_audits` |
| Hidden coverage discovery | `discovery` | `discovery` | — |
| Vault (documents, nominees, unlock) | `vault` (local-first) | `vault` (vault JWT) | `vault_documents`, `nominees`, `unlock_triggers`, Supabase Storage |
| Streaks, quiz, briefs | `engagement`, `quiz`, `content` | `engagement`, `content` | `streak_records`, `quiz_attempts` |
| AI advisor and human hand-off | `connect` | `connect` (advisory tiers) | `advisor_sessions`, `advisor_bookings` |
| Notifications, STOP, settings | `lifecycle` | `lifecycle` (WhatsApp webhook) | `notification_prefs` |

## Key design decisions

- **Anonymous by default.** No PII until the user verifies a phone number;
  the partner layer never sees identity.
- **Deterministic money.** Scores and recommendations are rule-based,
  versioned (`RULE_VERSION`) and logged with their basis text so a
  recommendation can be explained later. See
  [`financial-methodology.md`](financial-methodology.md).
- **Client-side engine is authoritative today.** The server engine exists
  but the UI computes locally and posts the result for the audit trail.
  The two have drifted; unifying them is the top methodology task.
- **Serverless-friendly state.** Conversation history, OTPs and bookings
  live in the database, not in memory, so cold starts are safe.
- **Demo mode is a first-class path**, not a mock left in by accident:
  `KIN_DEMO_MODE` swaps only the LLM client; every other layer runs the
  real code against a local SQL.js file.

## Security architecture in one paragraph

Bearer JWTs (7-day standard, 1-hour vault scope with a separate secret),
global guard + whitelist validation, ownership checks on every by-id
access, Helmet and a strict CSP, CORS allow-list, per-IP throttling with
tighter budgets on OTP and vault routes, hashed single-use OTPs, HMAC-
verified webhooks, PII-masked logs, Sentry scrubbing, RLS on every user
table as defence in depth, private storage bucket with per-user prefixes
and 15-minute signed URLs. Details and open items:
[`security/04-application-security.md`](security/04-application-security.md).

## Where things are

```
apps/api/src
  app.module.ts            root module, DB + throttler config
  main.ts / serverless.ts  bootstraps (long-running / Vercel)
  common/                  guards, filters, interceptors, sentry
  config/configuration.ts  every env var, production assertions
  database/                entities, migrations (Postgres), column-type shims (SQL.js)
  modules/<feature>/       controller + service per feature
  shared/openai            real + scripted LLM clients
  shared/compliance        output guard
  shared/demo              synthetic personas
apps/web/src
  modules/<feature>/       page + components + local store/engine
  lib/apiClient.ts         fetch wrapper, anonymous-session bootstrap
  theme/BrandProvider.tsx  partner brand tokens → CSS variables
  components/              shared UI, DemoBanner
```
