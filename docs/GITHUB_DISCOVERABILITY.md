# GitHub discoverability

Everything here is a recommendation for the repository owner to apply in
GitHub settings. None of it has been applied, and nothing requires the
repository to be public to prepare.

## About description (≤ 160 characters)

> Open-source InsurTech for Indian families: a 2-minute anonymous insurance gap check with an explainable Protection Score and rupee gaps.

(136 characters.)

Alternative, shorter:

> Explainable, anonymous insurance gap check for Indian families. Open-source financial protection intelligence platform.

(119 characters.)

## Topics (max 12, in priority order)

1. `insurtech`
2. `open-source`
3. `financial-planning`
4. `insurance`
5. `personal-finance`
6. `fintech`
7. `financial-protection`
8. `insurance-calculator`
9. `india`
10. `typescript`
11. `react`
12. `nestjs`

All twelve describe the actual project. Not proposed: `ai`/`llm` (the AI
layer is optional and scripted in demo), `pwa` (true but low search value
versus the twelve above), `supabase`/`vercel` (deployment choices, not
product identity).

## Website field

Leave empty. The deploy configs reference `app.kin.ai.in`, but the
repository should not advertise a private pilot deployment; set the field
only when a public demo is intentionally hosted.

## Social preview

Upload `docs/assets/README/social-preview.png` (1280 × 640, rendered from
`social-preview.svg`) under *Settings → General → Social preview*. The
image uses the official Shelter mark in Sand on Navy `#102A43` with the
Teal `#18A999` accent dot and ring, Manrope typeface, no gradients or
effects (brand guidelines §03/§04), legible at the small sizes GitHub uses
in link cards.

## Search terms placed naturally

Title and intro: "Financial Protection Intelligence Platform", "open-source
InsurTech", "insurance gap", "Protection Score". Headings: "How the
protection assessment works", "Demo mode". Feature table: "life, health and
income protection", "hidden coverage", "EDLI, PMSBY, PMJJBY". No term is
repeated for its own sake.

## Promotion checklist (after the owner publishes)

- [x] About description and topics applied (15 Oct 2026).
- [ ] Upload the social preview image in Settings → General.
- [x] `LICENSE` added (MIT).
- [ ] Pin the repository on the owner's profile.
- [ ] Enable *Discussions* for methodology questions; link it from the
      README "Contributing" section once it exists.
- [ ] Create a `v0.1.0` release from `CHANGELOG.md` so the version badge
      has a page behind it.
- [ ] Tag the first few "good first issue" items (API ESLint config,
      desktop screenshots, e2e scaffold).
- [ ] Share with the Indian personal-finance and open-source InsurTech
      communities with the demo-mode one-liner (`pnpm dev:local`) — the
      no-keys demo is the strongest hook.
- [ ] Add the repository to awesome-lists for fintech / insurtech.
