# Contributing to KIN

Thanks for taking the time. KIN is a financial protection intelligence
platform; changes here can affect what a family believes about their own
safety net, so we hold a few things to a higher bar than a typical web app.

## Before you start

1. Read [`BUILD.md`](BUILD.md) — the current state, the traps, and the next
   action. It is the hand-over document for every session.
2. Read [`docs/financial-methodology.md`](docs/financial-methodology.md)
   before touching anything under `score/`, `trust/` or `discovery/`.
3. Run the project locally in demo mode (see below). No API keys needed.

## Local setup

```bash
pnpm install          # pnpm 9 is pinned via "packageManager"
pnpm dev:local        # web on :5173, API on :3001, SQL.js database, demo-mode AI
pnpm test             # jest (API) + vitest (web)
pnpm typecheck
pnpm build
```

See [`docs/development.md`](docs/development.md) for the full walkthrough,
including how to point the API at a real Postgres or a real OpenAI key.

## Ground rules

- **Never commit real personal data.** Not in tests, fixtures, screenshots,
  docs or commit messages. Use the synthetic personas in
  [`docs/demo/personas.md`](docs/demo/personas.md).
- **Never commit secrets.** `.env` files are ignored; `.env.example` holds
  placeholders only. CI runs gitleaks on every push.
- **Financial formulas are not changed silently.** If a change alters any
  score, gap or recommendation output, it must (a) update
  `docs/financial-methodology.md`, (b) bump the relevant `RULE_VERSION`,
  and (c) update the hand-computed expectations in the engine tests.
- **Security-sensitive code needs a regression test.** Anything that touches
  auth, authorization, validation, webhooks, logging of user data, or the
  vault must come with a test that fails without the fix.
- **Request bodies are classes, not interfaces or `Partial<>` types.** The
  global validation pipe can only whitelist fields it can see.
- **Logs never contain phone numbers, OTPs, tokens or names.** Mask to the
  last four digits or a short hash prefix.

## Workflow

1. Fork and branch from `main` (`feat/…`, `fix/…`, `docs/…`).
2. Keep pull requests focused. One behaviour change per PR.
3. Make sure `pnpm typecheck && pnpm test && pnpm build` pass locally.
4. Describe *what changed and why* in the PR. If it touches a formula, show
   a before/after for one of the demo personas.
5. A maintainer will review. Expect questions about edge cases; that is
   normal here.

## Style

- TypeScript strict mode, no `any` unless justified in a comment.
- Two-space indentation, no semicolons (match the surrounding file).
- Prefer small pure functions for anything that calculates money.
- Comments explain *why*, not *what*.

## Reporting bugs and proposing features

Open a GitHub issue. For anything security related, do **not** open an
issue — follow [`SECURITY.md`](SECURITY.md).

## Licence of contributions

The project licence is still being finalised (see
`docs/OPEN_SOURCE_LICENSING_REVIEW.md`). Until a `LICENSE` file is added,
contributions are accepted on the understanding that they will be released
under the licence the maintainers adopt, which is expected to be
Apache-2.0.
