## What and why

<!-- One paragraph. Link the issue if there is one. -->

## Type of change

- [ ] Bug fix
- [ ] Feature
- [ ] Financial methodology change (requires the three items below)
- [ ] Security fix (requires a regression test)
- [ ] Docs / tooling only

## Checklist

- [ ] `pnpm typecheck && pnpm test && pnpm build` pass locally
- [ ] `pnpm --filter web lint` reports no errors
- [ ] No real personal data, secrets or confidential material added (synthetic personas only)
- [ ] Request bodies are validated DTO classes; ownership checks use the JWT user id
- [ ] Logs do not print phone numbers, OTPs, tokens or names

### If a formula, constant, threshold or rounding rule changed

- [ ] `docs/financial-methodology.md` updated
- [ ] Rule version bumped (`RULE_VERSION`, `REC_RULE_VERSION` or `DISCOVERY_RULE_VERSION`)
- [ ] Hand-computed persona expectations in the engine tests updated, with the arithmetic shown in the PR

## Screenshots

<!-- Demo mode only. -->
