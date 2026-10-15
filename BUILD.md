# BUILD.md — hand-over for the next session

Read this before touching anything. Update it before reporting completion.

## Current state (15 Oct 2026)

- **Pushed on 15 Oct 2026 to a NEW private repository `santoshbpathak/kin`**
  (remote `origin`); `main` was fast-forwarded to the docs branch, so it holds
  the final state. The old repo `santoshbpathak/kin-mvp` (local remote
  `kin-mvp-old`) still has the pre-rewrite history: never push to it, and
  delete or keep it private. The owner makes `kin` public manually.
- Branch **`prep/open-source-release`** (readiness work, one commit per
  logical area) and `docs/readme-overhaul` are both merged into `main`.
- **Local git history was rewritten on 15 Oct 2026** (owner instruction) on
  all six local branches to purge `Compliance Mannual.pdf`,
  `KIN_MVP1_PRD_v3.docx`, `KIN_PRD_v3.md` and employer metadata in the logo
  PNGs. The GitHub remote still has the OLD history (`origin/main` =
  `70aae42`); publish only from this clone (new repo recommended). A
  pre-rewrite backup bundle is at
  `/Users/santoshpathak/Projects/KIN-history-backup-before-rewrite.bundle`
  — keep it private, never commit it.
- Branch **`docs/readme-overhaul`** (from the prep branch) carries the README
  overhaul: banner/social assets, nine demo screenshots + GIF under
  `docs/assets/README/`, fact check, discoverability guide, review report,
  issue/PR templates, and the `apps/api` `start` script fix (`dist/src/main`).
- `OPEN_SOURCE_READINESS_REPORT.md` verdict: **READY (security & privacy)**,
  subject to the owner's legal sign-off on IP ownership before a LICENSE is
  added.
- Verified green at the end of the session: typecheck ×3 ✓ · API jest
  **114/114 (12 suites)** ✓ · web vitest **26/26 (3 suites)** ✓ · `pnpm build` ✓ ·
  web lint **0 errors / 6 warnings** ✓ · gitleaks history+tree 0 leaks ✓ ·
  `pnpm audit --prod` **0 critical / 0 high / 6 moderate** ✓.
- Demo mode works end to end with no keys (`pnpm dev:local`): health reports
  `demoMode:true`, 12-turn scripted diagnostic persists a profile, score and
  recommendations render, web shows the amber "Demo mode" ribbon.
- Deliberately unfinished: API has a `lint` script but no ESLint config;
  `test:e2e` references a missing `test/` folder (pre-existing); README
  screenshots are placeholders; no `LICENSE` (pending ownership).

## Module map

| Path | Responsibility |
|---|---|
| `apps/api/src/config/configuration.ts` | every env var, production assertions + warnings |
| `apps/api/src/app.module.ts` | DB options (SQL.js vs Postgres, TLS switch, quiet dev logging), throttler, global JWT guard |
| `apps/api/src/common/` | guards (JWT, vault), exception filter, request-id, Sentry |
| `apps/api/src/modules/auth` | anonymous session, OTP (hashed, single-use, throttled), vault token, erasure |
| `apps/api/src/modules/vault` | documents/nominees/unlock; `vault.dto.ts` is the validated body contract; services whitelist columns |
| `apps/api/src/modules/lifecycle` | notification prefs; WhatsApp webhook (`webhook-signature.ts` = HMAC + constant-time compare) |
| `apps/api/src/modules/diagnostic` | intake agent (LLM), mapper, city tiers; turn cap |
| `apps/api/src/modules/score`, `trust`, `discovery` | server engines + immutable audit rows |
| `apps/api/src/modules/connect` | AI advisor tiers, bookings, partner list |
| `apps/api/src/modules/health` | public liveness + `demoMode` |
| `apps/api/src/shared/openai` | `openai.client.ts` (real/demo switch), `mock-openai.client.ts` (scripted LLM) |
| `apps/api/src/shared/compliance` | regex guard on every AI message |
| `apps/api/src/shared/demo/personas.ts` | synthetic fixtures with hand-computed expectations |
| `apps/web/src/modules/score/scoreEngine.ts` | **authoritative** client score engine (+ `sanitiseProfile`) |
| `apps/web/src/modules/trust/recommendationEngine.ts` | client recommendations ("See the Math") |
| `apps/web/src/lib/apiClient.ts` | fetch wrapper, anonymous-session bootstrap |
| `apps/web/src/components/DemoBanner.tsx` | ribbon driven by `/health` |
| `docs/security/01–05`, `docs/financial-methodology.md`, `docs/OPEN_SOURCE_LICENSING_REVIEW.md` | the audit series |
| `.github/workflows/ci.yml`, `.gitleaks.toml` | CI: typecheck, test, build, prod audit, secrets scan |

