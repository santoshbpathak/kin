# Demo personas (synthetic)

Every persona below is **fictional**. Names are generic, every label says
"Demo", and the numbers are round so you can reproduce the scores by hand
with the formulas in [`../financial-methodology.md`](../financial-methodology.md).
None of this describes a real person, and nothing in this repository may.

They are used in two places:

- `apps/api/src/shared/demo/personas.ts` — fixtures for the server-side
  engine tests (`protection-score.service.spec.ts`).
- `apps/web/src/modules/score/scoreEngine.test.ts` — equivalent fixtures
  for the client-side engine, which is the one the UI actually uses.

## Server-side engine personas (`ParsedProfile`)

| Persona | Income (₹/yr) | Dependants | Obligation band | Term cover | Health cover | Income protection | Expected composite | Band |
|---|---|---|---|---|---|---|---|---|
| **A — early-career, single, Tier 1** | 7.5 L | 0 | `lt_15k` (₹15K/mo) | 0 | 3 L (employer) | 0 | **3.3** | Critical Risk |
| **B — married with kids, mid income, Tier 2** | 15 L | 3 | `15_40k` (₹15K/mo*) | 50 L | 10 L | 0 | **17.9** | Critical Risk |
| **C — well-protected, no EMIs** | 35 L | 2 | `none` | 4 Cr | 20 L | 0 | **56.4** | Moderate Gap |

\* The server engine reads an obligation band as "first number × 1000 per
month", so `15_40k` and `lt_15k` are both ₹15,000. This is a documented
quirk, not a feature.

### Worked example — persona B

```
annual income        = 15 L × 100,000            = ₹1,500,000
life:    recommended = 10 × income                = ₹15,000,000
         score       = 5,000,000 / 15,000,000     = 33.3
health:  factor      = 1.2 (has dependants)
         recommended = 3 × income × 1.2           = ₹5,400,000
         effective   = 0.70 × 1,000,000           = ₹700,000
         score       = 700,000 / 5,400,000        = 13.0
income:  monthly     = 15,000 ; recommended = ×24 = ₹360,000
         score       = 0 / 360,000                = 0
composite = 33.3×0.40 + 13.0×0.35 + 0×0.25        = 17.9  → Critical Risk
```

## Client-side engine personas (`UserProfile`)

| Persona | Band inputs | Declared cover | Expected composite | Band |
|---|---|---|---|---|
| **W1 — single, under ₹5L, no EMIs, no cover** | `lt_5l`, `none`, 0 dependants | none | **25** (income axis is neutral-100 when there are no EMIs) | critical |
| **W2 — married with kids, ₹10–20L, ₹15–40K EMIs** | `10_20l`, `15_40k`, 2 dependants | term + employer mediclaim + personal health (typical amounts) | **22** | critical |

### Worked example — persona W2

```
annual income     = midpoint of 10_20l            = ₹1,500,000
monthly EMIs      = midpoint of 15_40k            = ₹27,500
life:    current  = typical term ₹50L + employer 0 = ₹5,000,000 ; recommended ₹15,000,000 → 33.3
health:  factor   = 1 + 2×0.1 = 1.2 ; recommended = 1,500,000×3×1.2 = ₹5,400,000
         current  = 500,000×0.70 + 1,000,000      = ₹1,350,000 → 25.0
income:  recommended = 27,500 × 24                = ₹660,000 ; current 0 → 0
composite = 33.3×0.40 + 25×0.35 + 0×0.25          = 22.1 → 22 → critical
```

## Using personas in the demo-mode chat

In demo mode the diagnostic agent follows a fixed 12-question script. These
answer sequences reproduce the personas end to end:

- **Persona B:** `Married with kids` → `3` → `₹10–20L` → `Self-employed` →
  `Jaipur` → `₹10K–30K` → `50 lakh` → `None` → `10 lakh` → `None` → `Skip` →
  `None`
- **Persona A:** `Single` → `0` → `₹5–10L` → `Salaried` → `Mumbai` →
  `₹10K–30K` → `None` → `None` → `None` → `3 lakh` → `None` → `None`

Amounts can be typed as `50 lakh`, `₹1 crore`, `5L`, `50k` or `5000000`.
`Skip` records the field as declined; `None` records ₹0.
