# 05 — Dependency and supply-chain audit

Tooling: `pnpm audit` (full and `--prod`), `pnpm outdated -r`, `pnpm
licenses list`, lockfile inspection, `npm view … deprecated` for every
direct dependency, source greps for unused packages, review of install
scripts and of `apps/web/.npmrc` / `.pnpmfile.cjs`. Raw outputs are not
committed.

## 1. Before / after

| Graph | Before (2026-10-15 morning) | After this branch |
|---|---|---|
| All (incl. dev) | 122 findings: **4 critical / 62 high / 49 moderate / 7 low** | 23 findings: 2 critical / 4 high / 14 moderate / 3 low — all dev-time tooling (§3) |
| Production only | 70 findings: **2 critical / 33 high / 33 moderate / 2 low** | **0 critical / 0 high / 6 moderate / 0 low** |

Direct dependencies: 57 → 51. Transitive: ~1,066. Lockfile `v9.0`,
registry-only, every entry `sha512`-pinned, consistent with the manifests
(`pnpm install --frozen-lockfile` is what CI runs).

## 2. Changes applied (all semver-compatible or removals)

| Change | Why |
|---|---|
| Removed `bcrypt`, `@types/bcrypt` (api) | Never imported. Eliminated the only native install script with network access and the entire `tar@6` chain (1 critical + 8 high). |
| Removed `uuid`, `@types/uuid` (api); replaced `uuid.v4()` with `node:crypto.randomUUID()` in 8 files | `uuid@9` ships no types (the `@types` stub was deprecated) and carries a moderate advisory fixed only in v11. Zero behaviour change. |
| Removed `zustand`, `workbox-window` (web) | Never imported; `vite-plugin-pwa` registers its own worker. |
| Deleted `apps/web/.npmrc`, `apps/web/.pnpmfile.cjs` | Dead config: pnpm reads neither from a sub-package; a pnpmfile is arbitrary install-time code and should not exist unused. |
| Root `packageManager: pnpm@9.12.0` | Lets Corepack/CI pin the exact pnpm. |
| Root `pnpm.onlyBuiltDependencies: ["esbuild"]` | Unknown packages can no longer run install scripts. |
| Root `pnpm.overrides` (same-major `>=` ranges) | Direct `pnpm update` cannot move transitive packages pinned by NestJS 10 / Jest / Nest CLI. Overrides lift `proxy-addr`, `handlebars`, `brace-expansion` (1/2/5), `browserslist`, `baseline-browser-mapping`, `fast-uri`, `nanoid@3`, `postcss`, `source-map-js`, `js-yaml` (3/4), `lodash`, `picomatch@4`, `ajv@8`, `body-parser@1`, `postcss-selector-parser@6`, `@babel/core`, `@babel/plugin-transform-modules-systemjs`, `@humanfs/node`, `multer@2`, `qs@6`, `glob@10` to their patched versions. See the override lesson below. |
| `typeorm` 0.3.30 → 0.3.31 | CVE-2026-73651. |
| `@sentry/node` 10.53 → 10.76 | Drops the vulnerable OpenTelemetry instrumentation packages; `sentry.ts` compiles and the dynamic `require` path is unchanged. |
| `react-router-dom` 6.30.3 → 6.30.6 | Two of four router advisories (the other two need v7). |
| `vitest` added at ^3.2.6 (web dev) | Needed for the new engine tests; 3.2.6+ clears the vitest advisory itself. |

After every change: `pnpm -r typecheck`, `pnpm test` and `pnpm build` were
re-run and pass; the built API was exercised over HTTP (see
`04-application-security.md` §4), which covers the Express/multer/qs/
body-parser overrides on the real request path.

**Override lesson.** A first pass used unbounded `>=x.y.z` ranges; pnpm
resolved several of them to a *newer major* (for example `minimatch@3`
received `brace-expansion@5`, which broke ESLint with `expand is not a
function`). Every override is therefore written as `name@<major>:
^patched` so a consumer can only move within its own major. Verified after
the fix: `minimatch@3` → `brace-expansion@1.1.21`, lint, tests and build
all pass.

## 3. Unresolved advisories

### Production graph (6 moderate — all require a major-version migration)