## Golden numbers (verified, do not re-derive)

- Persona B (server engine): life **33.3**, health **13.0**, income **0**,
  composite **17.9**, "Critical Risk". Persona A: 0 / 9.3 / 0 → **3.3**.
  Persona C: 100 / 11.1 / 50 → **56.4** "Moderate Gap".
- Web persona W1 → **25** (`critical`), W2 → **22** (`critical`), EDLI hidden
  cover ₹7,00,000.
- Composite weights 0.40 / 0.35 / 0.25; bands ≤30 / ≤55 / ≤75 / ≤90.
- Server obligation band = first integer × 1000/month (`lt_15k` = `15_40k` = ₹15k).
- Demo intake = **12 steps** (`DEMO_INTAKE_STEPS`), amounts parse `50 lakh`,
  `1 crore`, `5L`, `50k`; bare number < 10,000 is lakhs.
- Nest ValidationPipe skips `Object` metatypes (`toValidate` in
  `validation.pipe.js:104-111`) — this is why `Partial<Dto>` bodies are unsafe.
- Dependency baseline before this branch: 122 advisories (4C/62H), prod 70 (2C/33H).

## Traps (each cost real time)

1. **`Partial<Dto>` / interface request bodies bypass validation entirely.**
   Symptom: `forbidNonWhitelisted` has no effect. Cause: TS emits `Object`.
   Fix: concrete DTO classes (`vault.dto.ts`) + service allow-lists.
2. **Unbounded `pnpm.overrides` (`>=x`) jump majors.** Symptom: ESLint died
   with `expand is not a function` because `minimatch@3` got
   `brace-expansion@5`. Fix: every override is `name@<major>: ^patched`.
   Also: `pnpm update <transitive>` does NOT move Nest/Jest-pinned packages.
3. **Parallel Bash calls share one shell cwd.** A `cd apps/web` in one call
   made three heredoc writes in another land in the wrong place silently.
   Use absolute paths; never `cd` into a sub-dir in a parallel call.
4. **`uuid@9` ships no types.** Removing the deprecated `@types/uuid` stub
   broke typecheck; replaced with `crypto.randomUUID()` (no types needed).
5. **`vitest@4` needs Vite ≥ 6**; Vite 5 is pinned by `vite-plugin-pwa@0.20`.
   Stay on vitest 3 until the Vite 6 tooling PR.
6. **`as const` arrays fail TypeORM's `LoggerOptions`** (mutable array type);
   declare `const x: LoggerOptions = [...]`.
7. **Nest build output is `apps/api/dist/src/main.js`**, not `dist/main.js`
   (tsconfig includes `api/**` so rootDir is the package).
8. **TypeORM dev query logging prints bound params (phone numbers).** Now
   opt-in via `DATABASE_LOG_QUERIES=true`.
9. **Demo mode auto-activates** outside production when the key is missing or
   `sk-REPLACE_ME`; `KIN_DEMO_MODE=false` forces the real client. Production
   never auto-demos.
10. **Conditional hooks after an early return** in `RecommendationsPage`
    were harmless at runtime (profile is constant) but failed lint; the early
    return now sits after the last hook and `score` is captured as `s`
    inside the async closure for narrowing.
11. **Dev servers hold ports across turns.** Kill by port
    (`lsof -tnP -iTCP:3001 -sTCP:LISTEN`) before `pnpm build`, which shares
    `apps/api/dist` with `nest start --watch`.

## Working agreements

- Formulas are never changed silently: methodology doc + rule version +
  persona expectations move together.
- Security fixes ship with a failing-then-passing regression test.
- No real personal data, ever; personas are the only sample data.
- Verification before claiming done: `pnpm typecheck && pnpm test && pnpm build
  && pnpm --filter web lint && gitleaks dir . --redact`.
- Do not push, publish, rewrite history or touch production without an
  explicit instruction from the owner.

## Next action

Owner: confirm IP ownership → add `LICENSE` (Apache-2.0) + `NOTICE` →
create the new public repository and push these branches from this clone.
Then the single most useful engineering task is **unifying the client and
server score/recommendation engines** into one shared, tested package
(`docs/financial-methodology.md` §8.1).
