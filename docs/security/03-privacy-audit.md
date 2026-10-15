# 03 — Personal data and privacy audit

Scope: all tracked files, git history (all branches, including the six
deleted files), test fixtures, seeds, prompts, documentation, images, load
test output and logging code paths. Patterns searched: Indian mobile numbers
(with and without `+91`), e-mail addresses, Aadhaar-like 12-digit numbers,
PAN-like patterns, IFSC/bank account formats, dates of birth, PIN codes,
addresses, policy numbers, person names used as data, production
identifiers, session/user ids in logs, and confidential markings.

Values below are masked. Nothing was sent to any external service.

## Findings

| # | Location | What | Severity | Action taken on this branch | Still needed |
|---|---|---|---|---|---|
| P-1 | `Compliance Mannual.pdf` (root, since initial commit) | Employer-internal document: a life insurer's internal advertising-compliance manual, marked "For internal circulation only" on every page, with a named third-party employee as PDF author. Not a KIN artefact. | **CRITICAL** | **Removed from the branch tree** (`git rm`). | Purge from history (`git filter-repo`) **before** publishing; owner approval required. |
| P-2 | `KIN_MVP1_PRD_v3.docx` (root) | Word PRD with "Confidential"/"Internal" footers and Microsoft Purview sensitivity-label properties that embed a corporate Microsoft 365 tenant id. | **HIGH** | **Removed from the branch tree.** | Purge from history; owner approval required. |
| P-3 | `KIN_PRD_v3.md` (root) | Same PRD as Markdown; footer reads "… Confidential"; contains investor-facing sections (moat, revenue model, risks) and a licensing target naming a corporate group. No personal data. | **HIGH (business confidentiality)** | Kept, unchanged — this is a product decision. | Owner must either strip the confidential sections and footer or remove the file (and purge). The repo is **not** publication-ready while a document marked Confidential is in it. |
| P-4 | `apps/web/public/{apple-touch-icon,pwa-192x192,pwa-512x512}.png`, `docs/brand/KIN_Logo.png` | PNG metadata (XMP/EXIF) attributing the logo to an employer brand account in a design tool, including the tool's document, user and brand-kit ids. | **HIGH** | Metadata chunks stripped (pixels byte-identical, files 1–2 KB smaller). Verified no residual strings. | Old blobs remain in history; purge if attribution matters. Ownership of the logo itself is a licensing question (see `../OPEN_SOURCE_LICENSING_REVIEW.md`). |
| P-5 | Git author metadata, all 22 commits | Personal e-mail address of the author. | LOW | None (cannot change without rewriting history). | Optional: `git filter-repo --mailmap` to a `@users.noreply.github.com` address before first public push. |
| P-6 | `dev-web.sh`, `DEPLOYMENT.md` | Hard-coded `/Users/<name>/…` paths and a reference to a private, non-repo plan file. | LOW | Script rewritten to relative paths; runbook references replaced. | — |
| P-7 | `apps/web/src/modules/vault/UnlockInstructions.tsx` | The author's real name used as a form placeholder. | LOW | Replaced with a fictional name already used elsewhere. | — |
| P-8 | `apps/api/src/modules/lifecycle/whatsapp.service.ts` | Full phone number (and template parameters) written to logs on both the sandbox and the live send path. | MEDIUM | Masked to last four digits; parameters no longer logged. | — |
| P-9 | `apps/api/src/shared/compliance/compliance-guard.service.ts` | Full session token (the per-user identity key) written to logs on every compliance violation. | MEDIUM | Truncated to an 8-character prefix. | — |
| P-10 | `apps/api/src/app.module.ts` | TypeORM query logging in development echoes bound parameters, including phone numbers, to stdout. | LOW (dev only) | Opt-in via `DATABASE_LOG_QUERIES`. | — |
| P-11 | `apps/api/src/modules/auth/auth.service.ts` | Dev-only OTP log (phone masked, OTP in clear). | LOW (dev only) | Comment corrected; behaviour kept for local testing without WhatsApp. | — |
| P-12 | `scripts/smoke-test-prod.sh` | Canonical dummy phone number that would receive real OTPs once WhatsApp is live. | LOW | Replaced with required `SMOKE_PHONE`. | — |
| P-13 | `DEPLOYMENT.md`, `.env.example`, `vercel.json`, `apiClient.ts` | Real production hostnames. | INFO | `.env.example` now uses `example.com`; runbook and `vercel.json` keep the real domain (it is public DNS and needed for deploys). | Optional brand-neutralisation. |
| P-14 | `docs/brand/KIN_Brand_Guidelines.html` (1.4 MB) | Self-contained bundle with development builds of React embedded. No personal data. | INFO | Kept. | Consider keeping only the `.md`. |

## Verified clean

- **No real customer records, production exports, backups, session data,
  uploaded documents, policy documents, financial statements or real user
  profiles** anywhere in the tree or history. No `.env`, `.sqlite`, `.sql`
  dump or `.log` file was ever committed.
- Mobile numbers: only UI placeholders (`98765 43210`) and the dummy in
  P-12. E-mails: a `priya@email.com` placeholder and a regulator's public
  complaints address. Zero Aadhaar/PAN/IFSC/account/DOB/PIN/address matches.
- Sample people in `quizData.ts`, `quiz.service.ts`, `connect.service.ts`
  (advisor names), `AdvisoryConnect.tsx`, `AdvisorBookingFlow.tsx`, the PRD
  persona, prompts and every `*.spec.ts` are generic fictional names with
  scenario-level data only.
- `docs/audit/loadtest/results/*.txt`: ApacheBench against `localhost` only;
  no tokens, ids or phone numbers.
- The six files deleted in commit `391cc1f` contained only question
  definitions.
- Sentry `beforeSend` strips `authorization`/`cookie` headers and
  `otp`/`phone`/`mobile`/`aadhaar`/`aadhaarLast4`/`whatsappNumber` fields.
- The web bundle stores only the JWT, the diagnostic profile and local
  feature state in Web Storage; no third-party script receives any of it
  (CSP `connect-src 'self' https://api…`).

## Synthetic data policy

All demonstration data now lives in `apps/api/src/shared/demo/personas.ts`
and `docs/demo/personas.md`. Every persona is labelled "Demo", uses a
generic name and round numbers, and is reproducible by hand. Contributors
are told in `CONTRIBUTING.md` never to add real personal data; CI gitleaks
and the privacy checklist in `SECURITY.md` back that up.

## Data-protection posture (for the record)

- Anonymous by default; PII (phone) only after OTP verification.
- Granular, append-only consent records (`consent_records`).
- Right to erasure: `DELETE /auth/me` cascades; recommendation audit rows
  retained with PII scrubbed, matching the stated 5-year suitability
  retention.
- Nominee Aadhaar: last four digits only, validated as exactly 4 digits.
- Vault files: private bucket, per-user key prefix, 15-minute signed URLs,
  storage key never returned to clients.