| Package | Advisory | Fixed in | Why not applied |
|---|---|---|---|
| `@nestjs/core` 10.4.22 | GHSA-36xv-jgw5-4q75 | 11.1.18 | NestJS 10 → 11/12 migration (all `@nestjs/*` together). Scheduled, not automatic. |
| `file-type` 20.4.1 (pinned by `@nestjs/common`) | GHSA-5v7r-6r5c-r473, GHSA-j47w-4g3g-c36v | 21.3.2 | Major bump of a Nest-pinned package; goes away with Nest 11+. KIN never calls `file-type` (no multipart uploads reach the API). |
| `react-router` 6.30.6 | GHSA-wrjc-x8rr-h8h6, GHSA-337j-9hxr-rhxg | 7.18.0 | React Router 7 changes the data-router API; 16 files import it. |
| `uuid` 9.0.1 (pinned by `@nestjs/typeorm`) | GHSA-w5hq-g745-h8pq | 11.1.1 | Transitive only; KIN no longer imports `uuid`. Goes away with Nest 11+. |

### Development / build tooling only (not shipped)

| Package | Severity | Fixed in | Why not applied |
|---|---|---|---|
| `tinypool` 1.1.1 (via vitest 3) | critical ×2 | 2.1.2 (vitest 4) | vitest 4 requires Vite ≥ 6; Vite 5 is pinned by `vite-plugin-pwa@0.20`. Test runner only. |
| `vite` 5.4.21, `esbuild` 0.21.5 | high / moderate | vite 6.4.3 | Dev-server-only issues; Vite 6 + `vite-plugin-pwa` ≥ 0.21 is a coordinated major bump. |
| `js-yaml` 4.1.1 under `jest` | high ×3 / moderate | 4.3.2 | The `js-yaml@4` override did not reach jest's nested copy; jest 30 resolves it. |
| `braces` 3.0.3 | high | **no patched release** | Everywhere via chokidar/micromatch; monitor. |
| `serialize-javascript` 6.0.2 (workbox terser plugin) | high / moderate | 7.0.5 | Major bump inside `vite-plugin-pwa`'s build chain. |
| `tmp` 0.0.33 (Nest CLI inquirer) | high | 0.2.6 | 0.x major; CLI only. |
| `@vitest/mocker`, `vitest` 3.2.7 | moderate | 4.1.11 | as `tinypool`. |

## 4. Deprecated / stale direct dependencies

- No remaining direct dependency is deprecated on the registry.
- NestJS 10.4.22 is the **last 10.x**; every Nest-pinned transitive
  issue above is only fully resolved by moving to Nest 11 or 12.
- `@types/node@20` while running Node 24 — harmless, but align when
  bumping.
- `passport@0.7` pulls `pause@0.0.1`, which has no `license` field in its
  manifest (README says MIT). Tolerated.
- ESLint 9 is installed but had no flat config; one is added on this
  branch (web lint: 0 errors).

## 5. Licences

979 unique packages: MIT 811, Apache-2.0 58, ISC 57, BSD-3-Clause 22,
BSD-2-Clause 15, BlueOak-1.0.0 8, Unlicense 2, 0BSD 1, Python-2.0 1,
CC-BY-4.0 1, `(MIT OR CC0-1.0)` 1, `(MIT AND BSD-3-Clause)` 1, unknown 1
(`pause`, see above). **No GPL, LGPL, AGPL, SSPL or custom licences.**
All compatible with an Apache-2.0 or MIT release of KIN.

## 6. Build reproducibility

Frozen lockfile, pinned package manager, registry-only sources, install
scripts allow-listed. Remaining gap: no `minimum-release-age` (pnpm 10
feature) and no SBOM generation; both are reasonable follow-ups.

## 7. Recommended next steps (not applied)

1. Plan the NestJS 10 → 12 migration; it clears every remaining
   production advisory except React Router.
2. React Router 6 → 7 when the UI is next touched broadly.
3. Vite 6 + `vite-plugin-pwa` ≥ 0.21 + vitest 4 as one tooling PR.
4. Jest 30 (removes the nested `js-yaml`/`sprintf-js` chain).
5. Re-run `pnpm audit --prod --audit-level high` in CI (already wired) and
   `pnpm audit` monthly for dev tooling.
