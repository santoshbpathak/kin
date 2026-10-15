# KIN — project instructions

Read `BUILD.md` before touching anything. It carries the current state, the
golden numbers, the traps that cost real time, and the next action. Update it
at the end of every substantial piece of work.

## Non-negotiables

1. **No real personal data anywhere** — code, tests, fixtures, docs, commit
   messages. Use `docs/demo/personas.md`.
2. **No secrets in the tree.** `.env` is ignored; `.env.example` holds
   placeholders only. gitleaks runs in CI on the full history.
3. **Financial formulas are never changed silently.** Any change to a score,
   gap or recommendation output must update `docs/financial-methodology.md`,
   bump the rule version, and update the hand-computed persona expectations
   in the engine tests.
4. **Request bodies are classes with class-validator decorators.** Never an
   interface, `Record<string, unknown>` or `Partial<Dto>` — the global
   `ValidationPipe` cannot see those and skips validation.
5. **Every by-id read or write checks ownership** against `user.sub` from the
   JWT, never from the body.
6. **Logs never contain phone numbers, OTPs, tokens or names.** Mask to the
   last 4 digits / 8-char prefix.
7. **Security fixes ship with a regression test** that fails without the fix.
8. **Do not push, publish, rewrite history or touch production** without an
   explicit instruction.

## Verification before claiming done

```bash
pnpm typecheck && pnpm test && pnpm build && pnpm --filter web lint
gitleaks dir . --redact
```

## Where to look

- Security posture and open risks: `OPEN_SOURCE_READINESS_REPORT.md`,
  `docs/security/`.
- How the money maths works and what is questionable: `docs/financial-methodology.md`.
- Running without keys (demo mode): `docs/development.md`.
