# KIN — Open-Source Readiness Report

**Branch:** `prep/open-source-release` (not pushed) · **Date:** 15 October 2026 ·
**Scope:** full repository `santoshbpathak/kin-mvp` (22 commits, 5 branches) ·
**Method:** AI-assisted audit with gitleaks, pnpm audit, static review of every
controller/service/engine, and active HTTP and browser verification of the
built application in demo mode. Supporting detail: `docs/security/01…05`,
`docs/financial-methodology.md`, `docs/OPEN_SOURCE_LICENSING_REVIEW.md`.

---

## Overall recommendation

# NOT READY FOR PUBLICATION

Two separate gates are still closed, and they are different in kind:

| Gate | Status | Why |
|---|---|---|
| **Security of the code** | **Ready, with one operator action** | Every confirmed HIGH and MEDIUM code finding is fixed and regression-tested; the production dependency graph has 0 critical / 0 high. The one remaining MEDIUM (database TLS verification) is mitigated by a new switch that the operator must turn on. |
| **Sensitive content in the repository and its history** | **Not ready** | A third-party confidential document and a sensitivity-labelled PRD are still in git history, and a Markdown PRD marked "Confidential" is still in the tree. Fixing this needs the owner's decision on a history rewrite. |
| **Ownership, licensing, legal** | **Not ready (outside security)** | No licence can be applied until the owner confirms the right to release the code, brand and content — several signals point at employer-owned material. |

An automated audit cannot guarantee the absence of vulnerabilities; this
report states what was checked and what was found.

---

## 1. Executive summary

KIN is a well-structured TypeScript monorepo (React PWA + NestJS API) with
a sensible security baseline already in place: global JWT guard, body
whitelisting, ownership checks, hashed single-use OTPs, strict CSP, RLS,
Sentry scrubbing. The pre-existing May 2026 audit had been acted on.

This review found and fixed one HIGH application vulnerability (mass
assignment on vault update routes that bypassed validation), hardened the
WhatsApp webhook, bounded LLM spend, tightened rate limits and logging,
validated a previously unvalidated engine endpoint, and removed the NaN /
negative-score paths from both financial engines without changing any
formula. It removed unused and vulnerable dependencies and lifted the
production dependency graph from 2 critical / 33 high to 0 / 0.

The blocking issues are not in the code. They are: an employer's internal
compliance manual and a corporate-labelled PRD that were committed (now
removed from the tree, still in history), a Markdown PRD marked
Confidential, logo assets whose metadata attributed them to an employer
brand account (metadata now stripped), and the unanswered question of who
owns the IP. A demo mode now lets anyone run the entire product with no
keys and no real data.

## 2. Architecture overview

See `docs/architecture.md` and `docs/security/01-architecture-inventory.md`.
In one line: anonymous-by-default PWA → NestJS API (JWT, two scopes) →
Postgres/SQL.js; OpenAI (or scripted demo), Supabase Storage, WhatsApp
sandbox, optional Sentry; client-side deterministic engines with a
server-side audit trail.

## 3. Security findings by severity

