# KIN — Open-Source Readiness Report

**Branch:** `prep/open-source-release` (not pushed) · **Date:** 15 October 2026 ·
**Scope:** full repository `santoshbpathak/kin-mvp` (22 commits, 5 branches) ·
**Method:** AI-assisted audit with gitleaks, pnpm audit, static review of every
controller/service/engine, and active HTTP and browser verification of the
built application in demo mode. Supporting detail: `docs/security/01…05`,
`docs/financial-methodology.md`, `docs/OPEN_SOURCE_LICENSING_REVIEW.md`.

---

## Overall recommendation

# READY FOR PUBLICATION — security and privacy
# (subject to the owner's legal sign-off on ownership and licence)

No confirmed critical or high-severity security or privacy risk remains in
the branch or in its git history. The one open gate is legal, not technical:

| Gate | Status | Why |
|---|---|---|
| **Security of the code** | **Ready, with one operator action** | Every confirmed HIGH and MEDIUM code finding is fixed and regression-tested; the production dependency graph has 0 critical / 0 high. The one remaining MEDIUM (database TLS verification) is mitigated by a new switch that the operator must turn on. |
| **Sensitive content in the repository and its history** | **Ready** | All three confidential documents are removed from the tree and **purged from the history of every local branch** (rewritten 15 Oct 2026); historical image blobs were re-written without employer metadata. The GitHub remote still holds the old history until the owner publishes from this clone (see §5). |
| **Ownership, licensing, legal** | **Owner sign-off required (outside security)** | No licence can be applied until the owner confirms the right to release the code, brand and content — several signals point at employer-owned material. This cannot be resolved by engineering work. |

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

The content problems have been fixed at the owner's instruction: an
employer's internal compliance manual, a corporate-labelled PRD and a
Markdown PRD marked Confidential are deleted from the tree and purged from
the history of every local branch, and the logo assets were rewritten in
every historical commit without the employer brand-kit metadata. What
remains is the unanswered question of who owns the IP, which only the
owner can settle. A demo mode lets anyone run the entire product with no
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
| P-1 | **CRITICAL** | **Resolved** — deleted and purged from all local history | Employer-internal compliance manual with third-party author metadata | `03-privacy-audit.md` |
| P-2 | **HIGH** | **Resolved** — deleted and purged | PRD `.docx` with Purview labels / corporate tenant id | `03-privacy-audit.md` |
| P-3 | **HIGH** | **Resolved** — deleted and purged (owner instruction) | `KIN_PRD_v3.md` marked Confidential, investor content | `03-privacy-audit.md` |
| P-4 | **HIGH** | **Resolved** — metadata stripped in every historical commit | Employer brand-kit attribution in PNG metadata | `03-privacy-audit.md` |
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
| Secrets / credentials | **No** (gitleaks, all commits before and after the rewrite) | none |
| `Compliance Mannual.pdf` | **No longer** — purged from every local branch | — |
| `KIN_MVP1_PRD_v3.docx` | **No longer** — purged | — |
| `KIN_PRD_v3.md` | **No longer** — purged | — |
| PNGs with employer attribution metadata | **No longer** — every historical blob rewritten without metadata | — |
| Personal author e-mail | Yes (all commits) | optional mailmap rewrite; not a publication blocker |
| Deleted files with sensitive content | No | — |

**What was done (15 Oct 2026, on the owner's instruction):** a full backup
bundle of the untouched history was written first
(`/Users/santoshpathak/Projects/KIN-history-backup-before-rewrite.bundle`,
keep it private and off the public repo). Then `git filter-branch` with a
tree filter rewrote **all six local branches** (`main`,
`prep/open-source-release` and the four `fix/*` branches), deleting the
three documents from every commit and stripping image metadata in every
commit; `refs/original` was removed, reflogs expired and objects pruned.
Verification: zero commits touch the three paths on any branch; zero
employer/Canva strings in any historical image blob; gitleaks: 42 commits,
no leaks.

**What is still required of the owner:** the GitHub remote
(`origin/main` = `70aae42`) still has the old history. Publish from this
clone only, either by **creating a new public repository and pushing these
branches** (recommended — GitHub keeps unreachable objects of the old repo
indefinitely unless support purges them), or by force-pushing all six
branches to the existing repository and asking GitHub Support to purge
unreachable objects before making it public. Any other clone of the old
history must be discarded.

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

1. Publication from this clone: new public repository (recommended) or
   force-push of all six rewritten branches plus a GitHub Support purge (§5).
2. Ownership confirmation and licence application (§8).
3. Production config: `DATABASE_SSL_REJECT_UNAUTHORIZED=true`,
   `WHATSAPP_APP_SECRET`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`; rotate the old
   verify token in Meta if it was ever configured.
4. Major dependency migrations (Nest 11/12, React Router 7, Vite 6).
5. Author e-mail rewrite (optional).

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
| Secrets, history | `gitleaks git . --redact` | **0 leaks** — 22 commits before the rewrite, 42 commits (all six branches) after it |
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
| Old history still on the GitHub remote | HIGH until published correctly | publish from this clone only (§5) |
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

1. **Owner:** confirm IP ownership, then add `LICENSE` (Apache-2.0) +
   `NOTICE` + trademark note; publish from this clone into a new public
   repository (§5) and discard every clone of the old history.
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
