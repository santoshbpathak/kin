# KIN — Financial Protection Intelligence Platform

> An open-source Financial Protection Intelligence Platform helping
> families understand their protection needs and potential insurance
> coverage gaps.

KIN asks a household a dozen plain-language questions, turns the answers
into a **Protection Score** with three explainable sub-scores (life,
health, income), shows the rupee **gap** behind each one, surfaces
**hidden coverage** people already have (EDLI, PMSBY, employer group
cover…), and explains every recommendation with "See the Math". It is
built for India (INR, lakhs/crores, IRDAI and government schemes) and runs
as an installable PWA with a NestJS API.

**Status:** pilot-quality MVP, actively being prepared for public release.
Not production-secure by assertion, not regulator-approved, not
independently audited. See [the readiness report](security/).

---

## The problem

Most Indian households are under-insured and do not know it. Cover is
scattered across employers, banks and government schemes; the numbers are
confusing; and the only people offering to explain them earn commission
on the answer. KIN gives a family a neutral, two-minute, anonymous first
read — and keeps the arithmetic visible.

## Core features

- **Conversational diagnostic** — an AI intake agent (GPT-4o, or a
  scripted demo) collects income, dependants, obligations and existing
  cover; every field carries a confidence tag (confirmed / estimated /
  unknown) that is disclosed on the score screen.
- **Protection Score** — deterministic, versioned rules; composite plus
  life/health/income sub-scores with rupee gaps and band labels.
- **See the Math** — each recommendation ships its formula, basis text and
  regulatory reference, and is written to an immutable audit trail.
- **Hidden coverage discovery** — EDLI, PMSBY, PMJJBY, ESI, motor PA, card
  and home-loan cover from eight yes/no questions.
- **Protection Vault** — policy documents and nominees behind a separate
  short-lived vault token; files go straight to private object storage via
  signed URLs.
- **AI advisor with human hand-off** — Tier-1 AI chat grounded in the
  user's report, compliance-guarded output, escalation to human advisors.
- **Engagement** — weekly briefs, a financial-literacy quiz, streaks.
- **Privacy by design** — anonymous until the user chooses to verify a
  phone; granular consent records; one-tap erasure; partner embedding
  that never sees identity.

## Technology stack

| Layer | Tech |
|---|---|
| Web | React 18, Vite 5, TypeScript, Tailwind 3, React Router 6, PWA (Workbox) |
| API | NestJS 10, TypeORM 0.3, Passport-JWT, class-validator, Helmet, Throttler, Swagger |
| Data | PostgreSQL (Supabase) in production; SQL.js single file for local/demo |
| AI | OpenAI GPT-4o / GPT-4o-mini via the official SDK; deterministic scripted client in demo mode |
| Messaging | Meta WhatsApp Cloud API (sandbox by default) |
| Hosting | Vercel (static web + serverless API); Sentry optional |
| Tooling | pnpm 9 workspaces, jest, vitest, ESLint 9, gitleaks, GitHub Actions |

## Architecture overview

```
PWA (React) ──JWT──► NestJS API ──► Postgres / SQL.js
                        ├──► OpenAI  (or scripted demo client)
                        ├──► Supabase Storage (signed URLs, private bucket)
                        └──► WhatsApp Cloud API (sandbox unless configured)
```

The web app computes the score locally and posts the result for the
audit trail; the API owns identity, consent, the vault, the AI
orchestration and the immutable recommendation log. Details:
[`docs/architecture.md`](../docs/architecture.md).

## Screenshots

_Placeholders — add captures of the home screen, the diagnostic chat, the
score page with "See the Math", and the vault to `docs/screenshots/`._

| Home | Diagnostic | Score & gaps | Vault |
|---|---|---|---|
| `docs/screenshots/home.png` | `docs/screenshots/diagnostic.png` | `docs/screenshots/score.png` | `docs/screenshots/vault.png` |

## Installation

```bash
git clone <repo-url> kin && cd kin
pnpm install --frozen-lockfile     # pnpm 9.12 (pinned via packageManager)
pnpm dev:local                     # web :5173, API :3001, no keys needed
```