| ID | Severity | Status | Finding | Where documented |
|---|---|---|---|---|
| P-1 | **CRITICAL** | Removed from tree; **history purge pending owner approval** | Employer-internal compliance manual with third-party author metadata | `03-privacy-audit.md` |
| P-2 | **HIGH** | Removed from tree; history purge pending | PRD `.docx` with Purview labels / corporate tenant id | `03-privacy-audit.md` |
| P-3 | **HIGH** | **Open — owner decision** | `KIN_PRD_v3.md` marked Confidential, investor content | `03-privacy-audit.md` |
| P-4 | **HIGH** | Fixed in tree; old blobs in history | Employer brand-kit attribution in PNG metadata | `03-privacy-audit.md` |
| L-1 | **BLOCKING (legal)** | Open | IP ownership of code, brand and content unconfirmed | `OPEN_SOURCE_LICENSING_REVIEW.md` |
| APP-1 | **HIGH** | Fixed + tests + live-verified | Mass assignment on vault PATCH routes (`Partial<>` DTOs bypassed validation) | `04-application-security.md` |
| S-1 / APP-2 | **MEDIUM** (HIGH once public) | Fixed + tests | WhatsApp webhook: hard-coded verify token, header/query bug, no HMAC | `02`, `04` |
| APP-3 / P-8..10 | MEDIUM | Fixed | PII in logs (phones, session token, SQL params) | `03`, `04` |
| APP-4 | MEDIUM | Mitigated; **operator must enable** | DB TLS `rejectUnauthorized:false` | `04` |
| APP-5 | MEDIUM | Fixed | Unbounded LLM calls per conversation | `04` |
| DEP-1 | MEDIUM (prod) | Open — major migrations | 6 moderate advisories need Nest 11/12 and React Router 7 | `05-dependency-audit.md` |
| APP-6 | LOW | Fixed | OTP endpoints shared the global rate limit | `04` |
| APP-7 | LOW | Fixed | Unvalidated `/score/calculate` body | `04` |
| APP-8 | LOW | Fixed | NaN / negative scores on invalid engine input | `04`, methodology |
| P-5 | LOW | Open — optional | Personal e-mail in commit author metadata | `03` |
| P-6, P-7, P-11, P-12, S-6, S-7 | LOW | Fixed | Local paths, real-name placeholder, OTP log comment, smoke-test phone | `02`, `03` |
| DEP-2 | LOW (dev only) | Open | Dev-tooling advisories (vitest/tinypool, vite 5, braces, tmp, serialize-javascript) | `05` |
| INFO | — | — | Real production hostnames in docs; brand HTML bloat; dev credential placeholders | `02`, `03` |

Nothing was found in the categories: SQL/NoSQL injection, XSS, CSRF, SSRF,
open redirect, path traversal, unsafe deserialization, weak crypto,
information disclosure in errors, committed secrets, analytics/tracking.

## 4. Sensitive information findings

No real customer data, production exports, backups, session data, uploaded
documents or real user profiles exist in the tree or history. All sample
people are fictional. The sensitive material is **confidential documents
and attribution metadata**, not personal data (details in §3 and
`docs/security/03-privacy-audit.md`).

## 5. Git history exposure

| Item | In history? | Recommendation |
|---|---|---|
| Secrets / credentials | **No** (gitleaks, all commits) | none |
| `Compliance Mannual.pdf` | Yes (since initial commit) | purge |
| `KIN_MVP1_PRD_v3.docx` | Yes | purge |
| PNGs with employer attribution metadata | Yes (old blobs) | purge if attribution matters |
| Personal author e-mail | Yes (all commits) | optional mailmap rewrite |
| Deleted files with sensitive content | No | — |

**Options:** (a) `git filter-repo` on this repository to drop the two files
and old PNG blobs (and optionally rewrite the author e-mail), then
force-push and re-clone — history and PR references are rewritten;
(b) publish a **fresh repository** containing only the current tree as a
single initial commit ("squash to public") and keep this repo private —
simplest and safest, loses public history; (c) publish as-is — not
acceptable while P-1/P-2 remain in history. Recommendation: **(b)** unless
public commit history has value, in which case (a). Neither was performed:
history rewriting requires explicit approval.

## 6. Dependency vulnerabilities

Production: 0 critical / 0 high / 6 moderate (all need major bumps: NestJS
10→11/12, React Router 6→7). Development tooling: 2 critical (vitest's
`tinypool`, needs Vite 6) / 4 high / 14 moderate, none shipped. Licences:
all permissive, no copyleft. Full table and the override lesson in
`docs/security/05-dependency-audit.md`.

## 7. Privacy and data-protection findings

