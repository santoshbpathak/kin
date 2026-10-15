# README fact check

Every claim in `README.md` was checked against the repository on
15 October 2026 (branch `docs/readme-overhaul`). Nothing in the README is
taken from marketing material; the previous README is preserved at
`docs/README_v1_backup.md`.

## Verified capabilities

| Claim | Evidence |
|---|---|
| Conversational diagnostic with confidence tags | `apps/api/src/modules/diagnostic/agent/*`, `mapper/profile-mapper.service.ts` (confidence map), `apps/web/src/modules/diagnostic/DiagnosticChat.tsx`; exercised live in demo mode (12 turns, profile persisted) |
| Deterministic Protection Score with life/health/income sub-scores and rupee gaps | `apps/web/src/modules/score/scoreEngine.ts`, `apps/api/src/modules/score/protection-score.service.ts`; `RULE_VERSION = 'v1.0.0'`; 20 + 16 engine tests |
| "See the Math" with formula, basis text, regulatory reference, immutable audit rows | `apps/web/src/modules/trust/recommendationEngine.ts` (`formula`, `basisText`, `irdaiRuleReference`), `apps/api/src/database/entities/recommendation-audit.entity.ts` (`@BeforeUpdate`/`@BeforeRemove` throw) |
| Hidden coverage discovery (EDLI, PMSBY, PMJJBY, ESI, motor PA, card, home-loan) | `apps/web/src/modules/discovery/discoveryEngine.ts`, `apps/api/src/modules/discovery/discovery-engine.service.ts` |
| Vault behind a separate short-lived token, signed-URL uploads to a private bucket | `apps/api/src/modules/auth/auth.service.ts#issueVaultToken`, `common/guards/vault.guard.ts`, `modules/vault/vault.service.ts`, `sql/storage-policies.sql` |
| AI advisor with compliance guard and escalation | `apps/api/src/modules/connect/advisory/*`, `shared/compliance/compliance-guard.service.ts` |
| Weekly briefs, quiz, streaks | `apps/web/src/modules/content`, `quiz`, `engagement`; `apps/api/src/modules/engagement`, `content` |
| Anonymous by default, consent records, erasure endpoint, partner layer without PII | `auth.controller.ts` (`POST /auth/session`, `DELETE /auth/me`), `trust/consent.service.ts`, `partner/partner.service.ts` |
| Demo mode, health endpoint, ribbon | `apps/api/src/shared/openai/openai.client.ts#isDemoMode`, `mock-openai.client.ts`, `modules/health`, `apps/web/src/components/DemoBanner.tsx` |
| Formula weights 0.40 / 0.35 / 0.25, 10× / 3× / 24-month rules, 70 % employer haircut | `scoreEngine.ts` lines 101–142 and `protection-score.service.ts` lines 53–84 |
| Tech stack versions | `apps/web/package.json`, `apps/api/package.json`, `pnpm-lock.yaml` |
| Quick-start commands | root `package.json` scripts: `dev:local`, `test`, `typecheck`, `build`; `apps/web` `lint` |
| URLs and ports | `apps/web/vite.config.ts` (5173, proxy to 3001), `apps/api/src/main.ts` (`/api/v1`, `/api/docs` outside production) |
| CI steps | `.github/workflows/ci.yml` |
| Security bullets | `docs/security/04-application-security.md` §2 with live verification log |
| Sole author | `git log --format=%an` → one person under two display names; remote `santoshbpathak/kin-mvp` |
| Test counts quoted in docs (114 API, 26 web) | run on 15 Oct 2026; not quoted as a badge because they go stale |

## Claims deliberately not made

- No user numbers, adoption, partners, pilots, uptime or performance figures (none exist).
- No deployment link: `app.kin.ai.in` / `api.kin.ai.in` appear in deploy configs but availability was not verified and the repo should not advertise a private deployment.
- No "production-ready", "secure", "audited" or "regulator-approved".
- No Google login (stub returns 501), no live WhatsApp (sandbox), no e2e tests (`test:e2e` config folder is missing).
- The API `start` script was `node dist/main` but Nest emits `dist/src/main.js`; corrected to `node dist/src/main` on this branch so the documented production start works.

## Unverified or provisional

| Item | Status |
|---|---|
| CI badge | Renders only after the workflow has run on GitHub; the repository is private and unpushed, so it shows "no status" until then. |
| Licence badge "pending" | Accurate: no `LICENSE` file; see `docs/OPEN_SOURCE_LICENSING_REVIEW.md`. |
| Banner / social preview score ring showing "59" | Illustrative graphic, not a screenshot; alt text says so. |
| Mermaid diagram | Syntax is standard `flowchart LR`; GitHub renders Mermaid, but it was not rendered here. |

## Missing assets

- A desktop-width capture (all screenshots are 390 × 844 at 2×, the PWA's primary form factor).
- A short MP4 (a GIF exists; `ffmpeg` is available locally so an MP4 can be produced the same way).
- Logo files for a GitHub organisation profile (the SVGs in `docs/assets/README/` can be reused).

## Documentation gaps found

- `apps/api` has a `lint` script but no ESLint configuration or dependency.
- `test:e2e` points at a missing `test/` folder.
- `docs/audit/` is a historical snapshot (banner added) and references features that have since changed.
- No `LICENSE`, `NOTICE` or trademark statement (blocked on ownership confirmation).
