# §01 Feature Completeness Matrix

For each of the 7 PRD features, each PRD acceptance criterion is scored.

Symbols: ✅ verified; ⚠️ partial / gap; ❌ missing; 🔴 P0 blocker

---

## Feature 1 - The 2-Minute KIN Journey (10-step flow)

| Step | PRD requirement | Frontend status | Backend status | Verdict |
|------|------------------|-----------------|-----------------|---------|
| 1. Discover | Wellness score tile, no insurance language | [HomePage.tsx](../../apps/web/src/modules/home/HomePage.tsx) renders score tile linking to `/diagnose` | n/a | ✅ |
| 2. Consent | DPDP granular toggles, SSO options (WhatsApp / Google / employer) | [ConsentScreen.tsx](../../apps/web/src/modules/auth/ConsentScreen.tsx) shows 3 granular toggles + WhatsApp + Google buttons. **Employer SSO button absent.** | `/auth/session` works (anonymous). `/auth/consent` exists but unreachable (controller missing JWT guard - returns 500). | ⚠️ employer SSO missing (POC-OK per CLAUDE.md), but consent persistence broken |
| 3. Diagnose | Exactly 7 questions | [diagnostic/questions.ts](../../apps/web/src/modules/diagnostic/questions.ts) defines 7 questions. Frontend parses locally. | `/diagnostic/complete` exists but returns 500 (auth guard missing) | ⚠️ frontend OK, backend broken |
| 4. Insight | 0-100 score + Gap Map with 3 sub-scores | [ScoreDial.tsx](../../apps/web/src/modules/score/ScoreDial.tsx), [GapMap.tsx](../../apps/web/src/modules/score/GapMap.tsx), [ScoreBreakdown.tsx](../../apps/web/src/modules/score/ScoreBreakdown.tsx). Client-side `scoreEngine.ts` | `/score/calculate` returns 500 (auth guard missing) — confirmed in [04-performance-findings.md](04-performance-findings.md) load test #4: 200/200 errors | 🔴 backend broken; **score never saved to DB → no audit trail** |
| 5. Recommend | 3-5 ranked actions, every one has "See the Math" button | [RecommendationsPage.tsx](../../apps/web/src/modules/trust/RecommendationsPage.tsx) renders client-side recs with "See the Math" drawer on every card | `/trust/recommendations` returns 500. Logic in [recommendation.service.ts](../../apps/api/src/modules/trust/recommendation.service.ts) is sound (4 deterministic recs with disclaimers, CG-1 to CG-8 references) but unreachable | 🔴 backend broken; **`recommendation_audit` rows never written** |
| 6. Understand | "See the Math" plain-language formula visible | [SeeTheMathDrawer.tsx](../../apps/web/src/modules/trust/SeeTheMathDrawer.tsx) shows formula + IRDAI reference + disclaimers, fed from client-side `recommendationEngine.ts` | `/trust/see-the-math/:recId` returns: `{message: "Recommendation audit records available via database query in Phase 2"}` — STUBBED ([trust.controller.ts:39-42](../../apps/api/src/modules/trust/trust.controller.ts#L39-L42)) | 🔴 backend stubbed; if frontend ever switches to backend, the PRD CG-8 requirement breaks |
| 7. Comply | Auto-generated suitability summary PDF, logged for IRDAI | [ComplianceSummary.tsx](../../apps/web/src/modules/trust/ComplianceSummary.tsx) - PDF generation stubbed per `01-codebase-snapshot.md` | Audit logging path exists ([recommendation.service.ts:152-173](../../apps/api/src/modules/trust/recommendation.service.ts#L152-L173)) but unreachable | 🔴 PDF stubbed, audit never logged |
| 8. Connect | Optional 15-min advisor call booking | [ConnectPage.tsx](../../apps/web/src/modules/connect/ConnectPage.tsx) | `/connect/advisor/slots`, `/connect/advisor/book` — both **work** (verified via curl). Slots are in-memory module-level (won't survive serverless cold start). | ⚠️ functional but in-memory state breaks on Vercel |
| 9. Protect | Purchase exits to KIN PWA / partner insurer | Per CLAUDE.md POC defer-list: "static contact us CTA for POC" acceptable | `/connect/purchase/initiate` returns redirect URL to insurer with `purchaseToken` + disclaimer (CG-5 compliant) | ✅ POC-acceptable stub |
| 10. Monitor | Quarterly check-in via WhatsApp, life events trigger re-score | [lifecycleStore.ts](../../apps/web/src/modules/lifecycle/lifecycleStore.ts) tracks re-score signals client-side | WhatsApp service in **sandbox mode** ([whatsapp.service.ts](../../apps/api/src/modules/lifecycle/whatsapp.service.ts)) — never sends actual messages. SMS fallback not implemented. | ⚠️ structurally present; no real outbound messaging |

### Acceptance criteria recap

| Criterion | Status |
|-----------|--------|
| Full flow Steps 1-7 in ≤2 minutes on mid-range Android/4G | Not measured (requires real device); frontend renders all steps fast enough on desktop |
| Zero PII at partner layer until Step 9 | ✅ [partner.service.ts](../../apps/api/src/modules/partner/partner.service.ts) issues UUID-only `sessionToken`, never decodes user identity |
| Every recommendation has a logged audit record | 🔴 **NEVER LOGGED** — frontend doesn't call backend |
| Step 2 consent DPDP compliant with granular toggles | ✅ on frontend; consent never persisted to backend (controller broken) |
| Score deterministic (same inputs = same score) | ✅ Verified by reading [protection-score.service.ts](../../apps/api/src/modules/score/protection-score.service.ts) - pure function |
| "See the Math" present on every recommendation | ✅ frontend; 🔴 backend stub |

**Feature 1 verdict: ⚠️ Partial — flow renders front-to-back but the IRDAI audit trail does not exist.**

---

## Feature 2 - KIN Protection Score

| Item | Frontend (`scoreEngine.ts`) | Backend ([protection-score.service.ts](../../apps/api/src/modules/score/protection-score.service.ts)) | Verdict |
|------|-----------------------------|-----------------------------------------------------------------------------------------|---------|
| 0-100 composite | ✅ | ✅ | ✅ |
| Life 40% weight | ✅ | ✅ line 83 `lifeSubScore * 0.40` | ✅ |
| Health 35% weight | ✅ | ✅ line 83 `healthSubScore * 0.35` | ✅ |
| Income 25% weight | ✅ | ✅ line 83 `incomeSubScore * 0.25` | ✅ |
| Score bands at 0-30 / 31-55 / 56-75 / 76-90 / 91-100 | ✅ | ✅ line 38-44 | ✅ |
| Employer mediclaim at 70% face value | ✅ | ✅ line 66 `profile.healthCoverAmount * 0.70` | ✅ |
| ULIP/endowment: only pure risk component | n/a in code | Implied via ULIP feature flag false; not explicitly handled in score | ⚠️ |
| Hidden coverage as "Bonus" not added to primary | ✅ | ✅ tracked in `hiddenCoverageTotal` separately | ✅ |
| `rule_version` stored on every score record | ✅ `v1.0.0` | ✅ const `RULE_VERSION = 'v1.0.0'` stored in DB | ✅ (but score row never written because endpoint crashes) |
| Score calc <500ms P95 | Not measured | Static analysis: pure arithmetic, no DB read | ✅ (will easily meet) |

**Feature 2 verdict: ✅ Code matches PRD. Endpoint just needs the auth guard fix to actually persist scores.**

---

## Feature 3 - Hidden Coverage Discovery Engine

### Question and coverage mismatch vs PRD

| PRD-required coverage | Implemented in code? | Source |
|------------------------|----------------------|--------|
| 1. Indian Railways travel → IRCTC ₹10L | ✅ Backend `IrctcTravelPa`, frontend not surfaced | [discovery-engine.service.ts:288-315](../../apps/api/src/modules/discovery/discovery-engine.service.ts#L288-L315) |
| 2. LPG gas connection → ₹6L/₹30L | ❌ **MISSING** | grep -i "lpg" apps/ → no matches |
| 3. Salaried + PF/EPFO → EDLI ₹7L | ✅ Both frontend and backend | [discoveryEngine.ts:77-102](../../apps/web/src/modules/discovery/discoveryEngine.ts#L77-L102) |
| 4. Credit card → embedded covers | ✅ frontend `card_travel_pa`; ❌ NOT in backend rule engine | Only present in frontend |
| 5. Savings bank → PMSBY ₹2L | ✅ Both | [discoveryEngine.ts:104-137](../../apps/web/src/modules/discovery/discoveryEngine.ts#L104-L137) |
| 6. Employer benefits → Group mediclaim + group term 3× CTC | ⚠️ Only group term life, not mediclaim breakdown | Frontend + backend cover group term only |
| 7. Car/two-wheeler → Motor PA ₹15L | ✅ Both | [discoveryEngine.ts:249-275](../../apps/web/src/modules/discovery/discoveryEngine.ts#L249-L275) |
| 8. Jan Dhan family → PMJDY ₹2L Rupay | ❌ **MISSING** | grep -i "jandhan\|pmjdy" apps/ → no matches |

**Extras present in code, not in PRD:** PMJJBY (frontend + backend), ESI (frontend + backend), MRTA (frontend + backend), standalone PA (frontend only).

### Display rules

| Rule | Status |
|------|--------|
| Active coverages: green indicator + amount | ✅ Frontend uses `statusOrder` ranking + colored badges |
| Opt-in coverages: amber + amount + direct action button | ✅ |
| Claim instructions per coverage (helpline + process) | ⚠️ Backend has `howToActivate` and `source`, frontend has `howToVerify` array but **no per-coverage helpline number** (PRD CG-9 mentions Bima Bharosa 1800-4254-732 only in quiz, not in discovery results) |
| Hidden coverages add to "Bonus Coverage" only, separate from score | ✅ Both backends keep `hiddenCoverageTotal` distinct |

**Feature 3 verdict: ⚠️ Functional but coverage list diverges from PRD — LPG and PMJDY missing; helpline numbers not surfaced per coverage.**

---

## Feature 4 - KIN Protection Vault

### Vault components

| Component | Frontend | Backend | Wired? |
|-----------|----------|---------|--------|
| Policy documents (PDF upload or manual entry) | ✅ [VaultPage.tsx](../../apps/web/src/modules/vault/VaultPage.tsx) + [AddDocumentFlow.tsx](../../apps/web/src/modules/vault/AddDocumentFlow.tsx) | ✅ [vault.service.ts](../../apps/api/src/modules/vault/vault.service.ts) + presigned URL stub | 🔴 **not wired — vault is 100% localStorage** |
| Hidden coverage record (auto-populated) | ✅ via sessionStorage `kin_discovery_results` | Discovery results never stored backend-side | n/a |
| Nominee directory (name, relationship, mobile, share %, WhatsApp) | ✅ [AddNomineeFlow.tsx](../../apps/web/src/modules/vault/AddNomineeFlow.tsx) | ✅ [nominee.service.ts](../../apps/api/src/modules/vault/nominee.service.ts) — Aadhaar last-4 validated | not wired |
| Claim guide per policy | Static text on results page | Not in API | ⚠️ |
| KIN suitability records (downloadable audit trail) | [ComplianceSummary.tsx](../../apps/web/src/modules/trust/ComplianceSummary.tsx) renders client-side | Backend `recommendation_audit` table exists, never populated | 🔴 |

### Nominee unlock triggers

| Trigger | Backend ([unlock.service.ts](../../apps/api/src/modules/vault/unlock.service.ts)) | Frontend |
|---------|-----------------------------------------------------------------------------------|----------|
| Death certificate → 24h manual review | API endpoint `POST /vault/unlock/trigger` accepts `death_cert` type. **Manual review workflow missing — just sets status to "pending".** | ⚠️ |
| Deadman switch (18 months + 3 pings, configurable 12-36) | API accepts `deadman` trigger but **no cron job exists** to auto-fire | ❌ no scheduler |
| Trusted contact (2 pre-designated contacts) | API accepts `trusted_contact` but **no trusted-contact registration flow** | ❌ |
| Emergency mode (user-activated, limited preview) | API accepts `emergency`. `nominee-view/:unlockToken` returns generic "vault access granted" message — **no actual limited-data view filtering** | ❌ |

### Vault security checks

| Check | Status |
|-------|--------|
| S3 AES-256 server-side encryption | ❌ Stub — no real S3 SDK calls anywhere ([vault.service.ts:68-75](../../apps/api/src/modules/vault/vault.service.ts#L68-L75)) |
| Presigned URL access only, time-limited | Stub returns `?presigned=stub` query param — not a real signed URL | ❌ |
| No bulk download API | ✅ verified - no bulk endpoint exists |
| Access logged on every vault entry | Per code comment "Phase 2: CloudWatch" — currently nothing | ❌ |
| Vault API requires elevated JWT scope | ✅ verified dynamically — `/vault/documents` returns 401 with standard token, only `vault-jwt` passes |
| `s3_key` never exposed in API responses | ✅ verified — vault.service.ts response types omit s3Key in list endpoints |

**Caveat:** the vault-token issuance endpoint (`POST /auth/vault-token`) **itself returns 500** because [auth.controller.ts:46-51](../../apps/api/src/modules/auth/auth.controller.ts#L46-L51) has no `@UseGuards`. So even if the frontend tried to use the backend vault, it couldn't get a vault token in the first place.

**Feature 4 verdict: 🔴 Vault is non-functional for POC. Backend is a shell, frontend is local-only, S3 is a stub, none of the 4 unlock triggers actually execute their PRD behavior.**

---

## Feature 5 - Protection Streak & Milestones

| Item | Frontend | Backend ([streak.service.ts](../../apps/api/src/modules/engagement/streak.service.ts)) | Verdict |
|------|----------|----------------------------------------------------------------------------------------|---------|
| 6 weekly actions with PRD-specified points | ✅ frontend tracks; ✅ backend `ACTION_POINTS` lines 19-26 has all 6: weekly_health_checkin:10, read_brief:5, vault_upload:15, quiz_complete:10, update_nominees:20, share_scorecard:10 | ✅ matches PRD exactly |
| 6 milestones | Backend `BADGE_RULES` lines 28-33 has only **4 rules** (consistent_protector, growing_protector, family_guardian, vault_keeper). PRD requires 6: also "Well Protected" (score ≥ 80) and "Family First" (nominee + vault configured). | ⚠️ |
| Growing Protector requires score >60 | Backend just checks `currentStreakWeeks >= 8`, missing score gate | ⚠️ |
| Growing Protector awards 100 KIN points | Backend doesn't grant point bonuses on badge unlock | ❌ |
| Leaderboard: city-level, anonymised, percentile only | ❌ No leaderboard implementation in backend; frontend has UI stub | ❌ |
| Opt-in only | n/a (no implementation) | n/a |

**Feature 5 verdict: ⚠️ 4 of 6 badges implemented, leaderboard missing entirely.**

---

## Feature 6 - KIN IQ Weekly Quiz

| Item | Backend ([quiz.service.ts](../../apps/api/src/modules/engagement/quiz.service.ts)) | Verdict |
|------|------------------------------------------------------------------------------------|---------|
| 3 scenario-based questions per week | ✅ `getQuestionsForWeek` returns 3 via deterministic seed | ✅ |
| Wrong-answer explanation includes "what to check in your policy" | ✅ each question has `learningHook` and `explanation` fields | ✅ |
| KIN IQ score 0-100 cumulative | ✅ Stored in `kinIqStore` Map (in-memory) | ⚠️ in-memory only, lost on restart |
| Question bank ≥ 50 questions | ❌ **Only 5 questions defined** in `QUESTION_BANK` (q1, q2, q4, q7, q10) | 🔴 |
| Weekly leaderboard by employer code (opt-in) | ❌ Not implemented | ❌ |

**Feature 6 verdict: 🔴 Question bank is at 10% of PRD requirement (5/50). Pilot users would see the same 3 questions repeatedly.**

---

## Feature 7 - KIN News Brief

| Item | Backend ([content.service.ts](../../apps/api/src/modules/content/content.service.ts)) | Verdict |
|------|----------------------------------------------------------------------------------------|---------|
| Weekly Monday delivery via WhatsApp | ❌ No cron scheduler. `whatsapp.service.ts` sandbox-only. | 🔴 |
| Structure: headline + plain explanation + action + policy fact | ✅ `BriefItem` and `NewsBrief` interfaces match | ✅ |
| Max 250 words total | Not enforced in code; only one sample brief exists | ⚠️ |
| Zero product recommendations in Brief | ✅ Sample brief has no products, education-only | ✅ |
| WhatsApp-shareable card format | `generateShareContent` returns text only - not an image card | ⚠️ |
| Personalisation: city, income band, life stage | ✅ `personalisationTags` filtered by `userTags` query param | ✅ |
| **Volume:** PRD requires first 4 weeks ready at launch | Only **1 brief** in [content.service.ts NEWS_BRIEF_STORE](../../apps/api/src/modules/content/content.service.ts) | 🔴 |

**Feature 7 verdict: 🔴 Single brief in store (vs 4 needed for launch), no scheduler, WhatsApp sandbox-only.**

---

## Summary table

| Feature | Verdict | Most critical gap |
|---------|---------|--------------------|
| F1 - 2-min flow | ⚠️ | Audit trail never written (frontend bypasses backend) |
| F2 - Protection Score | ✅ | Endpoint crashes on call (auth guard) |
| F3 - Hidden Coverage | ⚠️ | LPG + PMJDY missing; no per-coverage helpline |
| F4 - Vault | 🔴 | 100% localStorage, S3 stub, unlock triggers non-functional |
| F5 - Streak & Milestones | ⚠️ | 2 badges missing, no leaderboard |
| F6 - KIN IQ Quiz | 🔴 | 5 questions vs PRD-required 50 |
| F7 - News Brief | 🔴 | 1 brief vs 4 required, no scheduler, no real WhatsApp send |