Anonymous by default; granular consent; erasure endpoint; Aadhaar last-4
only; private storage with signed URLs; Sentry scrubbing; logs now masked.
Open: vault step-up lacks fresh-OTP re-auth (documented); conversation
history is stored in the DB (deliberate deviation from the brief, with TTL).

## 8. Licensing and ownership concerns

No `LICENSE`; `license: null` everywhere. Dependencies permit any
permissive licence. **Apache-2.0 recommended**, to be applied only after
ownership confirmation (employer sign-off or counsel). Trademark statement
for the KIN name/logo required. Manrope (OFL) notice if font files are
kept. Details: `docs/OPEN_SOURCE_LICENSING_REVIEW.md`.

## 9. Changes implemented on this branch

Security and privacy: vault DTOs + service allow-lists; webhook HMAC,
query params, no default token; OTP/vault throttles; `/score/calculate`
DTO; LLM turn cap; DB TLS switch; log masking; SQL logging opt-in; demo
banner; health endpoint; `.gitignore`, `.gitleaks.toml`, CI workflow;
confidential documents removed; PNG metadata stripped; personal paths and
placeholder removed; smoke test phone parameterised; `.env.example` with
placeholders only and every new variable documented.

Dependencies: 6 packages removed, `uuid` → `crypto.randomUUID`, 25
bounded overrides, `typeorm`/`@sentry/node`/`react-router-dom` patched,
`packageManager` pinned, install scripts allow-listed, dead pnpm config
removed, `vitest` added.

Quality: input guards in both engines (formulas unchanged); stale spec
fixed; `WhatsAppService` config-key bug fixed; conditional React hooks in
`RecommendationsPage` reordered; ESLint 9 flat config; 102 new tests.

Documentation: README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, CHANGELOG,
`docs/architecture|installation|development|financial-methodology`,
`docs/demo/personas.md`, `docs/security/01–05`,
`docs/OPEN_SOURCE_LICENSING_REVIEW.md`, `BUILD.md`, project `CLAUDE.md`,
runbook note, historical-snapshot banner on `docs/audit/`.

## 10. Changes requiring manual approval (not performed)

