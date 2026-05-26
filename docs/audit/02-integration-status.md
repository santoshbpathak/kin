# §02 Integration Status

For each integration, current state vs PRD/POC requirement. Severity legend: ✅ live and tested · ⚠️ configured but untested or partial · ❌ not configured · POC-OK = acceptable per POC scope.

---

## Authentication

| Item | Status | Evidence / notes |
|------|--------|-------------------|
| WhatsApp SSO end-to-end | ❌ broken | `POST /auth/whatsapp/otp` works with field `mobile` but frontend [AuthContext.tsx:96](../../apps/web/src/modules/auth/AuthContext.tsx#L96) sends `{phone}`. Backend rejects with 400 "property phone should not exist". |
| WhatsApp OTP delivery | ❌ sandbox | `[DEV] OTP for ${mobile}: ${otp}` is logged to console only ([auth.service.ts:48](../../apps/api/src/modules/auth/auth.service.ts#L48)). No real WhatsApp Cloud API call. Same code path as message templates. |
| Google SSO end-to-end | ❌ missing | Frontend redirects to `/api/v1/auth/google` ([AuthContext.tsx:161](../../apps/web/src/modules/auth/AuthContext.tsx#L161)) but **no such endpoint exists in backend**. Will 404. No Google OAuth client config in env. |
| Employer SSO bridge | POC-OK | Per CLAUDE.md POC scope: Google-only acceptable. But Google itself is missing too. |
| JWT generation | ✅ | Verified - `POST /auth/session` returns valid HS256 JWT with `{sub, sessionToken, consentedPii, scope, iat, exp}` |
| JWT validation | ✅ where guards applied | `JwtStrategy` extends `PassportStrategy(Strategy, 'jwt')`. Used by Engagement/Content/Connect/Lifecycle controllers via `@UseGuards(AuthGuard('jwt'))`. **Missing on Score/Trust/Diagnostic/Auth(vault-token, consent).** |
| JWT expiry | ✅ 7d | `JWT_EXPIRY=7d` from env. Auth strategy `ignoreExpiration: false` |
| JWT refresh logic | ❌ | No refresh endpoint, no refresh token strategy. After 7d, users must re-auth manually. |
| Elevated JWT scope for Vault | ✅ implemented, but unreachable | `VaultJwtStrategy` checks `payload.scope === 'vault'` ([vault-jwt.strategy.ts:18](../../apps/api/src/modules/auth/strategies/vault-jwt.strategy.ts#L18)). `VaultGuard` enforces it. **But `POST /auth/vault-token` itself returns 500 because the controller lacks `@UseGuards`.** |
| Zero cookies / JWT-only auth | ✅ | No `cookie-parser` import, no `res.cookie` calls. JWT only via `Authorization: Bearer`. |

🔴 P0: WhatsApp OTP field-name mismatch breaks the primary auth path. Google OAuth endpoint missing.

---

## WhatsApp Business API

| Item | Status |
|------|--------|
| API credentials configured | ⚠️ env vars defined (`WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`) but the service detects empty token and runs in `sandboxMode = true` ([whatsapp.service.ts:27](../../apps/api/src/modules/lifecycle/whatsapp.service.ts#L27)) |
| Weekly nudge template defined | ✅ `kin_weekly_brief` |
| Streak milestone template | ✅ `kin_streak_milestone` |
| Rescore reminder template | ✅ `kin_rescore_reminder` |
| Deadman switch template | ✅ `kin_deadman_ping` |
| Vault unlock nominee alert template | ✅ `kin_nominee_trigger_alert` |
| Templates Meta-approved? | ❌ unknown — no record/screenshot of Meta approval status in repo |
| Real Cloud API call code | ❌ commented out ([whatsapp.service.ts:42-53](../../apps/api/src/modules/lifecycle/whatsapp.service.ts#L42-L53)). Phase-2 work. |
| SMS Gateway fallback | ❌ no `SMS_FALLBACK_*` env vars, no SMS service file |
| Webhook (inbound STOP/SCORE/HELP/START) | ✅ wired - `POST /v1/lifecycle/whatsapp/webhook` parses and logs commands |
| 1 push/week limit enforced | ⚠️ no rate limit on outbound message sends (the in-memory `prefsStore` tracks `checkInFrequency` preference but nothing checks `lastSentAt` before sending) |

🔴 P0: WhatsApp send path is non-functional. No SMS fallback. Cannot fulfill PRD "weekly Monday delivery via WhatsApp" requirement.

---

## File storage (AWS S3 → POC needs Supabase Storage)

| Item | Status |
|------|--------|
| Bucket in ap-south-1 | env config says `AWS_REGION=ap-south-1`, `AWS_S3_BUCKET=kin-vault-documents` but **no AWS SDK imported**, no real bucket interaction |
| AES-256 server-side encryption | ❌ not configured in code |
| Presigned URL generation | ❌ stub: returns `https://kin-vault-documents.s3.ap-south-1.amazonaws.com/{s3Key}?presigned=stub` ([vault.service.ts:71](../../apps/api/src/modules/vault/vault.service.ts#L71)) - not a real signed URL |
| Block all public access | n/a (no real bucket) |
| Access logging | ❌ Phase-2 comment |
| No bulk download API | ✅ verified by route inspection |
| `s3_key` never returned in API | ✅ confirmed in DTOs and service return types |
| **POC: Supabase Storage replacement** | ❌ no `@supabase/storage-js`, no Supabase client anywhere |

🔴 P0 for POC: no functional file storage. Vault uploads are non-functional even after the auth fix.

---

## AWS infrastructure (POC-deferred per CLAUDE.md, replaced by Vercel)

| Item | Status |
|------|--------|
| EC2/ECS in ap-south-1 | ⚠️ POC-OK (Vercel instead) |
| CloudWatch monitoring + alerts | ⚠️ POC-OK (Sentry instead). **But Sentry is not actually wired** - see below. |
| Sentry integration | ❌ env `SENTRY_DSN` defined but `grep -rn "@sentry" apps/` returns zero matches. **Not initialized in `main.ts`.** | 

🔴 P0 for POC: no production observability at all. A crash in production goes nowhere.

---

## PostgreSQL / Supabase database

| Item | Status |
|------|--------|
| All 5 PRD schemas implemented | ✅ 8 entities present (5 required + Nominee, UnlockTrigger, PartnerConfig) |
| UUID primary keys on all tables | ✅ all entities use `@PrimaryGeneratedColumn('uuid')` |
| Row-level security (RLS) | ❌ noted in migration comment as "Phase 2 multi-tenant setup". **POC blocker for Supabase**: without RLS, any user with a Supabase anon key can read all tables. |
| AES-256 encryption at rest | n/a — relies on Supabase managed encryption (verify in Supabase console) |
| `recommendation_audit` IMMUTABLE | Two layers: **(1)** TypeORM `@BeforeUpdate/@BeforeRemove` hooks in [recommendation-audit.entity.ts:54-62](../../apps/api/src/database/entities/recommendation-audit.entity.ts#L54-L62) — fire only on `repo.save()` / `repo.remove()`, not on raw SQL. **(2)** PostgreSQL trigger `fn_recommendation_audit_immutable` in migration — only installed if migration is run (it's not: `migrationsRun: false`). **Net result: in dev with synchronize=true, only TypeORM hooks are active.** |
| 5-year retention | ❌ not enforced. No archival policy, no Supabase Storage lifecycle config |
| Migrations versioned | ✅ 1 migration file, timestamp-named |
| Indexes on FK columns | ✅ all FK columns indexed in migration |
| **Entity table names match migration table names** | ❌ **mismatch** - all 8 tables: entity is plural, migration is singular. See [00-codebase-snapshot.md](00-codebase-snapshot.md#database-entities-9-entities). |
| **Supabase client integration** | ❌ no `@supabase/supabase-js` dependency, no Supabase client code anywhere |

🔴 P0 for POC: no Supabase RLS, no Supabase client, table-name divergence will break first prod migration run.

---

## API design

| Item | Status |
|------|--------|
| URI versioning `/api/v1/*` | ✅ `app.enableVersioning({type: VersioningType.URI, defaultVersion: '1'})` |
| Rate limit 100/min per session at gateway | ⚠️ **Configured but ineffective.** Dynamic test: 110 requests in 1 second all returned 201 (zero 429). See [03-security-findings.md](03-security-findings.md#rate-limit-broken-under-burst). |
| Response includes `request_id` for tracing | ✅ `RequestIdInterceptor` injects `X-Request-ID` header + JSON body field; HttpExceptionFilter copies it into error responses |
| Vault API on separate elevated JWT scope | ✅ |
| Webhook for partner apps (anonymised cohorts only) | ❌ no webhook outbound implementation found |
| No PII in URL parameters | ✅ confirmed via route inspection - all PII goes in body |
| CORS configured for partner embed | ✅ `enableCors({origin: allowedOrigins})` reads `PARTNER_EMBED_ALLOWED_ORIGINS`. Verified preflight returns correct headers. |
| Dev mode CORS = wildcard | ⚠️ `nodeEnv === 'development' ? true : allowedOrigins` ([main.ts:39](../../apps/api/src/main.ts#L39)) — fine in dev, ensure `NODE_ENV=production` set on Vercel |

🟠 P1: Rate limiter doesn't actually throttle under burst. Critical for DDoS protection.

---

## CI/CD pipeline

| Item | Status |
|------|--------|
| GitHub Actions present | ❌ no `.github/workflows/` directory |
| Automated tests on PR | ❌ no test files exist at all (`*.spec.ts` count = 0) |
| Lint on PR | ❌ no workflow |
| Staging environment gate | ❌ no deployment automation |
| Build → Staging → Prod gates | ❌ no pipeline |
| Vercel preview deploys | ❌ no `vercel.json`, no integration |

🟠 P1: Manual deploy only. No quality gates.

---

## Frontend → Backend connection

Total fetch calls from `apps/web/src/` to `/api/v1/*`:

| Endpoint | Frontend caller | Works? |
|----------|-----------------|--------|
| `POST /api/v1/auth/session` | [AuthContext.tsx:60](../../apps/web/src/modules/auth/AuthContext.tsx#L60) | ✅ |
| `POST /api/v1/auth/whatsapp/otp` | [AuthContext.tsx:93](../../apps/web/src/modules/auth/AuthContext.tsx#L93) | 🔴 **400 — field name mismatch (`phone` vs backend's `mobile`)** |
| `POST /api/v1/auth/whatsapp/verify` | [AuthContext.tsx:117](../../apps/web/src/modules/auth/AuthContext.tsx#L117) | 🔴 same mismatch pattern likely |
| `GET /api/v1/auth/google` | [AuthContext.tsx:161](../../apps/web/src/modules/auth/AuthContext.tsx#L161) | 🔴 **endpoint doesn't exist (404)** |
| `GET /api/v1/partner/brand/:partnerId` | [BrandProvider.tsx:34](../../apps/web/src/theme/BrandProvider.tsx#L34) | ✅ |

**Not called from frontend (but backend exists for):**
- `/diagnostic/*` (frontend has its own NLP parser)
- `/score/*` (frontend has `scoreEngine.ts`)
- `/trust/*` (frontend has `recommendationEngine.ts`)
- `/discovery/*` (frontend has `discoveryEngine.ts`)
- `/vault/*` (frontend has `vaultStore.ts` → localStorage)
- `/engagement/*` (frontend has `streakStore`, `quizData.ts`)
- `/content/*` (frontend has `briefData.ts`)
- `/connect/*` (frontend has `connectStore.ts`)
- `/lifecycle/*` (frontend has `lifecycleStore.ts`)

🔴 P0 (Compliance): Because the frontend never POSTs to `/trust/recommendations`, the IRDAI `recommendation_audit` table is never written. The PRD's "every recommendation has a logged audit record" guarantee is unmet.
