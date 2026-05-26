# §06 Critical Blockers (Go-Live Gates)

Every issue below is P0 — must be resolved before any pilot user is admitted. PRD-mapped where relevant. Effort estimate uses calibration: trivial = <2h; small = half day; medium = 1-2 days; large = ≥3 days.

Sorted by criticality.

---

## B1. 🔴 `JwtAuthGuard` not registered globally → 4 controllers crash on every call

**Where:** [apps/api/src/app.module.ts:134-137](../../apps/api/src/app.module.ts#L134-L137) — only `ThrottlerGuard` registered as `APP_GUARD`.

**Symptoms (verified dynamically):**
- `POST /v1/score/calculate` returns 500 — load test #4: 200/200 errors
- `POST /v1/diagnostic/complete` returns 500
- `POST /v1/trust/recommendations` returns 500 (after DTO fix)
- `POST /v1/auth/vault-token` returns 500 → **cascade: entire vault subsystem unreachable**
- `POST /v1/auth/consent` returns 500
- `POST /v1/trust/consent/grant|revoke` returns 500

**Root cause:** these controllers use `@CurrentUser() user: JwtPayload` then `user.sub`. Without a guard, `request.user` is undefined.

**Fix:** add `{provide: APP_GUARD, useClass: JwtAuthGuard}` to `app.module.ts` providers. JwtAuthGuard already respects the `@Public()` decorator so endpoints like `/auth/session` keep working.

**Effort:** trivial (one-line + verify @Public on all public endpoints).

**PRD impact:** breaks F1 Step 4, F1 Step 5, F1 Step 6, F4 entirely.

---

## B2. 🔴 Frontend never calls backend for score/recommendations/vault → `recommendation_audit` table is empty

**Where:** `apps/web/src/modules/score/scoreEngine.ts`, `apps/web/src/modules/trust/recommendationEngine.ts`, `apps/web/src/modules/vault/vaultStore.ts`.

**Symptoms:** all calculations and persistence happen in browser sessionStorage/localStorage. The IRDAI suitability audit table receives zero rows in normal pilot operation.

**Root cause:** parallel client-side implementations were built (probably for offline-first or demo speed), backend is never invoked.

**Fix:** wire frontend `useEffect` and submission handlers to POST to `/v1/diagnostic/complete`, `/v1/score/calculate`, `/v1/trust/recommendations`, `/v1/vault/document` etc. Replace `vaultStore.ts`, `streakStore`, etc. with API clients. Use the JWT from `AuthContext` for `Authorization: Bearer`.

**Effort:** medium - touches ~10 frontend modules. ~2 days.

**PRD impact:** IRDAI compliance requirement "every recommendation has a logged audit record" is unmet without this. Single most critical regulatory failure.

---

## B3. 🔴 WhatsApp OTP field-name mismatch → primary auth path broken

**Where:**
- Frontend [AuthContext.tsx:96](../../apps/web/src/modules/auth/AuthContext.tsx#L96) sends `body: JSON.stringify({phone})`
- Backend DTO [auth.controller.ts:9](../../apps/api/src/modules/auth/auth.controller.ts#L9) requires `{mobile}`
- `ValidationPipe` configured with `forbidNonWhitelisted: true` → backend returns 400 "property phone should not exist"

**Same pattern in:** `verifyWhatsAppOtp` — also sends `{phone, otp}`, backend wants `{mobile, otp, sessionToken}`. SessionToken not sent either.

**Fix:** standardise field name. Recommend changing backend to `phone` (more conventional) or update frontend to `mobile`. Make consistent across `sendOtp` and `verifyOtp`. Add `sessionToken` to verify payload from frontend.

**Effort:** trivial (~30min including type updates).

**PRD impact:** F1 Step 2 (Consent + SSO) — WhatsApp is the primary auth method; it is currently non-functional.

---

## B4. 🔴 Google OAuth endpoint does not exist

**Where:**
- Frontend [AuthContext.tsx:161](../../apps/web/src/modules/auth/AuthContext.tsx#L161) redirects to `/api/v1/auth/google`
- Backend has no Google strategy, no Google controller endpoint
- No `GOOGLE_OAUTH_CLIENT_ID` in env config

**Fix:** either (a) build Google OAuth (use `passport-google-oauth20`, add `/auth/google` and `/auth/google/callback` endpoints, configure Supabase Auth alternatively); or (b) remove the Google button from frontend until ready.

**Effort:** small if using Supabase Auth's built-in Google provider; medium if rolling own.

**PRD impact:** F1 Step 2 — one of three SSO options non-functional.

---

## B5. 🔴 "See the Math" backend endpoint returns stub message

**Where:** [trust.controller.ts:39-42](../../apps/api/src/modules/trust/trust.controller.ts#L39-L42)
```ts
return { recId, message: 'Recommendation audit records available via database query in Phase 2' }
```

**PRD requirement (CG-8):** "See the Math" mandatory on every recommendation. Must return the basis text used for that audit row.

**Fix:** query `recommendation_audit` by `auditId` (the `recId` should be the auditId), return `basisText`, `irdaiRuleReference`, `inputsSnapshot`, `createdAt`.

**Effort:** trivial (~30min).

**PRD impact:** CG-8 violation if frontend ever uses backend for See the Math.

---

## B6. 🔴 Database table-name divergence between entity and migration

**Where:** every entity vs every migration table.

| Entity table | Migration table |
|--------------|-------------------|
| `recommendation_audits` | `recommendation_audit` |
| `vault_documents` | `vault_document` |
| `user_profiles` | `user_profile` |
| `protection_scores` | `protection_score` |
| `nominees` | `nominee` |
| `streak_records` | `streak_record` |
| `partner_configs` | `partner_config` |
| `unlock_triggers` | `unlock_trigger` |

**Symptom (latent):** In dev (SQL.js with `synchronize: true`), TypeORM creates plural tables matching the entities. The migration's PostgreSQL `recommendation_audit` immutability trigger never installs. In production Supabase, if you run the migration before TypeORM start, entities can't find their tables (queries fail). If you let synchronize create plural tables in prod, the immutability trigger is silently missing — IRDAI compliance failure.

**Fix:** decide on one naming convention (recommend plural to match TypeORM defaults) and update either the migration or the entity decorators to match. Re-add the immutability trigger to point at the chosen name. Set `synchronize: false` in production. Make `migrationsRun: true`.

**Effort:** small (1-2h including testing schema applies cleanly on a fresh Supabase project).

**PRD impact:** IRDAI immutability requirement; production deploy will fail without this.

---

## B7. 🔴 OTP and mobile number logged in plaintext

**Where:** [auth.service.ts:48](../../apps/api/src/modules/auth/auth.service.ts#L48)
```ts
console.log(`[DEV] OTP for ${mobile}: ${otp}`)
```
**Also:** [lifecycle.controller.ts:99](../../apps/api/src/modules/lifecycle/lifecycle.controller.ts#L99) logs inbound WhatsApp phone numbers.

**Risk:** Vercel function logs contain PII. Sentry (when wired) will capture as breadcrumbs.

**Fix:** remove both logs entirely, or guard behind `if (process.env.NODE_ENV !== 'production')`. Even better, hash the mobile if you must log for debugging.

**Effort:** trivial (~10min).

**PRD impact:** DPDP Art. 8/9 violation; Zero-PII boundary breach.

---

## B8. 🔴 Sentry not wired (zero production observability)

**Where:** `SENTRY_DSN` declared in [.env.example:45](../../apps/api/.env.example#L45) but no `@sentry/*` dependency in `apps/api/package.json` and no `Sentry.init()` call in `main.ts`.

**Per CLAUDE.md POC scope:** Sentry replaces CloudWatch for POC, so it MUST be wired.

**Fix:** `pnpm --filter @kin/api add @sentry/node @sentry/profiling-node`; call `Sentry.init({ dsn, environment, tracesSampleRate: 0.1 })` at top of `main.ts`. Wrap NestJS bootstrap. Add Sentry error filter to chain alongside `HttpExceptionFilter`.

**Effort:** small (1h).

**PRD impact:** Per POC scope this is the only observability — currently zero.

---

## B9. 🔴 In-memory state across 6+ services → broken on Vercel cold start

**Where:**
- [auth.service.ts:25](../../apps/api/src/modules/auth/auth.service.ts#L25) `otpStore = new Map()`
- [consent.service.ts:29](../../apps/api/src/modules/trust/consent.service.ts#L29) `consentLog = []`
- [notification-prefs.service.ts:24](../../apps/api/src/modules/lifecycle/notification-prefs.service.ts#L24) `prefsStore = new Map()`
- [connect.service.ts:40,52](../../apps/api/src/modules/connect/connect.service.ts#L40) `ADVISOR_SLOTS = [...]` mutable, `bookingStore = new Map()`
- [quiz.service.ts:24-25](../../apps/api/src/modules/engagement/quiz.service.ts#L24-L25) `kinIqStore`, `attemptStore`
- [content.service.ts:30](../../apps/api/src/modules/content/content.service.ts#L30) `NEWS_BRIEF_STORE` (read-only OK if seeded but uses const)

**Symptom on Vercel:** each cold-start function instance gets fresh empty Maps. OTPs issued from one instance can't be verified from another. Advisor slot bookings reset. Streak progress is per-instance.

**Fix:** move every Map to a Postgres table OR use Vercel KV / Upstash Redis. Most critical: OTP (auth flow), advisor slots, bookings, kinIq scores, consent log.

**Effort:** medium (~2 days to migrate all).

**PRD impact:** F1 Step 2 (auth), F1 Step 8 (connect), F1 Step 10 (lifecycle), F5 (engagement), DPDP consent record requirement.

---

## B10. 🔴 No Supabase client wiring

**Where:** anywhere. `grep -rn "@supabase\|supabase-js\|createClient" apps/ packages/` → zero matches.

**Per CLAUDE.md POC stack:** Supabase Postgres + Supabase Storage + Supabase Auth (Google OAuth + phone/OTP). None are wired.

**Fix:**
- DB: change `DATABASE_URL` to Supabase pooler URL, set `DATABASE_SSL=true`. Test connection.
- Storage: install `@supabase/storage-js`, replace vault stub.
- Auth: replace OTP store with Supabase Auth phone OTP flow; replace Google OAuth stub with Supabase Auth Google provider.

**Effort:** medium (~2-3 days for all three).

**PRD impact:** POC stack unmet.

---

## B11. 🔴 No `vercel.json` for NestJS serverless deployment

**Where:** absent at repo root and at `apps/api/`.

**Fix:** create `apps/api/vercel.json` with `builds` for NestJS, `routes` for `/api/*`. NestJS serverless requires a `dist/serverless.js` wrapper that exports a Vercel handler. Update `apps/api/package.json` build script.

**Effort:** medium (~1 day including first successful deploy + DNS).

**PRD impact:** POC stack unmet — cannot deploy to Vercel without this.

---

## B12. 🔴 No data deletion endpoint (DPDP Art. 12)

**Where:** absent — `grep -rn "deleteUser\|DELETE.*user" apps/api/src/modules/auth/` → no matches.

**Per DPDP Act 2023:** user has the right to erasure, must be programmatic.

**Fix:** add `DELETE /v1/auth/me` that deletes the user_profile and cascades to all child tables (CASCADE FKs already in place per migration). Mind: `recommendation_audit` is intentionally immutable for IRDAI — handle the conflict (either retain audit rows with PII-stripped snapshot or document the legal basis for retention).

**Effort:** small (~3h with the IRDAI-vs-DPDP edge case handled in code).

**PRD impact:** DPDP compliance.

---

## B13. 🔴 KIN IQ question bank at 10% of PRD volume (5 questions vs 50 required)

**Where:** [quiz.service.ts:27-93](../../apps/api/src/modules/engagement/quiz.service.ts#L27-L93) - only 5 questions defined.

**Fix:** content task, not engineering. Source 45 more scenario-based questions covering: IRDAI, EPFO, ESI, PMSBY, PMJJBY, employer mediclaim claims, term life claim conditions, motor PA, MRTA, fraud detection, nominee rules, free-look periods, claim settlement ratios, exclusions.

**Effort:** medium (content writing ~3 days).

**PRD impact:** F6 — users would see same 3 questions repeatedly.

---

## B14. 🔴 KIN News Brief at 25% of PRD volume (1 brief vs 4 required) + no scheduler

**Where:** [content.service.ts:30-66](../../apps/api/src/modules/content/content.service.ts#L30-L66) - 1 brief; no cron in repo.

**Fix:** add 3 more briefs (content task). Add Vercel cron (or Supabase pg_cron) to fire weekly WhatsApp send job on Monday.

**Effort:** small for cron (~3h), medium for content (~1 day).

**PRD impact:** F7 — no weekly content cadence.

---

## B15. 🔴 Vault unlock triggers not actually executable

**Where:** [unlock.service.ts](../../apps/api/src/modules/vault/unlock.service.ts) - 4 trigger types accepted but no execution logic:
- `death_cert`: no document upload, no review queue, no approval workflow
- `deadman`: no cron checking `lastActiveAt > 18 months`
- `trusted_contact`: no registration of trusted contacts, no quorum verification
- `emergency`: `nominee-view` doesn't actually limit fields shown

**Fix:** medium-to-large per trigger.

**Effort:** large (~5 days) — full vault unlock implementation.

**PRD impact:** F4 unlock triggers all listed but none executable.

---

## Cross-reference: PRD acceptance criteria failures

| PRD criterion | Blocked by |
|---------------|-------------|
| "Every recommendation has a logged audit record" | B1, B2, B6 |
| "Zero PII stored or transmitted at partner layer until Step 9" | OK in code, but B7 leaks via logs |
| "DPDP Act 2023 compliant with granular toggles" | B12 (no deletion), B2 (consent not persisted) |
| "Score calculation is deterministic" | OK in code, B1 prevents calls |
| "See the Math button present on every recommendation" | B5 (backend stub if frontend ever switches) |
| "Quarterly check-in via WhatsApp" | B14 (no scheduler), and WhatsApp service is sandbox-only |
| "Vault on S3 ap-south-1 with AES-256 + presigned URLs" | B10 (no Supabase Storage), Vault service is stub |
| "Score calc <500ms P95" | OK in code, B1 prevents measurement |
| "1000 concurrent users <500ms P95" | Cannot test until B1 + B6 + B9 fixed |
| "Sentry error tracking integrated" | B8 |
| "GitHub Actions pipeline" | not a P0 for POC but in §07 list |