1. Git history rewrite or fresh-repository publication (§5).
2. Decision on `KIN_PRD_v3.md` (strip / remove / keep private).
3. Ownership confirmation and licence application (§8).
4. Production config: `DATABASE_SSL_REJECT_UNAUTHORIZED=true`,
   `WHATSAPP_APP_SECRET`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`; rotate the old
   verify token in Meta if it was ever configured.
5. Major dependency migrations (Nest 11/12, React Router 7, Vite 6).
6. Push of this branch and creation of the pull request.
7. Author e-mail rewrite (optional).

## 11. Tests executed and results

All executed on 15 October 2026, Node 24, pnpm 9.12, after the final change.

| Check | Command | Result |
|---|---|---|
| Typecheck (3 workspaces) | `pnpm -r typecheck` | **pass** |
| API unit tests | `pnpm --filter @kin/api test` | **114 passed, 0 failed, 12 suites** (was 36 pass / 2 fail / 6 suites) |
| Web unit tests | `pnpm --filter web test` | **26 passed, 0 failed, 3 suites** (was: no runner) |
| Build | `pnpm build` | **pass** (shared-types, web, api) |
| Web lint | `pnpm --filter web lint` | **0 errors, 6 warnings** (was: crashed — no flat config; 5 real errors once runnable, all fixed) |
| API lint | `pnpm --filter @kin/api lint` | **not available** — script exists, no ESLint config/dependency for the API (known gap) |
| Secrets, history | `gitleaks git . --redact` | **0 leaks, 22 commits** |
| Secrets, tree | `gitleaks dir . --redact` | 0 leaks in the repository (one gitignored local tool file flagged, outside scope) |
| Dependency audit | `pnpm audit --prod` | **0 critical, 0 high, 6 moderate** |
| Live API, demo mode (built `dist`, SQL.js) | curl | health ✓, 12-turn scripted diagnostic → profile persisted ✓, persona-B server score 17.9 ✓, junk body 400 ✓, mass-assignment exploit 400 ✓, cross-user PATCH 403 ✓, anonymous vault token 403 ✓, standard JWT on vault 401 ✓, old webhook token 403 ✓, OTP burst → 429 ✓, logs free of phones/JWTs ✓ |
| Live web, demo mode (headless Chromium) | browse | demo ribbon shown ✓, "Skip – stay anonymous" ✓, 12 typed answers → auto-navigation to `/score` ✓ (score 19, three sub-scores with ₹ gaps), `/recommend` renders 4 recommendations each with "See the Math" ✓, no console errors ✓, `/recommend` without a profile shows the check-in guard ✓ |
| Fresh-developer path | `pnpm install --frozen-lockfile && pnpm dev:local` | documented in `docs/installation.md`; exercised on this machine |

Skipped / not available: end-to-end tests (`test:e2e` config references a
missing `test/` folder — pre-existing), penetration testing against
production, WhatsApp live delivery, Supabase Storage upload (stubbed in
demo), Google login (stub).

## 12. Unresolved risks

| Risk | Severity | Owner action |
|---|---|---|
| Confidential documents in git history | CRITICAL/HIGH | purge or fresh repo (§5) |
| `KIN_PRD_v3.md` marked Confidential in tree | HIGH | decide |
| IP ownership unconfirmed | BLOCKING (legal) | confirm, then license |
| DB TLS verification off by default | MEDIUM | enable in production |
| NestJS 10 end-of-line; 6 moderate prod advisories | MEDIUM | plan migration |
| Per-instance rate limiting on serverless | LOW–MEDIUM | shared store before scale |
| Vault step-up without fresh OTP | MEDIUM (vault go-live) | implement before vault launch |
| Engine divergence (client vs server) | MEDIUM (correctness, not security) | unify engines |
| Dev-tooling advisories | LOW | Vite 6 / vitest 4 / jest 30 |
| No professional penetration test | — | commission before real policyholder data |

## 13. Documentation readiness

Complete for a public repository: README (all 15 requested sections),
CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, CHANGELOG, installation,
development, architecture, financial methodology, demo personas, security
series, licensing review, this report, `BUILD.md`/`CLAUDE.md` for
maintainers. Missing by design: `LICENSE` (pending ownership),
screenshots (placeholders in README).

## 14. Demo mode readiness

**Ready.** `pnpm dev:local` with no keys gives a working product: SQL.js
database, scripted AI (12-question diagnostic, canned advisor, no
escalation, fixed brief), stub storage URLs, sandbox WhatsApp (OTP printed
masked), visible demo ribbon, synthetic personas documented and tested.
Production never silently enters demo mode. No production database, no
paid API, no real data, no live transactions.

## 15. Recommended next actions

1. **Owner:** decide the publication shape (fresh repo vs history rewrite)
   and the fate of `KIN_PRD_v3.md`; confirm IP ownership; then add
   `LICENSE` (Apache-2.0) + `NOTICE` + trademark note.
2. **Operator:** set the new production variables (§10.4) and enable DB TLS
   verification; rotate the old webhook verify token if used.
3. **Engineering:** unify the score/recommendation engines; NestJS 11/12
   and React Router 7 migrations; shared rate-limit store; fresh-OTP vault
   step-up; API ESLint config; add `test/` e2e scaffold or drop the script.
4. **Before any real users at scale:** professional penetration test and a
   review of the financial assumptions listed in
   `docs/financial-methodology.md` §8 by a qualified person.
5. Re-run `gitleaks`, `pnpm audit --prod` and the full test suite as the
   last step before the first public push (CI will do this automatically
   afterwards).

---

*This tool is not a substitute for a professional security audit. The
review is an AI-assisted scan with targeted verification; it can miss
subtle issues and does not replace a qualified security firm for a system
handling personal and financial data.*
