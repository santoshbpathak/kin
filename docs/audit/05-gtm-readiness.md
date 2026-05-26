# §05 GTM Readiness

Pilot-launch readiness across onboarding, analytics, partner enablement, and content.

---

## Onboarding & user flow

| Item | Status |
|------|--------|
| First-time user flow works without a returning account | 🟢 Anonymous session works (`POST /auth/session` returns JWT) |
| Anonymous session needs zero PII | 🟢 Verified — `consentedPii: false` default |
| Partner embed SDK documented | 🔴 **No README or integration guide for partner embed**. `apps/web/` has no exported SDK package. |
| Brand adaptation tested with sample partner tokens | 🟡 `BrandProvider.tsx` reads `/partner/brand/:key` and applies CSS variables. **No sample partner row seeded in DB**, so partners must be inserted manually. |
| QR code direct link to KIN PWA | ⚠️ Not implemented. The web app exists at port 5173 but no /qr endpoint and no PWA install prompt code (despite `vite-plugin-pwa` being installed). |

🟠 P1: partner embed documentation completely absent — pilot partner cannot onboard self-serve.

---

## Analytics & monitoring

### Pilot success metrics (PRD requires 5 metrics instrumented)

| Metric | Instrumented? | Notes |
|--------|----------------|-------|
| KIN check-in completion rate | ❌ | No event tracking found. `grep -rn "analytics\|track\|amplitude\|mixpanel\|posthog\|gtag\|datadog" apps/` returns zero. |
| Users who view Score & Gap Map | ❌ | Same |
| Policy purchase or advisor contact rate | ❌ | `/connect/purchase/initiate` returns a redirect URL but doesn't emit any event. Same for `/connect/advisor/book`. |
| Week-4 retention rate | ❌ | No retention bucketing. Streak data is in [streak.service.ts](../../apps/api/src/modules/engagement/streak.service.ts) but no aggregation query for "users with visits ≥ 4 weeks apart" |
| Users with 4-week streak | ⚠️ | Streak data captured per user, but no admin/analytics endpoint to aggregate |

🔴 **P0: zero analytics instrumentation.** Pilot success cannot be measured. PRD requires all 5 metrics + funnel drop-off.

### Event tracking for each step of core flow

🔴 Not implemented. No event emitter, no telemetry SDK.

### Funnel drop-off tracking

🔴 Not implemented.

### Partner analytics webhook (anonymised cohort data)

🔴 Not implemented. No outbound webhook code in the backend. CLAUDE.md POC scope says "Partner analytics dashboard - post-pilot feature", which is acceptable, **but the event capture itself also doesn't exist** so even post-pilot you'd have no historical data to dashboard.

---

## Employer partner readiness

| Item | Status |
|------|--------|
| Partner embed SDK (WebView iframe or RN component) documented | 🔴 absent |
| Employer onboarding documentation | 🔴 absent |
| Employer admin dashboard or reporting (cohort-level) | 🔴 not in scope per CLAUDE.md POC |
| KIN points API for partner rewards | 🔴 not in scope per CLAUDE.md POC |
| `partner_config` table seedable | 🟢 entity + repo exist, no admin endpoint to seed it (must use direct DB insert) |
| Brand token theming demonstrated | 🟢 BrandProvider works |

🟠 P1: zero partner enablement materials.

---

## Content readiness

### KIN IQ question bank

PRD requirement: ≥ **50 questions**.
Current: **5 questions** in `QUESTION_BANK` ([quiz.service.ts:27-93](../../apps/api/src/modules/engagement/quiz.service.ts#L27-L93)) — q1, q2, q4, q7, q10. IDs are non-sequential, suggesting placeholder set during development.

🔴 P0: 10% of required content.

### KIN News Briefs

PRD requirement: **first 4 weeks written and scheduled**.
Current: **1 brief** in `NEWS_BRIEF_STORE` ([content.service.ts:30-66](../../apps/api/src/modules/content/content.service.ts#L30-L66)). The frontend has more briefs in [briefData.ts](../../apps/web/src/modules/content/briefData.ts) (multiple `sourceUrl`s detected in grep), but they live client-side and aren't synced to backend.

🔴 P0: 25% of required content; no scheduler to fire weekly.

### Claim instructions for 8 hidden coverages

PRD requirement: **complete and verified per coverage**.
Current: backend `howToActivate` field exists per coverage in [discovery-engine.service.ts](../../apps/api/src/modules/discovery/discovery-engine.service.ts); frontend `howToVerify` array per coverage in [discoveryEngine.ts](../../apps/web/src/modules/discovery/discoveryEngine.ts). Quality is good, but **no helpline numbers** per coverage. PRD requires "claim instructions present for every coverage (helpline number + exact process)". The Bima Bharosa number 1800-4254-732 appears only in one quiz question, not in coverage details.

🟠 P1: helpline numbers missing.

---

## Pilot-launch operational checklist

| Item | Status | Risk |
|------|--------|------|
| Deployment runbook | 🔴 None in repo (no README beyond local dev) |
| Rollback procedure | 🔴 Not documented |
| Database migration runbook | 🔴 Migration mismatch with entities not yet resolved |
| Incident response (PII leak, audit table corruption) | 🔴 No process |
| Support contact / escalation matrix | 🔴 Not documented |
| Pre-launch UAT script | 🔴 Not in repo |
| Status page | 🔴 Not implemented |

🔴 P0: no operational readiness documentation. Pilot can launch technically but pilot operations have no runbook.

---

## GTM summary

| Area | Verdict |
|------|---------|
| Anonymous onboarding | 🟢 works |
| Partner embed docs | 🔴 missing |
| Pilot metrics instrumentation | 🔴 zero |
| Quiz bank volume | 🔴 10% complete |
| Brief content volume | 🔴 25% complete |
| Operational runbooks | 🔴 absent |

**Even if every P0 from §06 is fixed, the pilot cannot be operated because content is thin and there is no measurement.**
