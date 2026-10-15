# §00 Codebase Snapshot

## Repository layout

```
kin-mvp/
├── apps/
│   ├── api/                # NestJS 10 backend (port 3001)
│   └── web/                # React 18 + Vite PWA (port 5173)
├── packages/
│   └── shared-types/       # Canonical TypeScript domain types
├── Compliance Manual.pdf   # 304 KB compliance reference
├── README.md               # Minimal: 30 lines, dev:local script only
├── package.json            # Root pnpm workspace
└── pnpm-workspace.yaml     # apps/* + packages/*
```

**What's missing:** no `Dockerfile`, no `docker-compose.yml`, no `vercel.json`, no `.github/workflows/` directory, no root `tsconfig.json` for path mapping, no `.env.example` for the web app, no `apps/web/jest.config` or vitest config.

## Tech stack confirmed

| Layer | Implementation | PRD requirement | Match? |
|-------|----------------|------------------|--------|
| Backend framework | NestJS 10 | NestJS | ✅ |
| Backend deployment target | Per CLAUDE.md: Vercel (serverless) | Per PRD: AWS EC2/ECS | POC-relaxed - flag missing `vercel.json` |
| DB driver (dev) | sql.js 1.14 (TypeORM 0.3.19) | - | OK for dev only |
| DB driver (prod) | PostgreSQL 16 via Supabase | Postgres on AWS RDS | POC-relaxed, but no Supabase client in code yet |
| Auth | passport + @nestjs/jwt 10 | OAuth 2.0 + JWT | ✅ |
| Storage (vault) | Stub returning hardcoded S3 URL | AWS S3 ap-south-1 + presigned URLs | POC needs Supabase Storage replacement, currently unimplemented |
| Messaging | WhatsApp Business Cloud API (sandbox mode) | WhatsApp Business API | ⚠️ Phase-1 sandbox only |
| Frontend | React 18 + Vite 5 + Tailwind 3 + Zustand | React/React Native | ✅ (web only, no native) |
| Monorepo | pnpm 9 workspaces | not specified | ✅ |
| Node | ≥20.0.0 | not specified | ✅ |

## Backend module inventory (11 modules, all imported in [app.module.ts](../../apps/api/src/app.module.ts))

| Module | Path | Auth guard applied? | Status |
|--------|------|---------------------|--------|
| `auth` | [modules/auth/](../../apps/api/src/modules/auth/) | Mix - `@Public()` on 3 endpoints, NO guard on vault-token + consent (which call `user.sub` → 500) | 🔴 partially broken |
| `partner` | [modules/partner/](../../apps/api/src/modules/partner/) | All `@Public()` | ✅ |
| `diagnostic` | [modules/diagnostic/](../../apps/api/src/modules/diagnostic/) | NO guard, calls `user.sub` → 500 | 🔴 broken |
| `score` | [modules/score/](../../apps/api/src/modules/score/) | NO guard, calls `user.sub` → 500 | 🔴 broken |
| `trust` | [modules/trust/](../../apps/api/src/modules/trust/) | NO guard, calls `user.sub` → 500 (and "See the Math" is stubbed) | 🔴 broken |
| `discovery` | [modules/discovery/](../../apps/api/src/modules/discovery/) | NO guard, but uses `_user` (unused) so doesn't crash | ⚠️ unauthenticated but functional |
| `vault` | [modules/vault/](../../apps/api/src/modules/vault/) | `@UseGuards(VaultGuard)` on whole controller | ✅ (but vault-token issuance broken) |
| `engagement` | [modules/engagement/](../../apps/api/src/modules/engagement/) | `@UseGuards(AuthGuard('jwt'))` ✅ | ✅ |
| `content` | [modules/content/](../../apps/api/src/modules/content/) | `@UseGuards(AuthGuard('jwt'))` ✅ | ✅ |
| `connect` | [modules/connect/](../../apps/api/src/modules/connect/) | `@UseGuards(AuthGuard('jwt'))` ✅ | ✅ |
| `lifecycle` | [modules/lifecycle/](../../apps/api/src/modules/lifecycle/) | Per-endpoint `@UseGuards` ✅; webhook unguarded by design | ✅ |

