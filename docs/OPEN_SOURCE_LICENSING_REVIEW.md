# Open-source licensing and IP review

Status: **MIT License applied by the owner on 15 October 2026**
(`LICENSE`, Copyright (c) 2026 Santosh Pathak), and the repository was made
public the same day. Applying the licence is the owner's assertion that they
hold the rights to release the code, brand and content; the ownership
questions in §2 are recorded for the owner's own records and were not
independently verified. This document otherwise stands as the review that
preceded the decision.

## 1. Existing notices

| Item | Finding |
|---|---|
| `LICENSE` file | MIT (added by the owner, 15 Oct 2026) |
| `license` field in all four `package.json` | `MIT` |
| Copyright headers in source | none |
| Third-party notices | none required so far (all dependencies are consumed as packages, not copied in) |

## 2. Ownership questions that must be answered first

| # | Material | Concern | Severity | Recommendation |
|---|---|---|---|---|
| L-1 | **The codebase as a whole** | The repository owner's work e-mail belongs to a life insurer, the removed compliance manual was that insurer's internal document, the PRD targets that insurer's corporate group, and the logo files were exported from that company's design-tool brand account. Depending on the employment contract and when/where the work was done, the employer may own some or all of the IP. | **BLOCKING** | Obtain written confirmation (employer sign-off or counsel opinion) that the author holds the rights to release the code, the brand and the content under an open-source licence. Do not publish before this exists. |
| L-2 | `docs/brand/KIN_Logo.png`, `apps/web/public/*.png`, `favicon.svg`, `masked-icon.svg`, `KinLogo.tsx` | Logo/brand assets; metadata showed they were produced in an employer-owned brand kit. Trademarks are not covered by code licences. | HIGH | Confirm ownership (see L-1). If retained, state in the README that the KIN name and logo are not licensed under the code licence (standard practice) and add a `TRADEMARKS.md` or a README clause. |
| L-3 | `KIN_PRD_v3.md` | Marked "Confidential"; investor-facing. | resolved | Deleted and purged from history on the owner's instruction. |
| L-4 | `docs/brand/KIN_Brand_Guidelines.{md,html}` | Original KIN content (typography, colour, voice). The HTML embeds React development builds (MIT) and six WOFF2 files of **Manrope**. | LOW | Manrope is SIL Open Font License 1.1 — redistribution of the font files is permitted with the OFL notice; add it if the HTML is kept, or keep only the `.md`. |
| L-5 | Fonts in the web app | Manrope loaded from Google Fonts at runtime (not bundled). Brand guidelines mention Inter as a fallback. | NONE | Both OFL 1.1; no bundled font files in `apps/web`. |
| L-6 | Icons `apps/web/src/components/ui/icons.tsx` | Hand-authored SVG set per the brand guidelines; no attribution to an icon library, geometry does not match Lucide/Feather exports. | LOW | Treated as original work; confirm (see L-1). |
| L-7 | Content: `briefData.ts` (news briefs), `quizData.ts`, `discoveryQuestions.ts`, prompts, disclaimers | Original prose summarising public regulatory sources (IRDAI, EPFO, Jan Suraksha, Income Tax), with source links. No copied articles found. | LOW | Keep attributions; confirm no text was lifted verbatim from a paywalled or copyrighted source. |
| L-8 | Insurer names and IRDAI registration numbers in `connect.service.ts` and UI copy (HDFC Life, Star Health, Bajaj Allianz) | Nominative use of third-party trademarks with purchase links; `isUlip: false` and disclaimers present. | LOW | Acceptable as factual reference; do not use their logos. `logoLicenseRef` exists on `partner_configs` for that reason. |
| L-9 | "KIN Engineering Brief v1.4" referenced in many source comments | Internal design document not in the repo. | INFO | References are harmless; the document itself should not be added unless cleared. |
| L-10 | Removed: `Compliance Mannual.pdf`, `KIN_MVP1_PRD_v3.docx` | Third-party / employer confidential. | resolved | Deleted and purged from all local history. |

## 3. Dependency licence compatibility

979 packages: MIT 811, Apache-2.0 58, ISC 57, BSD 37, BlueOak 8,
Unlicense/0BSD/Python-2.0/CC-BY-4.0/CC0 a handful, one package without a
licence field whose README states MIT. **No copyleft (GPL/LGPL/AGPL/SSPL)
and no custom licences.** Any permissive licence for KIN is compatible. The
CC-BY-4.0 entry (`caniuse-lite` data, build-time only) requires no action
for a web build.

## 4. Licence recommendation (made before the owner's decision)

The owner chose **MIT**, which is fully compatible with every dependency
and is the simpler of the two options below. The original recommendation is
kept for the record.

**Apache License 2.0**, because:

- it is permissive, widely understood and compatible with every dependency
  in the tree;
- it carries an explicit **patent grant** and defensive termination, which
  matters for a product in a regulated domain where partners may embed it;
- it has a clear contributor model (a `NOTICE` file and, optionally, a DCO
  or CLA) that makes future partner contributions tractable;
- it does not license trademarks (§6), which lets the owner keep the KIN
  name and logo separate from the code.

MIT would also be acceptable if simplicity is preferred over the patent
language.

### Remaining follow-ups after the MIT decision

1. ~~Add `LICENSE`~~ — done (MIT).
2. ~~Set `"license"` in all four `package.json` files~~ — done (`MIT`).
3. ~~README licence section with the trademark note~~ — done.
4. Add the SIL OFL notice for Manrope if the font files inside
   `docs/brand/KIN_Brand_Guidelines.html` are kept.
5. Optionally adopt the Developer Certificate of Origin (`git commit -s`).