Full guide, including PostgreSQL and real integrations:
[`docs/installation.md`](../docs/installation.md).

## Local development

```bash
pnpm test        # jest + vitest
pnpm typecheck
pnpm build
pnpm --filter web lint
```

Conventions, environment variables, testing approach and how to add an
endpoint safely: [`docs/development.md`](../docs/development.md). Session
hand-over notes: [`BUILD.md`](../BUILD.md).

## Demo mode

With no `OPENAI_API_KEY` (outside production) or with `KIN_DEMO_MODE=true`,
the AI layer becomes a deterministic offline script: no paid APIs, no
network calls, no messages sent, and a visible "Demo mode" ribbon in the
app. Everything else — database, auth, vault, audit trail — runs the real
code. Synthetic personas and the answers that reproduce them:
[`docs/demo/personas.md`](../docs/demo/personas.md).

## Financial calculation methodology

Every formula, constant, rounding rule, fallback and known divergence is
documented in [`docs/financial-methodology.md`](../docs/financial-methodology.md),
with hand-computed examples that the test suites assert. In short:
life need = 10 × income, health need = 3 × income scaled for dependants
(employer cover counted at 70 %), income need = 24 months of obligations;
composite = 0.40 / 0.35 / 0.25. The document also lists the assumptions a
maintainer should review before trusting the numbers further.

## Security and privacy principles

- Anonymous by default; PII only after explicit verification and consent.
- Server-side auth on every route; ownership checks on every record;
  separate short-lived vault scope.
- Whitelisted request bodies, Helmet, strict CSP, CORS allow-list,
  per-IP throttling, hashed single-use OTPs, HMAC-verified webhooks.
- No PII in logs; Sentry scrubbing; private storage with per-user prefixes.
- Secrets only in environment variables; CI runs gitleaks on the full
  history and a production dependency audit.

Findings, fixes and open items: [`docs/security/`](../docs/security/) and
[`SECURITY.md`](../SECURITY.md) for responsible disclosure.

## Known limitations

- Two score engines (client and server) have drifted; the client one is
  authoritative today. Unifying them is the top methodology task.
- WhatsApp delivery is sandboxed (OTPs print to the dev log); Google login
  is a stub.
- Rate limiting is per API instance, not shared across serverless
  instances.
- Database TLS certificate verification is configurable but defaults to
  off for backward compatibility — turn it on in production.
- NestJS 10 is end-of-line; several moderate advisories only clear with
  the Nest 11/12 migration.
- Not yet licensed: ownership confirmation is pending (see
  [`docs/OPEN_SOURCE_LICENSING_REVIEW.md`](../docs/OPEN_SOURCE_LICENSING_REVIEW.md)).

## Contributing

See [`CONTRIBUTING.md`](../CONTRIBUTING.md) and the
[Code of Conduct](../CODE_OF_CONDUCT.md). Never add real personal data; use
the synthetic personas. Formula changes need a methodology update, a rule
version bump and updated test expectations.

## Disclaimer

KIN provides general financial-protection education based on rules of
thumb. It is **not** personalised or regulated financial advice, not an
insurance product, not an underwriting decision, and not endorsed by IRDAI
or any insurer. Figures are indicative. Consult a licensed adviser and read
product documents before buying or changing any insurance cover. Insurance
products are underwritten by licensed insurers; IRDAI does not endorse any
particular insurer.

## Roadmap

1. Unify the score and recommendation engines into one shared, tested
   package.
2. NestJS 11/12 and React Router 7 migrations; Vite 6 tooling bump.
3. Shared rate-limit store; fresh-OTP step-up for the vault.
4. Live WhatsApp templates and inbound STOP/SCORE handling.
5. Partner embedding hardening per `docs/security/PARTNER_EMBED_SECURITY.md`.
6. Professional penetration test before any real policyholder data.
7. Licence and trademark statement once ownership is confirmed.

## Licence

Not yet applied. Apache-2.0 is recommended; see the licensing review. The
KIN name and logo are not covered by the code licence.