**Pattern of the bug:** the 4 broken modules use `@CurrentUser()` + `user.sub` but forgot the `@UseGuards(AuthGuard('jwt'))` line. The 4 working modules add it. There is no global guard registered ([app.module.ts:134-137](../../apps/api/src/app.module.ts#L134-L137) only has `ThrottlerGuard`).

## Database entities (9 entities)

All in [apps/api/src/database/entities/](../../apps/api/src/database/entities/). All use `@PrimaryGeneratedColumn('uuid')`. Table name annotations are **plural**.

| Entity | File | Table name (from `@Entity`) | Table name (from migration) | Match? |
|--------|------|------------------------------|------------------------------|--------|
| UserProfile | [user-profile.entity.ts](../../apps/api/src/database/entities/user-profile.entity.ts) | `user_profiles` | `user_profile` | ❌ mismatch |
| ProtectionScore | protection-score.entity.ts | `protection_scores` (assumed plural) | `protection_score` | ❌ mismatch |
| RecommendationAudit | [recommendation-audit.entity.ts](../../apps/api/src/database/entities/recommendation-audit.entity.ts) | `recommendation_audits` | `recommendation_audit` | ❌ mismatch |
| VaultDocument | [vault-document.entity.ts](../../apps/api/src/database/entities/vault-document.entity.ts) | `vault_documents` | `vault_document` | ❌ mismatch |
| Nominee | nominee.entity.ts | `nominees` (assumed plural) | `nominee` | ❌ mismatch |
| StreakRecord | streak-record.entity.ts | `streak_records` | `streak_record` | ❌ mismatch |
| PartnerConfig | partner-config.entity.ts | `partner_configs` | `partner_config` | ❌ mismatch |
| UnlockTrigger | unlock-trigger.entity.ts | `unlock_triggers` | `unlock_trigger` | ❌ mismatch |
| (helper) column-types.ts | column-types.ts | n/a | n/a | utility |

**This singular-vs-plural divergence is hidden in dev** because [app.module.ts:69](../../apps/api/src/app.module.ts#L69) sets `synchronize: true` for SQL.js, so TypeORM autogenerates plural tables from the entities and never runs the migration. In production it surfaces immediately: if you run the migration first (singular tables) entities can't find them; if you let TypeORM synchronize (plural tables) the **DB-level immutability trigger from the migration is silently absent** and `recommendation_audit` would lose IRDAI compliance.

## Migration coverage

Single migration: [1700000000000-InitialSchema.ts](../../apps/api/src/database/migrations/1700000000000-InitialSchema.ts) (243 lines).

- ✅ Creates all 8 tables with pgcrypto UUIDs
- ✅ Adds indexes on FK columns: `idx_user_profile_session_token`, `idx_protection_score_user_id`, `idx_recommendation_audit_score_id`, `idx_vault_document_user_id`, `idx_nominee_user_id`, `idx_streak_record_user_id`, `idx_unlock_trigger_user_id`, `idx_unlock_trigger_token`
- ✅ Creates DB-level immutability via PostgreSQL trigger `fn_recommendation_audit_immutable` on UPDATE/DELETE
- ❌ Migration auto-run is disabled (`migrationsRun: false`, [app.module.ts:86](../../apps/api/src/app.module.ts#L86))
- ❌ No row-level security (RLS) policies — noted in code as "Phase 2"
- ❌ No `recommendation_audit.user_id` column in the migration schema, even though the entity has `userId` (insert in [recommendation.service.ts:159-170](../../apps/api/src/modules/trust/recommendation.service.ts#L159-L170) writes to it)

## Environment configuration

[apps/api/.env.example](../../apps/api/.env.example) (45 lines) declares:

- Database: postgres/sqljs driver toggle, URL, host, port, name, user, pass, SSL
- Auth: `JWT_SECRET`, `JWT_EXPIRY=7d`, `VAULT_JWT_SECRET`, `VAULT_JWT_EXPIRY=1h` (no refresh token logic)
- AWS: region (ap-south-1), access keys, S3 bucket, presigned URL expiry (900s) — **but no AWS SDK actually imported anywhere**, see `grep -rn "aws-sdk" apps/`
- WhatsApp: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- Partner: `PARTNER_EMBED_ALLOWED_ORIGINS`
- Rate limiting: `RATE_LIMIT_TTL=60`, `RATE_LIMIT_MAX=100`, `VAULT_RATE_LIMIT_MAX=10`
- Sentry: `SENTRY_DSN=` (empty) — **and no `@sentry/*` import anywhere**

**Missing from env config (POC-required per CLAUDE.md):**
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — none defined
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` — none defined (and no Google OAuth endpoint exists either, despite frontend redirecting to `/api/v1/auth/google`)
- `SMS_FALLBACK_*` — no SMS gateway provider configured

## Frontend module inventory

| Module | Path | Backend wired? | Notes |
|--------|------|----------------|-------|
| auth | [modules/auth/](../../apps/web/src/modules/auth/) | ✅ `/auth/session`, `/auth/whatsapp/otp`, `/auth/whatsapp/verify` (with `{phone}` field name that backend rejects), `/auth/google` (which doesn't exist) | Field-name mismatch breaks WhatsApp OTP |
| diagnostic | [modules/diagnostic/](../../apps/web/src/modules/diagnostic/) | ❌ Client-side parser only, results in sessionStorage | Backend `/diagnostic/complete` never called |
| score | [modules/score/](../../apps/web/src/modules/score/) | ❌ Client-side `scoreEngine.ts` only | Backend `/score/calculate` never called - no audit record written |
| trust | [modules/trust/](../../apps/web/src/modules/trust/) | ❌ Client-side `recommendationEngine.ts` only | Backend `/trust/recommendations` never called - **NO IRDAI AUDIT TRAIL CREATED** |
| discovery | [modules/discovery/](../../apps/web/src/modules/discovery/) | ❌ Client-side `discoveryEngine.ts` only | Backend `/discovery/evaluate` never called |
| vault | [modules/vault/](../../apps/web/src/modules/vault/) | ❌ `vaultStore.ts` writes to localStorage | Backend `/vault/*` never called - documents never leave the device |
| engagement | [modules/engagement/](../../apps/web/src/modules/engagement/) | ❌ Local state only | Backend `/engagement/streak`, `/engagement/quiz` never called |
| quiz | [modules/quiz/](../../apps/web/src/modules/quiz/) | ❌ Local `quizData.ts` | Backend `/engagement/quiz/*` never called |
| content | [modules/content/](../../apps/web/src/modules/content/) | ❌ Local `briefData.ts` | Backend `/content/brief/*` never called |
| connect | [modules/connect/](../../apps/web/src/modules/connect/) | ❌ Local `connectStore.ts` | Backend `/connect/*` never called |
| lifecycle | [modules/lifecycle/](../../apps/web/src/modules/lifecycle/) | ❌ Local `lifecycleStore.ts` | Backend `/lifecycle/*` never called |
| home | [modules/home/](../../apps/web/src/modules/home/) | n/a | Static page |
| privacy | [modules/privacy/](../../apps/web/src/modules/privacy/) | n/a | Static page |
| notfound | [modules/notfound/](../../apps/web/src/modules/notfound/) | n/a | 404 |
| theme | [theme/BrandProvider.tsx](../../apps/web/src/theme/BrandProvider.tsx) | ✅ `/partner/brand/:key` | Working |

**Total fetch calls to backend from web:** 4. See [03-security-findings.md](03-security-findings.md) for the IRDAI implication.

## Shared types

[packages/shared-types/src/index.ts](../../packages/shared-types/src/index.ts) (337 lines). Comprehensive domain type coverage: AuthResponse, JwtPayload, BrandTokens, ParsedProfile, ScoreResult, PeerBenchmark, Recommendation, HiddenCoverage, VaultDocumentSummary, NomineeSummary, UnlockTriggerStatus, StreakState, BadgeDefinition, QuizQuestion, KinIqHistory, NotificationPrefs, ApiResponse, ApiError. **Types-only package, no runtime deps**. Quality is high.

## Working-tree state (uncommitted at audit time)

26 modified files, 2 new files. Last commit: `a0f9e8d PRD MD File`. The uncommitted work appears to be the POC-orientation pass (Supabase planning, configuration tweaks, web polish). These files were included in the audit per user choice.

```
 M .gitignore
 M README.md
 M apps/api/.env.example
 M apps/api/package.json
 M apps/api/src/app.module.ts
 M apps/api/src/config/configuration.ts
 M apps/api/src/database/entities/partner-config.entity.ts
 M apps/api/src/database/entities/protection-score.entity.ts
 M apps/api/src/database/entities/recommendation-audit.entity.ts
 M apps/api/src/database/entities/streak-record.entity.ts
 M apps/api/src/modules/connect/connect.service.ts
 M apps/api/src/modules/content/content.service.ts
 M apps/api/src/modules/discovery/discovery.controller.ts
 M apps/api/src/modules/engagement/quiz.service.ts
 M apps/api/src/modules/trust/trust.module.ts
 M apps/web/src/modules/auth/ConsentToggle.tsx
 M apps/web/src/modules/diagnostic/inputs/MultiOptionCards.tsx
 M apps/web/src/modules/discovery/DiscoveryFlow.tsx
 M apps/web/src/modules/discovery/DiscoveryPage.tsx
 M apps/web/src/modules/engagement/MilestoneCard.tsx
 M apps/web/src/modules/engagement/StreakCard.tsx
 M apps/web/src/modules/quiz/QuizPage.tsx
 M apps/web/src/modules/score/ScoreDial.tsx
 M apps/web/src/modules/vault/VaultPage.tsx
 M package.json
 M packages/shared-types/package.json
 M pnpm-lock.yaml
?? apps/api/src/database/entities/column-types.ts
?? packages/shared-types/tsconfig.json
```

## Boot verification

**API**: booted via `DATABASE_DRIVER=sqljs pnpm --filter @kin/api dev` on port 3001.
- All 11 modules loaded
- All routes mapped (visible in NestJS RouterExplorer logs)
- Swagger UI live at http://localhost:3001/api/docs (HTTP 200, 3126 bytes)
- `POST /api/v1/auth/session` returned a valid JWT in 26ms

**Web**: booted via `pnpm --filter web dev` on port 5173.
- Vite ready in 444ms
- Index responds HTTP 200 with 1033 bytes

Both services come up cleanly with no missing dependencies or migration errors. **The defects surface only when functional endpoints are called.**
