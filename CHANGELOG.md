# Changelog

All notable changes to KIN are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[SemVer](https://semver.org/). There are no tagged releases yet.

## [Unreleased] — open-source preparation branch `prep/open-source-release`

### Security
- Vault `PATCH` routes: explicit update DTOs replace `Partial<>` bodies that
  bypassed validation; services whitelist mutable columns; identity and
  storage-key fields can no longer be set from a request body.
- WhatsApp webhook: hard-coded verify-token fallback removed, Meta
  parameters read from the query string, HMAC-SHA256 (`X-Hub-Signature-256`)
  verification with `WHATSAPP_APP_SECRET`; unsigned requests rejected in
  production.
- Per-IP throttles on OTP send (5/min) and verify (10/min); vault routes
  now enforce `VAULT_RATE_LIMIT_MAX`.
- `POST /score/calculate` body is now validated.
- Per-conversation LLM turn cap (`MAX_CONVERSATION_TURNS`, default 40).
- Database TLS verification configurable (`DATABASE_SSL_REJECT_UNAUTHORIZED`,
  `DATABASE_SSL_CA`); production warns when off.
- Logs: WhatsApp phone numbers masked, compliance-guard session tokens
  truncated, SQL query logging opt-in (`DATABASE_LOG_QUERIES`).
- Dependencies: unused `bcrypt`, `uuid`, `zustand`, `workbox-window` and
  deprecated type stubs removed; `uuid` replaced by `crypto.randomUUID`;
  same-major overrides for Express/Nest-pinned packages; `typeorm`,
  `@sentry/node`, `react-router-dom` patched. Production graph: 0 critical,
  0 high.
- Supply chain: `packageManager` pinned, install scripts allow-listed,
  dead `apps/web/.npmrc` and `.pnpmfile.cjs` removed, `.gitleaks.toml` and
  CI secrets scan added.

### Added
- Demo mode: deterministic scripted LLM client (`KIN_DEMO_MODE`),
  `GET /api/v1/health`, web "Demo mode" ribbon, synthetic personas.
- Input guards in both score engines (no `NaN` / negative scores).
- Tests: 6 new jest suites (score engine, vault DTOs and services,
  webhook signature, lifecycle controller, demo client) and a vitest setup
  for the web engines; 140 tests total.
- GitHub Actions CI (typecheck, test, build, prod audit, gitleaks).
- ESLint 9 flat config for the web app.
- Documentation: README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT,
  architecture, installation, development, financial methodology,
  licensing review, demo personas, security audit series
  (`docs/security/01…05`), readiness report, `BUILD.md`.

### Removed
- `Compliance Mannual.pdf`, `KIN_MVP1_PRD_v3.docx` and `KIN_PRD_v3.md`
  (third-party / confidential material) — deleted and purged from the
  history of every local branch.
- Employer/design-tool attribution metadata from PNG assets, in every
  historical commit.
- Empty `Inst.md`; machine-specific paths in `dev-web.sh` and
  `DEPLOYMENT.md`.

### Fixed
- Stale `intake-agent.service.spec.ts` expectations for the income-
  protection hard rule.
- `WhatsAppService` read a non-existent config key, so it could never leave
  sandbox mode.

## 2026-05-30 — MVP1 pilot build (pre-existing history)
- Conversational diagnostic (GPT-4o), three-tier advisory, brand redesign,
  IDOR and OTP brute-force fixes, strict CSP, Supabase + Vercel wiring.
