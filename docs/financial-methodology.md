# Financial protection methodology

This document describes exactly how KIN turns a short household profile into
a **Protection Score**, three sub-scores, rupee **gaps**, **recommendations**
and **hidden coverage** findings. It is written so that anyone can reproduce
a result by hand and so that every assumption is visible for review.

> **Important.** KIN is an educational tool. The figures below are
> rules-of-thumb used to give a family a starting point for a conversation.
> They are **not** regulated or personalised financial advice, they are not
> an underwriting assessment, and they have not been reviewed by an actuary
> or a regulator. Insurance decisions should be made with a licensed
> adviser and the product documents.

The formulas in this document are the ones in the code **as found**. The
open-source preparation work did not change any formula or constant; it
added input guards (§7) and tests. Items flagged in §8 are for the
maintainers to review, not changes that were made.

---

## 1. Where the calculations live

| Engine | File | Used by |
|---|---|---|
| Protection Score (client) — **authoritative for the UI** | `apps/web/src/modules/score/scoreEngine.ts` | Score page, recommendations page; result is posted to `POST /score/save` for the audit trail |
| Protection Score (server) | `apps/api/src/modules/score/protection-score.service.ts` | `POST /score/calculate` (available, not used by the web client) |
| Recommendations (client) | `apps/web/src/modules/trust/recommendationEngine.ts` | Recommendations page; each one is logged to `POST /trust/recommendations` with its basis text |
| Recommendations (server) | `apps/api/src/modules/trust/recommendation.service.ts` | server-side flow |
| Hidden coverage discovery (client / server) | `apps/web/src/modules/discovery/discoveryEngine.ts`, `apps/api/src/modules/discovery/discovery-engine.service.ts` | Discovery page / `POST /discovery/evaluate` |
| Conversation → profile mapping | `apps/api/src/modules/diagnostic/mapper/profile-mapper.service.ts` | `POST /diagnostic/complete` |
| Peer benchmark | `apps/api/src/modules/score/peer-benchmark.service.ts` (static table) | `/score/calculate` response |

All engines are pure, deterministic functions of their inputs (the only
non-determinism is a `calculatedAt` timestamp). Rule versions:
`RULE_VERSION = 'v1.0.0'`, `REC_RULE_VERSION = 'v1.0.0'`,
`DISCOVERY_RULE_VERSION = 'v1.0.0'`, stored on every persisted score and
audit row.

---

## 2. Inputs

### 2.1 Client engine (`UserProfile`)

| Field | Values | Notes |
|---|---|---|
| `incomeBand` | `lt_5l`, `5_10l`, `10_20l`, `20_40l`, `gt_40l` | midpoint used unless `actualAnnualIncome` present |
| `monthlyObligationsBand` | `none`, `lt_15k`, `15_40k`, `40_80k`, `gt_80k` | midpoint used unless `actualMonthlyObligations` present |
| `dependantsCount` | integer ≥ 0 | |
| `hasTermLife`, `hasEmployerMediclaim`, `hasPersonalHealth` | booleans | drive "typical" fallbacks |
| `actual*` | rupees, optional | exact figures from the conversational flow |
| `edliEligible` | boolean | PF member → ₹7L hidden cover |

Band midpoints (₹): income `lt_5l` 3,00,000 · `5_10l` 7,50,000 · `10_20l`
15,00,000 · `20_40l` 30,00,000 · `gt_40l` 50,00,000. Obligations `none` 0 ·
`lt_15k` 7,500 · `15_40k` 27,500 · `40_80k` 60,000 · `gt_80k` 1,00,000.

Typical covers when only a yes/no is known: term life **₹50,00,000**;
employer mediclaim **₹5,00,000**; personal health **₹10,00,000**.

### 2.2 Server engine (`ParsedProfile`)

`annualIncomeLakhs` (number, in lakhs), `dependantsCount`,
`monthlyObligationsBand` (free string), `termCoverAmount`,
`healthCoverAmount`, `incomeProtectionAmount` (rupees), plus booleans and
enums (`incomeBand` `lt3l…gt50l`, `cityTier`, `lifeStage`,
`occupationCategory`). Band → lakhs midpoints in the NLP parser: `<3→2`,
`<5→4`, `<10→7.5`, `<20→15`, `<50→35`, else `75`.

---

## 3. Protection Score

### 3.1 Life protection (weight 0.40)

```
recommended_life = 10 × annual_income
current_life     = personal_term_cover + employer_group_term      (client)
                 = termCoverAmount                                 (server)
life_score       = min(100, current_life / recommended_life × 100)
life_gap         = max(0, recommended_life − current_life)
```

