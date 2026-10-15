# README review report

Branch `docs/readme-overhaul` (from `prep/open-source-release`), 15 October
2026, merged into `main` and pushed to the new public repository `santoshbpathak/kin`.

## 1. Modifications

| File | Change |
|---|---|
| `README.md` | Rewritten: banner, positioning, truthful badges, problem statement, GIF + four screenshots, feature table, methodology summary, Mermaid architecture, verified stack, tested quick start, demo mode, configuration table, tests, security, roadmap split into implemented / planned, contributing links, disclaimer, licence status, maintainer credit. |
| `docs/README_v1_backup.md` | The previous README, preserved. |
| `docs/assets/README/` | `kin-banner.svg` + `.png` (1200 × 300), `social-preview.svg` + `.png` (1280 × 640), nine phone-viewport screenshots (390 × 844 @2×) from demo mode, `demo-diagnostic.gif` (25 frames, 0.8 MB). |
| `docs/README_FACT_CHECK.md` | Claim-by-claim evidence, claims deliberately not made, unverified items, missing assets, documentation gaps. |
| `docs/GITHUB_DISCOVERABILITY.md` | About description (136 chars), 12 topics, website guidance, social preview instructions, promotion checklist. |
| `.github/ISSUE_TEMPLATE/` | Bug report, financial-methodology question, feature request (YAML forms) + `config.yml` pointing security reports to private advisories. |
| `.github/PULL_REQUEST_TEMPLATE.md` | Checklist including the three mandatory items for any formula change. |
| `CONTRIBUTING.md` | Points at the new templates. |
| `apps/api/package.json` | `start` script corrected from `node dist/main` to `node dist/src/main` (Nest emits `dist/src/main.js`); the README's production start instruction would otherwise be false. No application logic changed. |

Reviewed and left as they were (accurate after the readiness work):
`SECURITY.md`, `CODE_OF_CONDUCT.md`, `docs/architecture.md`,
`docs/installation.md`, `docs/development.md`,
`docs/financial-methodology.md`.

## 2. Validations performed

| Check | Result |
|---|---|
| Relative links and image paths in README and 20 docs | 45 checked, 0 broken |
| README in-page anchors | 3 checked, all resolve |
| Code fences balanced | yes |
| Every `pnpm …` command in the README is a real script | `install`, `dev:local`, `typecheck`, `test`, `build`, `--filter web lint` — all exist |
| Screenshots correspond to real behaviour | Captured with headless Chromium from `pnpm dev:local` in demo mode; the GIF is a frame sequence of the same session |
| Badge targets | Static shields (no link) for version/stack/licence; CI badge links to the workflow page, which exists once the branch is on GitHub |
| Sensitive content in docs and assets | Regex sweep (employer names, personal e-mail, phone numbers, key formats) over all docs: none; gitleaks over `docs/` and `README.md`: no findings in the repository (only the gitignored local tool file) |
| Feature claims backed by code | Each row of the feature table cites files; see the fact check |
| Testing and deployment claims | Test commands run on this machine (114 API + 26 web passing, build green); deployment described only as "Vercel configs exist" and linked to `DEPLOYMENT.md`, with no live URL claimed |
| Markdown rendering | Structure validated (fences, headings, tables, HTML `<table>` and `<p align>` are GitHub-supported); Mermaid uses standard `flowchart LR` syntax but was not rendered by a GitHub renderer here |

## 3. Unresolved gaps

- The CI badge is live and green on `santoshbpathak/kin`.
- Mermaid rendering was not visually confirmed on GitHub.
- No desktop-width screenshots and no MP4 (GIF only).
- `apps/api` still has no ESLint configuration; `test:e2e` still references a missing folder.
- Discussions link omitted from the README because Discussions are not enabled on the repository.

## 4. Actions requiring the owner

1. ~~Licence~~ — MIT applied by the owner; badge, manifests and docs updated.
2. ~~Publish~~ — done; `santoshbpathak/kin` is public and CI is green.
3. Upload the social preview image (`docs/assets/README/social-preview.png`) in repository settings; the About description and topics are already applied.
4. Optionally enable Discussions and add the link under "Contributing".
5. Review the banner and social preview for brand approval; both are derived from the brand guidelines' palette and the existing mark.
