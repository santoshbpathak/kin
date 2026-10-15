# Installation

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | ≥ 20 (tested on 24) | |
| pnpm | 9.12 | pinned via `packageManager`; `corepack enable` installs it automatically |
| Git | any | |

No database server, Docker, or API keys are needed for the default
(demo) setup.

## 1. Clone and install

```bash
git clone <your-fork-or-the-repo-url> kin
cd kin
corepack enable          # optional, picks up pnpm 9.12 from package.json
pnpm install --frozen-lockfile
```

Install scripts are allow-listed (`pnpm.onlyBuiltDependencies`); only
`esbuild` is permitted to run one.

## 2. Run in demo mode (no keys)

```bash
pnpm dev:local
```

- Web: http://localhost:5173
- API: http://localhost:3001/api/v1 (health: `/api/v1/health`)
- Swagger: http://localhost:3001/api/docs

`dev:local` sets `DATABASE_DRIVER=sqljs`, which stores everything in
`apps/api/kin-local.sqlite` (gitignored). With no `OPENAI_API_KEY` the API
starts in **demo mode**: the diagnostic chat and the AI advisor are driven
by a deterministic script, nothing is sent to any third party, and the web
app shows a "Demo mode" ribbon. Local OTPs are printed to the API console
(phone masked).

Try it: open the web app, tap **Check my Protection Score**, choose
**Skip – stay anonymous**, and answer the 12 scripted questions. Amounts
can be typed as `50 lakh`, `₹1 crore`, `5L` or `None`.

## 3. Verify your setup

```bash
pnpm typecheck     # all workspaces
pnpm test          # jest (API) + vitest (web)
pnpm build         # shared-types, web, api
```

## 4. Optional: real services

Copy `apps/api/.env.example` to `apps/api/.env` and fill in what you need:

| Want | Set |
|---|---|
| Real GPT-4o diagnostic / advisor | `OPENAI_API_KEY`, optionally `KIN_DEMO_MODE=false` |
| PostgreSQL instead of SQL.js | `DATABASE_DRIVER=postgres`, `DATABASE_URL`, run `pnpm --filter @kin/api migration:run`, then `pnpm dev` |
| Vault file uploads | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, bucket per `apps/api/sql/storage-policies.sql` |
| WhatsApp OTP delivery and nudges | `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` |
| Error reporting | `SENTRY_DSN` |

Generate the two JWT secrets with `./scripts/generate-secrets.sh`. The API
refuses to start in production with placeholder secrets.

Deployment to Vercel + Supabase is described step by step in
[`../DEPLOYMENT.md`](../DEPLOYMENT.md).

## Troubleshooting

- **Port already in use** — something else is on 5173/3001; stop it or set
  `PORT`.
- **"OPENAI_API_KEY is not set"** in production — demo mode never
  activates in production; set the key or explicitly `KIN_DEMO_MODE=true`
  for a public demo deployment.
- **Vault routes return 403 "requires a verified phone number"** — mint a
  vault token only after completing the OTP flow (sandbox OTP is in the
  API log).
- **Lint fails** — see `docs/development.md`.