Client fallback: if no exact personal figure, `hasTermLife` and no employer
figure → ₹50L typical, else 0. If `recommended_life` is 0 the client scores
**100** ("nothing to protect"); the server scores **0**.

### 3.2 Health protection (weight 0.35)

```
dependant_factor = 1 + 0.1 × dependants          (client, linear, uncapped)
                 = 1.2 if dependants > 0 else 1.0 (server)
recommended_health = 3 × annual_income × dependant_factor
current_health   = 0.70 × employer_mediclaim + personal_health   (client)
                 = 0.70 × healthCoverAmount                       (server: 70 % applied to ALL health cover)
health_score     = min(100, current_health / recommended_health × 100)
health_gap       = max(0, recommended_health − current_health)
```

The 70 % haircut on employer cover reflects job-change risk. Critical
illness cover is collected but **not** used by either engine.

### 3.3 Income protection (weight 0.25)

```
recommended_income = 24 × monthly_obligations
current_income     = income_protection_cover (0 if unknown)
income_score       = current_income / recommended_income × 100, capped 100
```

When `recommended_income` is 0 (no EMIs): client → **100**, server → **50**
("neutral"). Server reads an obligation band as *first integer in the string
× 1000 per month* (so `lt_15k` and `15_40k` both mean ₹15,000); client uses
the midpoints above.

### 3.4 Composite and bands

```
composite = 0.40 × life + 0.35 × health + 0.25 × income
```

Client: computed from unrounded sub-scores, clamped 0–100, rounded to an
integer; sub-scores rounded to integers for display. Server: each sub-score
rounded to 1 decimal first, composite from the rounded values, 1 decimal.

| Composite | Band | Colour (client / server) |
|---|---|---|
| ≤ 30 | Critical Risk | `#EF4444` |
| ≤ 55 | Significant Gap | `#F97316` / `#F59E0B` |
| ≤ 75 | Moderate Gap | `#EAB308` |
| ≤ 90 | Well Protected | `#22C55E` |
| > 90 | Fully Protected | `#14B8A6` |

Hidden coverage (EDLI ₹7L etc.) is reported separately and **never** added
to the composite.

### 3.5 Worked example (persona B, server engine)

Income ₹15L, 3 dependants, obligations `15_40k`, term ₹50L, health ₹10L, no
income protection → life 33.3, health 13.0, income 0, composite **17.9**,
"Critical Risk". Full arithmetic in `docs/demo/personas.md`.

---

## 4. Recommendations

Rule-based, at most five, each with a plain-language `basisText`, a
`formula` string ("See the Math"), an IRDAI/scheme reference and a mandatory
product disclaimer. ULIPs are feature-flagged off (`isUlip: false` on every
recommendation).

| Rule | Client trigger | Server trigger | Need / have |
|---|---|---|---|
| Term life | `life_score < 80` | `lifeSubScore < 70` | need = 10 × income; have = ₹50L if `hasTermLife` else 0 (client, ignores exact figures) |
| Health top-up | `health_score < 75` | `healthSubScore < 60` | need = 3 × income × factor; have = 0.7 × ₹5L if employer mediclaim (client) |
| PMSBY (₹2L accident cover, ₹20/yr) | always | `!hasAccidentCover` | government scheme, no underwriting |
| Income protection | obligations > 0 and `income_score < 50` | — | need = 24 × obligations |
| EDLI awareness (₹7L) | `edliEligible` | `occupationCategory === 'salaried_pf'` | EPFO scheme, zero premium |

`estimatedScoreImpact` (client) is an approximation (e.g. term:
`round(gap / need × 40)`), shown as "could add ~N points"; it is not
re-derived from the engine.

---

## 5. Hidden coverage discovery

Rules map yes/no answers to coverage a household may already hold:

| Coverage | Amount | Condition |
|---|---|---|
| EDLI (EPFO) | ₹7,00,000 | PF member |
| PMSBY | ₹2,00,000 (₹20/yr) | savings account |
| PMJJBY | ₹2,00,000 (₹436/yr) | savings account, age ≤ 50 |
| Employer group term | client: 3 × income (see §8); server: ₹5,00,000 | employer benefits |
| Motor personal accident | ₹15,00,000 | owns vehicle |
| ESI | — | income below the ESI limit |
| Home-loan MRTA, card insurance | amount unknown (0) | has home loan / credit card |
| Server only: IRCTC travel ₹10L, LPG ₹6L, PMJDY ₹2L | | rail travel / LPG / Jan Dhan |

