# Development guide

Read [`../BUILD.md`](../BUILD.md) first: it is the hand-over note with the
current state, known traps and the next action.

## Daily commands

```bash
pnpm dev:local                 # both apps, SQL.js, demo-mode AI
pnpm --filter @kin/api dev:local
pnpm --filter web dev
pnpm test                      # all suites
pnpm --filter @kin/api test -- --watch
pnpm --filter web test -- --watch
pnpm typecheck
pnpm build
pnpm --filter web lint
```

## Demo mode

`apps/api/src/shared/openai/openai.client.ts` decides at first use:

| `KIN_DEMO_MODE` | `OPENAI_API_KEY` | `NODE_ENV` | Result |
|---|---|---|---|
| `true` | any | any | scripted client |
| `false` | missing | any | throws `OPENAI_API_KEY is not set` |
| unset | missing / placeholder | not production | scripted client |
| unset | missing | production | throws (never silently demo in prod) |
| unset | set | any | real OpenAI |

The scripted client (`mock-openai.client.ts`) answers the intake prompt
with a fixed 12-question flow, returns `{}` for extraction, never
escalates, and gives canned advisor replies. `GET /api/v1/health` reports
`demoMode` and the web app renders `DemoBanner` from it. Synthetic
personas and the answer sequences that reproduce them are in
[`demo/personas.md`](demo/personas.md).

## Environment variables

All in `apps/api/.env.example` with comments. Load order:
`.env.local`, then `.env`. Production (`NODE_ENV=production`) asserts that
`JWT_SECRET`, `VAULT_JWT_SECRET`, `DATABASE_URL`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` are set and not placeholders, and warns about
missing Sentry/WhatsApp values, unverified DB TLS and demo mode.

Useful local toggles: `DATABASE_LOG_QUERIES=true` (prints SQL with bound
parameters — contains phone numbers, never use outside your machine),
`MAX_CONVERSATION_TURNS`, `VAULT_RATE_LIMIT_MAX`.

## Database

- Local: SQL.js file, `synchronize: true` (schema follows the entities).
- Postgres: migrations only (`pnpm --filter @kin/api migration:run`);
  `synchronize` is deliberately off. Column-type differences between the
  two drivers are handled in `database/entities/column-types.ts`.
- RLS policies are in migration 002 and `sql/storage-policies.sql`.

## Testing conventions

- API: jest + ts-jest, `*.spec.ts` beside the code. Services are tested
  with hand-rolled fake repositories (`{ findOne, save, … }` objects);
  there is no Nest testing-module boot in unit tests.
- Web: vitest, `*.test.ts` beside the code, `environment: node` (engines
  are pure; no DOM needed).
- Financial engines: every formula change must update
  `docs/financial-methodology.md`, bump the rule version, and update the
  hand-computed persona expectations.
- Security fixes: add a regression test that fails without the fix (see
  `vault.dto.spec.ts`, `lifecycle.controller.spec.ts`).

## Request bodies

Always a class with class-validator decorators. Never an interface,
`Record<string, unknown>` or `Partial<SomeDto>`: TypeScript emits `Object`
for those and the `ValidationPipe` skips validation entirely, which is how
the vault mass-assignment bug happened.

## Logging

Use the Nest `Logger`. Never log phone numbers, OTPs, tokens, names or
request bodies. Mask phones to the last four digits (`maskPhone`), tokens
to an 8-character prefix.

## Linting

`apps/web/eslint.config.js` is an ESLint 9 flat config (typescript-eslint,
react-hooks, react-refresh). `pnpm --filter web lint` runs it over `src/`.
The API has a `lint` script but no ESLint dependency configured yet; adding
one is a known follow-up.

## Adding an API endpoint

1. DTO class with validators in the module (or `*.dto.ts`).
2. Controller method with `@CurrentUser()`; pass `user.sub` to the
   service — never trust ids from the body for ownership.
3. Service loads by `{ id, userId }` or checks `row.userId !== userId`.
4. Spec file with a fake repository covering the happy path and the
   cross-user path.
5. If it is public, add `@Public()` deliberately and say why in a comment.

## Git

Work on a branch, keep commits focused, never commit `.env*` (except
`.env.example`), never add real personal data. CI runs typecheck, tests,
build, a production dependency audit and a full-history gitleaks scan.
