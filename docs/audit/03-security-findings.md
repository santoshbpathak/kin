# §03 Security Findings

Findings are grouped: Zero-PII boundary, DPDP Act 2023, IRDAI suitability audit, OWASP, secrets.

Severity: 🔴 P0 / 🟠 P1 / 🟡 P2 / 🟢 OK

---

## Zero PII at partner layer (the single most critical PRD requirement)

| Control | Status | Evidence |
|---------|--------|----------|
| Partner sessionToken is a UUID, no decodable identity | 🟢 | [partner.service.ts:33](../../apps/api/src/modules/partner/partner.service.ts#L33) `uuidv4()` |
| Core layer uses session_token only until Step 9 | 🟢 | `consentedPii: false` default in JWT payload, no PII fields in token |
| Partner API endpoints PII-free | 🟢 | `POST /partner/session` returns only `{sessionToken, partnerId}`. `GET /partner/brand/:key` returns brand colors. No PII surfaces. |
| `consented_pii` flag enforced across codebase | 🟡 | Flag exists and is read in JWT, but **never checked as gate for accessing PII-dependent endpoints**. Anyone with a JWT can call `/diagnostic/complete`, `/vault/*` etc. regardless of consent state. |
| No accidental PII in logs (name, phone, email, Aadhaar) | 🔴 | **2 violations found:**<br>1. [auth.service.ts:48](../../apps/api/src/modules/auth/auth.service.ts#L48): `console.log('[DEV] OTP for ${mobile}: ${otp}')` — leaks mobile + OTP plaintext<br>2. [lifecycle.controller.ts:99](../../apps/api/src/modules/lifecycle/lifecycle.controller.ts#L99): `logger.log('[WhatsApp inbound] From: ${phone}, Command: ${command}')` — leaks inbound WhatsApp phone numbers |
| No PII in URL parameters / query strings | 🟢 | All PII routed via request body. Verified via route inspection. |

🔴 **P0 Findings:**
- **OTP and mobile number in stdout** (auth.service.ts:48) — runs in all environments including production unless guarded by `NODE_ENV`. Currently unconditional. With Vercel functions, this writes to Vercel logs.
- **WhatsApp inbound phone numbers in logger** (lifecycle.controller.ts:99) — same issue, ends up in Sentry breadcrumbs (when Sentry is wired) and Vercel logs.

---

## DPDP Act 2023 compliance

| Control | Status | Evidence |
|---------|--------|----------|
| Granular consent toggles (not blanket accept) | 🟢 frontend | [ConsentScreen.tsx:99-122](../../apps/web/src/modules/auth/ConsentScreen.tsx#L99-L122) renders 3 toggles (diagnosticData, locationData, contactData). `diagnosticData` is `required` (toggle disabled). |
| Right to deletion (deletion API) | 🔴 | **No deletion endpoint exists.** `grep -rn "delete.*user\|user.*delete" apps/api/src/modules/auth/` returns nothing. PRD/DPDP requires Art. 12 right to erasure. |
| All data stored in ap-south-1 | ⚠️ | Per CLAUDE.md POC stack: Supabase region must be Singapore or Mumbai (ap-south-1 equivalent). **Not provisioned yet.** Frontend's [ConsentScreen.tsx:128](../../apps/web/src/modules/auth/ConsentScreen.tsx#L128) **falsely claims** "KIN stores all data in India (AWS ap-south-1)" — misleading user disclosure given POC is Supabase, not AWS. |
| Consent type and timestamp stored per data type | 🔴 | [consent.service.ts:29](../../apps/api/src/modules/trust/consent.service.ts#L29) stores `consentLog` in an in-memory array. Lost on restart. No DB table for consent_log. |
| Consent revocation flow | 🟡 | `POST /trust/consent/revoke` exists but has same auth-guard bug — controller never resolves `user.sub`, will 500 |
| `aadhaar_last4` (last 4 digits only) | 🟢 | [nominee.service.ts:33-35](../../apps/api/src/modules/vault/nominee.service.ts#L33-L35) validates with regex `^\d{4}$`, drops if invalid |

🔴 **P0**: no deletion API, consent log non-persistent, frontend states wrong infrastructure region.

---

## IRDAI suitability audit

| Control | Status | Evidence |
|---------|--------|----------|
| Every recommendation generates an audit record with `basisText`, `inputsSnapshot`, `irdaiRuleReference`, `createdAt` | 🔴 | Backend `recommendation.service.ts#logAudit` is correct, but **never invoked** because (a) the frontend doesn't call `/trust/recommendations`, and (b) even if it did, the controller crashes (no auth guard). **Audit table is empty in practice.** |
| `rule_version` stored on every protection_score record | 🟢 (code), 🔴 (runtime) | `RULE_VERSION = 'v1.0.0'` is hardcoded and would be written, but score endpoint crashes |
| Audit records immutable (no UPDATE/DELETE) | 🟢 (code), ⚠️ (runtime) | Two layers, **neither active**: TypeORM `@BeforeUpdate/@BeforeRemove` hooks fire only on `repo.save/remove` calls. DB-level trigger only installs if migration runs (`migrationsRun: false` in dev, never run). |
| "See the Math" text stored verbatim in `basis_text` | 🟢 (code), 🔴 (runtime) | `logAudit` writes `rec.basisText` verbatim. Same blocker — never invoked. |
| KIN positioned as advisory/lead-gen, not policy issuer | 🟢 | [connect.service.ts:135](../../apps/api/src/modules/connect/connect.service.ts#L135) injects disclaimer: "KIN is not the insurer. {partner} (IRDAI Reg No. {x}) underwrites this policy..." |
| Purchase routes to licensed insurer partner | 🟢 | `connect.service.ts` PRODUCT_PARTNERS has real insurer names + IRDAI reg nos (HDFC Life, Star Health, Bajaj Allianz) |
| No premium prices displayed before advisor handoff | 🟢 verified - no premium amounts in recommendation cards |

🔴 **P0**: Audit trail entirely absent in practice. This is the single most critical IRDAI compliance failure.

---

## OWASP Top 10 scan

| Category | Status | Notes |
|----------|--------|-------|
| A01 Broken Access Control | 🔴 | **JwtAuthGuard not registered globally**. 4 controllers (auth.controller for vault-token+consent, score.controller, trust.controller, diagnostic.controller) use `@CurrentUser()` without `@UseGuards(AuthGuard('jwt'))`. Result: `request.user === undefined` → `user.sub` crash → 500. Discovery controller is unguarded but happens to use `_user` (unused) so doesn't crash. Anyone could call `/discovery/evaluate` without authentication. |
| A02 Cryptographic Failures | 🟢 | JWT HS256 with separate secrets for standard/vault scope. No plaintext password storage (no password auth at all — OAuth/OTP only). Default fallback secrets `'dev-secret'` are visible in code ([jwt.strategy.ts:17](../../apps/api/src/modules/auth/strategies/jwt.strategy.ts#L17)) — must verify production env sets `JWT_SECRET`. |
| A03 Injection | 🟢 | TypeORM ORM throughout, no raw SQL with string interpolation found. Only `queryRunner.query` calls are in the migration (safe — static SQL). class-validator pipes on every DTO. |
| A04 Insecure Design | 🟠 | Frontend bypasses backend for the core compliance flow (recommendation generation). Architectural choice that defeats the audit trail. |
| A05 Security Misconfiguration | 🟠 | (1) Dev-mode `synchronize: true` enabled also for SQL.js dev; safe but means migrations diverge silently. (2) `nodeEnv === 'development' ? true : allowedOrigins` for CORS — wildcard in dev (intentional). (3) Swagger exposed in non-prod. (4) **No Helmet** despite docstring mentioning it (`grep -n helmet apps/api/src` → no matches). |
| A06 Vulnerable Components | 🟡 | NestJS 10, TypeORM 0.3.19, passport-jwt 4.0.1 — all current. `pg` 8.11.3. Not audited deeply; recommend `pnpm audit` before launch. |
| A07 Identification & Auth Failures | 🔴 | OTP store in-memory ([auth.service.ts:25](../../apps/api/src/modules/auth/auth.service.ts#L25)) — lost on restart, race conditions on Vercel serverless (each cold start = fresh OTP map). OTPs use `Math.random` (not crypto-secure). |
| A08 Software/Data Integrity Failures | 🟢 | No deserialization vectors found. JWT signature verified via passport-jwt. |
| A09 Logging & Monitoring Failures | 🔴 | (1) Sentry env var defined but **not wired in main.ts** (`grep -n "@sentry\|Sentry" apps/api/src/main.ts` → no matches). (2) PII in stdout logs (see Zero-PII section). (3) `HttpExceptionFilter` doesn't log unhandled exceptions — they're caught and sent as JSON to the client, but never logged server-side. |
| A10 SSRF | 🟢 | No outbound HTTP calls based on user-provided URLs found |

🔴 **P0**: A01, A07, A09 all have material defects.

---

## Hardcoded secrets scan

Searched committed source for: `sk_live`, `AKIA[0-9A-Z]{16}`, `SUPABASE_SERVICE_ROLE_KEY=`, `JWT_SECRET=` (with value), `password = "..."`, etc. **Zero matches in committed code.** All values in `.env.example` are obvious placeholders ("change-me-in-production", "your-access-key", etc.).

**Caveat**: dev fallback secrets in code (`'dev-secret'`, `'dev-vault-secret'`) at [configuration.ts:24-26](../../apps/api/src/config/configuration.ts#L24-L26) and [jwt.strategy.ts:17](../../apps/api/src/modules/auth/strategies/jwt.strategy.ts#L17). These fire silently if env vars are unset. Recommend adding a `throw` at startup if `JWT_SECRET` is unset in production.

🟢 No leaked secrets.

---

## Rate limit broken under burst

Dynamic test result (verified twice):

```
110 requests issued to POST /v1/auth/session via curl loop
Configured limit: 100 / 60s
Result: 110 of 110 returned HTTP 201 (zero 429s)
Elapsed time: 1 second
Final rate-limit header showed: X-RateLimit-Remaining: 92  (negative tracking)
```

`X-RateLimit-Reset: 0` on every response is suspicious. `ThrottlerGuard` is registered as `APP_GUARD` and `ThrottlerModule.forRootAsync` reads `RATE_LIMIT_TTL=60, RATE_LIMIT_MAX=100`. Likely cause: NestJS Throttler v5 default storage is in-process Map without locks; under high concurrency the counter check happens before increment so many requests pass simultaneously.

🟠 **P1**: Throttler is effectively bypassed under burst load.

---

## CSRF

JWT bearer auth, no cookies → CSRF not applicable. 🟢

---

## XSS

React 18 auto-escapes by default. No `dangerouslySetInnerHTML` found. 🟢

---

## IDOR (Insecure Direct Object References)

- Vault document access: 🟢 `vault.service.ts` checks `doc.userId !== userId → ForbiddenException` on update/delete
- Nominee access: 🟢 same pattern
- Unlock trigger by `unlockToken`: 🟡 [unlock.service.ts:49-54](../../apps/api/src/modules/vault/unlock.service.ts#L49-L54) - `nominee-view/:unlockToken` returns generic message but doesn't actually expose vault data, so low risk. However it leaks token existence (returns different message for valid token even if not yet active).

---

## Sentry / observability

🔴 **P0** for POC: `@sentry/node`, `@sentry/nextjs`, or similar **not installed** (`grep -E "@sentry" apps/api/package.json` → no matches). `SENTRY_DSN` env var declared but never read. No error reporter wrapper around `bootstrap()`. A production crash goes to Vercel function logs only.

---

## Summary of P0 security findings

1. 🔴 **Broken access control on Score/Trust/Diagnostic/Auth(vault-token, consent) controllers** — no JWT guard
2. 🔴 **OTP plus mobile number in console.log** — PII leak to logs
3. 🔴 **No data deletion API** — DPDP Art. 12 violation
4. 🔴 **Consent log in-memory only** — not persisted
5. 🔴 **`recommendation_audit` rows never written in practice** — IRDAI suitability failure
6. 🔴 **In-memory OTP store + non-crypto random** — broken auth on Vercel serverless
7. 🔴 **Sentry not wired** — zero production observability
8. 🔴 **Frontend states wrong infrastructure region in consent screen** — misleading user disclosure