`totalBonusCover` sums eligible items; client counts `active` or
`likely_active` bonus items, server counts anything not `not_applicable`.

---

## 6. Conversation → profile mapping (estimation rules)

When the conversational diagnostic lacks a figure, the mapper may
**estimate**, tagging the field `estimated` in the confidence map that the
UI discloses:

- employer group term unknown and exact income known → `3 × income`;
- employer mediclaim unknown → ₹5,00,000 (applies to all occupations);
- `'<5L'` UI band → internal `3l_5l`; exact ₹ figures map by lakh
  thresholds `<3, <5, <10, <20, <50`;
- conversational obligation bands map `'<10K'→lt_15k`, `'10K-30K'→15_40k`,
  `'30K-50K'→40_80k`, `'50K+'→gt_80k`;
- `edliEligible` is always `false` for conversational users.

---

## 7. Missing and invalid inputs (added on this branch)

Formulas are unchanged; these rules only define what an invalid input
*means*:

| Input | Client engine | Server engine |
|---|---|---|
| Negative, `NaN`, `Infinity` or non-numeric exact figure | treated as **not answered** → band/typical fallback applies | treated as **0** |
| Unknown band string | income/obligations → **₹0** (life/health 100, income 100 on the client) | income → 0 (life/health 0); obligations → 0 (income 50) |
| Invalid dependant count | 0 (fractions are floored) | 0 |
| Any output | never `NaN`, always within 0–100, gaps ≥ 0 | same |

Tested in `scoreEngine.test.ts` (20 cases) and
`protection-score.service.spec.ts` (3 personas + 13 boundary cases): zero
income, zero cover, very high cover, negative/invalid inputs, no
dependants, many dependants, extreme liabilities, missing data, extreme
valid values, rounding, band thresholds, determinism.

---

## 8. Assumptions and divergences flagged for review

These are **observations**, not changes. Each is a maintainer decision.

1. **Three implementations disagree.** Client vs server engines differ in
   band enums and midpoints (`20_40l`→₹30L vs `20l_50l`→₹35L; `gt_40l`→₹50L
   vs `gt50l`→₹75L), dependant factor (linear vs flat 1.2), haircut scope
   (employer-only vs all health), zero-income/zero-EMI semantics (100 vs
   0/50), rounding, and the obligation-band parser. The client
   recommendation engine additionally re-derives "have" from typical
   amounts and ignores exact figures, so "See the Math" can show ₹50L for a
   user who entered ₹35L. Recommendation thresholds also differ (80/75
   client vs 70/60 server). Pick one engine as the source of truth and
   share it via `packages/shared-types` or a shared package.
2. Flat **10 × income** for life cover ignores age, years to retirement,
   liabilities, existing assets and inflation; **3 × income** for health
   ignores city medical costs; **24 months of EMIs** replaces no salary.
   There is no Human Life Value, present-value or inflation calculation
   anywhere.
3. Client dependant factor is unbounded (10 dependants → ×2.0).
4. Employer group term counts 1:1 toward life need and is *estimated* at
   3 × income when unknown, which then flips `hasTermLife` to true.
5. Unknown employer mediclaim defaults to ₹5L for everyone, including the
   self-employed.
6. Zero EMIs gives 25 "free" composite points on the client (income axis
   100); zero income gives 100 on life and health on the client.
7. Critical illness cover is collected but never scored; PMSBY "+3 points"
   in the UI is not reflected by any engine.
8. `lt3l` and `3l_5l` both collapse to the ₹3L legacy midpoint.
9. Server `parseObligationBand` reads `lt_15k` and `15_40k` identically.
10. Client discovery `incomeMap` keys (`under_3l`, `3_6l`, …) do not match
    `UserProfile.incomeBand`, so group-term estimates fall to the default
    for most bands; PMSBY/PMJJBY are never counted in the bonus total.
11. Three different city-tier lists exist (web parser, API constants, NLP
    parser) with conflicting assignments for several cities.
12. Peer benchmark values are a static table (API) and hard-coded chips
    (web), not derived from data.
13. Band boundaries use `≤`, so a server composite of exactly 30.0 is
    "Critical" and 30.1 is "Significant".

---

## 9. Currency and units

All engines work in **Indian rupees as plain numbers**; no currency
conversion exists. `annualIncomeLakhs` is the only input expressed in
lakhs (× 1,00,000 internally). Display formatting uses `L`/`Cr`
abbreviations (`fmt()` helpers), with two slightly different helpers in
the client (score vs recommendations).
