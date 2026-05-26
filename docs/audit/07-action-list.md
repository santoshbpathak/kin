# §07 Prioritised Action List

Three buckets per the user's audit playbook:
1. **MUST-FIX before go-live (P0 blockers)** — derived from [§06](06-critical-blockers.md)
2. **SHOULD-FIX before go-live (quality)** — issues that don't strictly block but materially degrade pilot quality
3. **CAN-FIX post-pilot (deferred)** — explicit POC-acceptable per CLAUDE.md, or low-criticality

Each item has an effort estimate. Total estimated work to clear all P0s: **5-8 engineer-days**.

---

## 1. MUST-FIX before go-live

| # | Action | Effort | File(s) | Cross-ref |
|---|--------|--------|---------|-----------|
| 1.1 | Register JwtAuthGuard globally as APP_GUARD | trivial | [apps/api/src/app.module.ts:134-137](../../apps/api/src/app.module.ts#L134-L137) | B1 |
| 1.2 | Decide naming: rename either entity decorators or migration tables to a single convention (plural recommended). Update DB-level immutability trigger in migration to point at the chosen name. Set `synchronize: false` in production, `migrationsRun: true` | small | All 8 entities + InitialSchema migration | B6 |
| 1.3 | Fix WhatsApp OTP field-name mismatch (`phone` vs `mobile`) and add `sessionToken` to verify payload | trivial | [AuthContext.tsx:96,117](../../apps/web/src/modules/auth/AuthContext.tsx#L96) + [auth.controller.ts:9-15](../../apps/api/src/modules/auth/auth.controller.ts#L9) | B3 |
| 1.4 | Remove or guard plaintext OTP / mobile / phone logs | trivial | [auth.service.ts:48](../../apps/api/src/modules/auth/auth.service.ts#L48), [lifecycle.controller.ts:99](../../apps/api/src/modules/lifecycle/lifecycle.controller.ts#L99) | B7 |
| 1.5 | Implement "See the Math" backend endpoint — read RecommendationAudit by auditId, return basis text + IRDAI reference | trivial | [trust.controller.ts:39-42](../../apps/api/src/modules/trust/trust.controller.ts#L39-L42) | B5 |
| 1.6 | Wire Sentry (init in main.ts, install `@sentry/node`, add error filter) | small | [main.ts](../../apps/api/src/main.ts), [apps/api/package.json](../../apps/api/package.json) | B8 |
| 1.7 | Move in-memory stores to Supabase tables (OTP, consent log, prefs, advisor slots, bookings, kinIq, attempts). Or use Vercel KV / Upstash Redis. | medium | 6 services across modules | B9 |
| 1.8 | Wire Supabase: client config, RLS policies on all user-scoped tables, Supabase Storage replacement for vault stub | medium | new `apps/api/src/lib/supabase.ts`, vault.service.ts, env config | B10 |
| 1.9 | Create `apps/api/vercel.json` and NestJS serverless wrapper. Verify cold-start boots cleanly. | medium | new `apps/api/vercel.json`, `apps/api/src/serverless.ts` | B11 |
| 1.10 | Wire frontend → backend for diagnostic/score/trust/discovery/vault/engagement/content/connect/lifecycle. Replace local stores with API calls. **Critical for audit-trail.** | medium | ~10 frontend modules | B2 |
| 1.11 | Add `DELETE /v1/auth/me` endpoint for DPDP right-to-erasure. Cascade delete user_profile and child records. Document conflict with IRDAI 5-year audit retention. | small | new code in auth.controller + service | B12 |
| 1.12 | Build or stub Google OAuth (recommend Supabase Auth's built-in provider; remove button until ready if punting) | small-medium | auth.controller, [AuthContext.tsx](../../apps/web/src/modules/auth/AuthContext.tsx) | B4 |
| 1.13 | Implement vault unlock triggers (at minimum: emergency mode with limited fields, death_cert with manual queue. Deadman switch can be post-pilot.) | medium | [unlock.service.ts](../../apps/api/src/modules/vault/unlock.service.ts), new admin review endpoint | B15 (partial) |
| 1.14 | Content: write 45 more KIN IQ questions to reach 50 | medium (content, not code) | [quiz.service.ts:27](../../apps/api/src/modules/engagement/quiz.service.ts#L27) | B13 |
| 1.15 | Content: write 3 more KIN News Briefs; add Vercel cron to fire weekly | small (code) + medium (content) | [content.service.ts:30](../../apps/api/src/modules/content/content.service.ts#L30), new cron route | B14 |
| 1.16 | Correct misleading text on consent screen — replace "AWS ap-south-1" with accurate POC region statement | trivial | [ConsentScreen.tsx:128](../../apps/web/src/modules/auth/ConsentScreen.tsx#L128) | §03 DPDP |
| 1.17 | Verify production env vars are SET — add startup assertion that throws if `JWT_SECRET`, `VAULT_JWT_SECRET`, `SUPABASE_URL`, `SENTRY_DSN` are absent in production | trivial | [configuration.ts](../../apps/api/src/config/configuration.ts) | §03 OWASP A02 |

**Total P0 effort: ~5-8 engineer-days** (assuming one engineer, sequential). Parallelisable to 3-4 days with two engineers.

---

## 2. SHOULD-FIX before go-live (quality, not strict blockers)

| # | Action | Effort | Rationale |
|---|--------|--------|------------|
| 2.1 | Add Helmet middleware for security headers | trivial | OWASP A05 — docstring says it's used but no `helmet` import exists |
| 2.2 | Fix rate limiter — replace default in-memory throttler with Redis-backed throttler (or move to Vercel Edge config) for burst safety | small | §03 Rate limit broken under burst |
| 2.3 | Add 2 missing badges: "Well Protected" (score ≥ 80), "Family First" (nominee + vault configured). Gate Growing Protector on score >60 + grant 100 KIN points | small | F5 PRD criterion |
| 2.4 | Add LPG and PMJDY to discovery engine (2 missing PRD-required coverages) | small | F3 PRD criterion |
| 2.5 | Surface per-coverage helpline numbers in discovery results (Bima Bharosa 1800-4254-732 + insurer-specific) | small | F3 PRD criterion |
| 2.6 | Implement JWT refresh token flow (otherwise users force-logout after 7 days mid-pilot) | small | §02 Auth findings |
| 2.7 | Wire 5 PRD pilot metrics: install analytics SDK (PostHog or Umami self-hosted is privacy-friendly), instrument events for: check-in started/completed, score viewed, recommendation actioned, advisor booked, brief opened | medium | F5/GTM requirement |
| 2.8 | Implement compliance summary PDF generation (currently stubbed in [ComplianceSummary.tsx](../../apps/web/src/modules/trust/ComplianceSummary.tsx)) — server-side PDF generation via `@react-pdf/renderer` or similar | medium | F1 Step 7 PRD criterion |
| 2.9 | Add `protection_score` retention policy (PRD doesn't specify; suggest 2 years rolling, archive older) | small | DB growth |
| 2.10 | Set up GitHub Actions: lint + typecheck + (eventually) tests on PR | small | §02 CI/CD |
| 2.11 | Write at least integration tests for: auth flow, score calculation, recommendation generation, vault ownership enforcement, audit immutability | medium | §02 Tests — 0 spec files exist currently |
| 2.12 | Build a minimal partner embed SDK package (`packages/partner-embed`) + README. Even an iframe with branded host + sample seed `partner_config` row covers MVP | small | GTM §05 |
| 2.13 | Add structured logging (pino or @nestjs/common Logger with JSON output) so Sentry breadcrumbs are useful | small | observability |
| 2.14 | Verify Meta-approved WhatsApp templates exist (kin_weekly_brief, kin_streak_milestone, kin_rescore_reminder, kin_deadman_ping, kin_nominee_trigger_alert) and add records of approval to repo | trivial (admin) | F1 Step 10 |
| 2.15 | Hash phone numbers before storage if you must store them (`whatsappNumber` on UserProfile is plaintext today) | small | DPDP best practice |

**Total quality fixes: ~5-7 engineer-days.**

---

## 3. CAN-FIX post-pilot (deferred)

| # | Item | Reason for deferral |
|---|------|---------------------|
| 3.1 | CloudWatch alerting | POC-acceptable per CLAUDE.md (Sentry replaces) |
| 3.2 | External penetration test | POC-acceptable per CLAUDE.md (schedule post-POC) |
| 3.3 | SonarQube SAST | POC-acceptable per CLAUDE.md (manual review sufficient) |
| 3.4 | Partner analytics dashboard | POC-acceptable per CLAUDE.md (post-pilot feature) |
| 3.5 | Steps 8-9 full advisor purchase flow | POC-acceptable per CLAUDE.md (static "contact us" CTA OK) |
| 3.6 | Employer SSO bridge | POC-acceptable per CLAUDE.md (Google SSO only sufficient — once that's actually built) |
| 3.7 | KIN points API for partner rewards | POC-acceptable per CLAUDE.md (post-pilot per PRD) |
| 3.8 | Vault deadman switch (cron-based) | F4 component, not Step 1 critical |
| 3.9 | Trusted-contact unlock flow | F4 component, not Step 1 critical |
| 3.10 | Real-time leaderboard (city + employer) | F5/F6 — leaderboard is opt-in, can ship post-launch |
| 3.11 | Mid-flow re-score on life event detection | F1 Step 10 — sophisticated; can ship as v1.1 |
| 3.12 | KIN News Brief auto-share card image generation | F7 — text shares work, image cards are polish |
| 3.13 | Web push notifications (in addition to WhatsApp) | nice-to-have |
| 3.14 | Native mobile app | PWA is acceptable per PRD; native is v2 |
| 3.15 | i18n (Hindi + regional) | English-only acceptable for initial pilot |

---

## Suggested launch sequence

```
DAY 1 (single engineer):
  - 1.1 Global JWT guard
  - 1.4 Strip PII logs
  - 1.5 See-the-math endpoint
  - 1.16 Consent screen text correction
  - 1.3 OTP field-name fix
  - 1.17 Startup env-var assertions

DAY 2:
  - 1.6 Sentry wiring
  - 1.2 Entity/migration name reconciliation
  - 1.11 DPDP deletion endpoint
  - 1.12 Google OAuth via Supabase Auth (stub if not ready)

DAY 3:
  - 1.8 Supabase client wiring + RLS policies
  - 1.7 (begin) Move OTP store + advisor slots to Supabase tables

DAY 4:
  - 1.7 (continue) Migrate remaining in-memory stores
  - 1.9 vercel.json + NestJS serverless wrapper + first staging deploy

DAY 5 (most impactful):
  - 1.10 Wire frontend to backend for trust/score/diagnostic/vault flows
       (this is the IRDAI audit trail fix)

DAY 6:
  - 1.13 Vault unlock — emergency mode + death cert manual queue
  - 1.14/1.15 Content sprint: 45 quiz questions + 3 news briefs (or parallel content team)

DAY 7-8 (parallel):
  - 2.7 Pilot analytics instrumentation
  - 2.11 Integration tests for audit immutability + ownership
  - 2.12 Partner embed SDK + sample seed
  - 2.10 GitHub Actions CI

DAY 9 (UAT + first pilot partner go-live):
  - End-to-end test on real Supabase staging
  - Performance baseline run on staging
  - First pilot partner onboarding rehearsal
```

This sequence puts all P0s in days 1-6 and quality fixes in days 7-9. With 2 engineers it compresses to ~5 calendar days.

---

## Final GO/NO-GO call

**NO-GO** in current state. The defects are not architectural — they are wiring fixes and missing config — but the audit trail gap (B1 + B2 + B6) is a hard regulator-facing blocker, and the missing observability (B8 + B9) means a production incident would go undetected until users complain.

After completing items 1.1-1.17 (estimated 5-8 engineer-days) + a smoke-test pass on staging Supabase, the system can be considered **GO for a limited pilot** (single partner, <100 users, with item 2.7 analytics in place so you can actually see what's happening).
