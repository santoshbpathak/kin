# KIN · Brand & Build Guidelines
**v1.0 · Locked**

> **Single source of truth** for building any KIN screen, deck, page, or partner surface.
> Read sections 01–13 to understand the brand. Hand **Section 14 · AI Handoff Prompt** to any model that will produce work for KIN.

---

## Cover

**Tagline:** Family protection, made visible.

This document is the single source of truth for building any KIN screen, deck, page or partner surface. Read sections 01–13 to understand the brand. Hand Section 14 · AI Handoff Prompt to any model that will produce work for KIN — it contains every guardrail in one paste-ready block.

**Chips:** `v1.0 · locked` · `Mobile-first` · `India · English`

---

## 01 · Identity & Positioning

> **A calm, intelligent guide. Not an insurance app.**

KIN is a family protection intelligence companion for working Indians. It helps users understand how protected their family really is before any product conversation begins. Every artefact must reinforce this — never drift towards marketplace, calculator, or lead form.

### KIN Is
- A protection diagnostic, not a purchase funnel.
- A long-term Protection Vault for the family.
- A transparent calculator that shows the math.
- A privacy-first companion. No phone, no nudging.

### KIN Is Not
- An insurance comparison app.
- A policy marketplace or quote engine.
- A premium calculator with insurer logos.
- A compliance-heavy questionnaire.
- A lead-gen form that ends in a sales call.

### Brand Essence
**Family protection made visible.**

### Tagline (Locked)
**Know your protection. Protect your people.**

### Archetype
| Archetype | Description |
|---|---|
| Guardian | Protects the family's financial interest. |
| Sage | Explains complex protection logic simply. |
| Companion | Stays past the first transaction. |

---

## 02 · Personality & Voice

> **A financially aware elder sibling.**

Speak with the calm authority of someone who understands insurance deeply and explains it without pressure. Warm, clear, never preachy. Never invoke fear, shame, or urgency.

### Personality Traits
| Trait | Meaning |
|---|---|
| Calm | Never panic the user. |
| Clear | No jargon. Plain English. |
| Protective | Family-first, not product-first. |
| Transparent | Always show the math. |
| Respectful | No shame, no fear-selling. |
| Intelligent | Smart enough to guide; simple enough to trust. |

### How KIN Speaks · Examples

> **KIN:** Hi. Let's understand how protected your family really is — in two minutes. No phone, no documents.

> **KIN:** You don't need to buy anything to finish. We'll just show you the gap, and the math behind it.

> **User:** Sounds good.

> **KIN:** One last thing — your answers stay private. No insurer sees them yet. You choose what to share, later.

---

## 03 · Logo System · Shelter

> **A K that is also a roof.**

The Shelter mark is the locked KIN identity. One family of five drawings serves five jobs. Always horizontal, always flat, always paired with the Manrope wordmark unless context says otherwise.

### Approved Marks · Only Two

| Mark | Usage |
|---|---|
| **A · Locked** | Master mark. Use everywhere by default. Min size 24px (mark) / 120px (lockup). |
| **B · Pure** | Auto-swap below 24px. Favicons, in-line glyphs. |

> **⚠️ LOCKED:** Only A · Locked and B · Pure are approved KIN marks. No other variants exist for production use. Any earlier sketches (open peak, monogram, soft) are **retired** and must not be used on any surface.

### Monograms & Avatars — Use Locked as Watermark
KIN does not have a monogram mark. When an avatar, profile circle, or single-letter slot is needed, use **Locked** as a quiet watermark inside the shape — at **16–24% opacity**, centred — with the user's initial or photo on top.

- On a navy circle: Locked rendered in Sand at **18% opacity**.
- On a sand circle: Locked rendered in Navy at **14% opacity**.
- Never use Locked at full opacity inside an avatar.

### Logo Rules
- **Clear space** = 1 dot-height (1d) on all sides. 2d when next to dense type.
- **Colour** — only the locked palette. Body is Navy or Sand. Accent dot is always Teal.
- **Orientation** — always horizontal. Never tilt, never animate the mark.
- **Effects** — flat at all times. No shadow, no gradient, no glow.
- **Co-brand** — KIN sits left of a hairline divider, partner logo right, both at equal cap-height.

---

## 04 · Colour System

> **Warm, intelligent, restrained.**

Sand is the canvas. Navy is the voice. Teal is the action. Everything else is a state, not a decoration.

### Colour Palette

| Token | Hex | Role |
|---|---|---|
| **Sand · background** | `#F7F2EA` | Default app background. Warmth. |
| **Navy · primary ink** | `#102A43` | Titles, brand body, headers. |
| **Slate · body ink** | `#263238` | Body copy on light surfaces. |
| **Muted · tertiary** | `#6B7280` | Helper text, captions, eyebrows. |
| **Teal · primary action** | `#18A999` | CTAs, accent dot, focus. |
| **Teal Deep** | `#0F8676` | Pressed/hover action. |
| **Mint · positive** | `#DDF7EF` | Positive state surface only. |
| **Amber · moderate gap** | `#F5A623` | Moderate protection gaps. |
| **Coral · critical gap** | `#E85D5A` | Serious risk only. **Never decorative.** |
| **Hairline** | `rgba(38,50,56,0.08)` | Dividers, subtle borders. |
| **Hairline Strong** | `rgba(38,50,56,0.16)` | Input borders, strong dividers. |
| **Scrim** | `rgba(16,42,67,0.55)` | Modal overlays. |

### CSS Custom Properties
```css
--kin-sand:            #F7F2EA;
--kin-sand-deep:       #EDE5D6;
--kin-surface:         #FFFFFF;
--kin-navy:            #102A43;
--kin-slate:           #263238;
--kin-muted:           #6B7280;
--kin-teal:            #18A999;
--kin-teal-deep:       #0F8676;
--kin-mint:            #DDF7EF;
--kin-amber:           #F5A623;
--kin-coral:           #E85D5A;
--kin-hairline:        rgba(38,50,56,0.08);
--kin-hairline-strong: rgba(38,50,56,0.16);
--kin-scrim:           rgba(16,42,67,0.55);
```

### Colour Usage Rules
- Coral is for **risk only**. Never use it as a brand colour, never as a CTA fill, never on a marketing surface as decoration.
- Score colour follows value: **≥ 75 → Teal**, **45–74 → Amber**, **< 45 → Coral**.
- Never use teal as the primary text colour. It is action only.
- No gradients. No saturated whites — always Sand on body surfaces.
- Contrast minimums: **4.5:1** for body text, **3:1** for large titles and icons.

---

## 05 · Typography

> **Manrope. One family. Calibrated scale.**

Manrope handles numbers, conversational UI, and long-form copy with a single warm voice. Use only the nine roles defined below — do not introduce new sizes.

### Type Scale

| Role | Size/LH | Weight | Letter-Spacing | Usage |
|---|---|---|---|---|
| **display** | 40/44px | 700 | -0.03em | Hero headlines on splash and entry. |
| **h1** | 32/38px | 700 | -0.025em | First line of a question or screen. |
| **h2** | 24/30px | 700 | -0.02em | Section heads, card titles. |
| **h3** | 20/26px | 600 | -0.015em | Subheads, card meta titles. |
| **body-lg** | 17/26px | 400 | 0 | Long-form text, conversational lines. |
| **body** | 15/22px | 400 | 0 | Default body, buttons, inputs. |
| **body-sm** | 13/18px | 400 | 0 | Helper, secondary, list dense rows. |
| **caption** | 12/16px | 500 | 0 | Labels, meta, small explainers. |
| **micro** | 11/14px | 700 | 0.14em UPPERCASE | Eyebrows, tags, all-caps labels. |
| **numeric-hero** | 64/64px | 700 | -0.03em | Score number (large). |
| **numeric-inline** | 28/32px | 700 | -0.02em | Score in cards. |

**Family:** `"Manrope", system-ui, sans-serif` (weights 400, 500, 600, 700)  
**Fallback:** Inter

### Typography Rules
- Numbers use **tabular-nums** in Score, currency, math rows.
- Use **text-wrap: balance** on titles, **pretty** on body — never on a single short line.
- Never centre body copy. Centre only display and section heads.
- Letter-spacing on micro labels is **0.14em**; never below 0.10 or above 0.18.
- Sentence case everywhere except micro labels.
- First lines under **8 words**. Body paragraphs under **3 lines**.

---

## 06 · Spacing & Layout

> **A 4-base scale. One screen, one thought.**

Every padding, gap, and margin in KIN is a multiple of 4. Screens have generous breathing room; surfaces never feel cramped.

### Spacing Scale (px)
`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96`

### Mobile Canvas (iPhone 14 Baseline)
| Property | Value |
|---|---|
| Viewport | 390 × 844 |
| Safe area — top | 60 |
| Safe area — bottom | 34 |
| Horizontal gutter | 20 (never less than 16) |
| Header height | 56 |
| Bottom nav height | 76 |
| Hit target minimum | ≥ 44 × 44 |
| Vertical rhythm between sections | 24 |
| Vertical rhythm inside a card | 16 |

### Radius Scale
| Token | Value | Usage |
|---|---|---|
| xs | 6px | Minimum. Never use sharp corners. |
| sm | 10px | Small components. |
| md | 14px | Buttons, inputs, cards. |
| lg | 20px | Large cards. |
| xl | 28px | Bottom sheets (top only). |
| pill | 999px | Chips, avatars. |

---

## 07 · Iconography

> **Stroked, rounded, calm.**

KIN icons are stroked outlines (not filled), drawn on a 24px grid with 1.6px stroke and round caps. They sit beside body type without shouting.

### Specification
- **Grid:** 24 × 24. Live area: 20 × 20 (2u padding on all sides).
- **Stroke:** 1.6px, round caps & joins.
- **Sizes:** 16 / 20 / 24 / 28 / 32. Never scale a 16 to 32 — redraw.
- **Colour:** Navy in body, Teal when interactive, Muted when disabled.
- No filled icons unless inside a Score ring or active bottom-nav state.

### Core Icon Set
`Family · Shield · Lock · Vault · Chart · Chat · Check · Info · Math · Eye · Arrow · Close`

---

## 08 · Components

> **The complete kit.**

Every component below is a finished pixel spec. Reach for these first; never invent a new variant without sign-off.

### Buttons

#### Primary Button
- **Height lg:** 56h · **Padding:** 0 22px · **Radius:** 14
- **Height md:** 44h · **Padding:** 0 18px · **Radius:** 10
- **Font:** Manrope 700 · lg: 16px / md: 14px · letter-spacing: -0.01em
- **Colors:** bg `--kin-teal` · text `--kin-navy`
- **Pressed:** bg `--kin-teal-deep` · transform scale(0.985)
- **Focus ring:** 2px `--kin-teal` at 4px offset
- **Icon:** size 18, gap from label: 10

#### Secondary Button
- Same dimensions as primary
- bg: transparent · color: `--kin-navy` · border: 1.5px `--kin-navy`

#### Ghost Button
- Text only · color: `--kin-navy` · weight 600

#### Danger Button (rare)
- bg: `--kin-coral` · color: `--kin-sand`

### Chips

#### Trust Chip (entry, privacy strip)
- 32h · padding 0 12px · radius pill
- bg: transparent · border: 1px `--kin-hairline-strong` · color: `--kin-muted`
- font: 12px · weight 500

#### Choice Chip (conversation answers)
- 40h · padding 0 16px · radius pill
- bg: `--kin-sand-deep` · color: `--kin-navy` · no border
- font: 14px · weight 600

#### State Chips
- 32h · padding 0 12px · radius pill · no border
- **positive:** bg `--kin-mint` · color `--kin-teal-deep`
- **moderate:** bg `rgba(245,166,35,0.14)` · color `#8A5A07`
- **critical:** bg `rgba(232,93,90,0.12)` · color `#9F2D2A`

### Input
- 56h · radius 14 · padding 0 16px
- bg: `--kin-surface` · border: 1.5px `--kin-hairline-strong`
- **Focus border:** 1.5px `--kin-teal`
- font: body (15px)
- **Label above:** caption · uppercase · `--kin-muted` · letterSpacing 0.08em · weight 600
- **Helper below:** caption · `--kin-muted`

### Card
- bg: `--kin-surface` · radius 14 · padding 20
- border: 1px `--kin-hairline`
- shadow: `0 1px 0 rgba(16,42,67,0.04), 0 12px 28px -20px rgba(16,42,67,0.22)`

### Chat Bubbles

#### System Bubble (left)
- bg: `--kin-surface` · color: `--kin-slate`
- border: 1px `--kin-hairline`
- radius: 18 18 18 4 (bottom-left pointer)
- max-width: 82% · padding 14 18 · font body (15px)

#### User Bubble (right)
- bg: `--kin-navy` · color: `--kin-sand`
- radius: 18 18 4 18 (bottom-right pointer)
- max-width: 82% · padding 14 18 · font body (15px)

### Protection Score Ring
- **Hero size:** 220 × 220 · ring stroke 14
- **Inline size:** 96 × 96 · ring stroke 6
- Background ring: `rgba(16,42,67,0.08)`
- Progress ring: Teal (≥75) / Amber (45–74) / Coral (<45)
- Number inside: numeric-hero / numeric-inline (Navy, tabular-nums)
- Label below number (hero only): micro UPPER · `--kin-muted`
- Animates 0 → value over 800ms spring on **first reveal only**. No looping.

### "See the Math" Card (signature transparency component)
- bg: `--kin-surface` · radius 14 · padding 16 18
- **borderLeft:** 3px `--kin-teal`
- border: 1px `--kin-hairline`
- **Header:** micro UPPER · `--kin-muted`
- **Rows:** body (15px) · label left (`--kin-slate`) · value right (`--kin-navy`, weight 600, tabular-nums)
- **Row dividers:** 1px `--kin-hairline` between rows
- **Total row:** 1px `--kin-hairline-strong` separator · label micro UPPER `--kin-muted` · value 22px weight 700 `--kin-navy`

The math is a hero feature, never a footnote. Every score must be backed by a "See the Math" card the user can open.

### Navigation

#### Nav Header
- 56h · bg `--kin-sand` · backdrop-filter saturate(140%) blur(8px)
- Title: h3 Navy · centred
- Back icon left (24px) · action icon right (24px)

#### Bottom Nav
- 76h (incl. safe area) · bg `--kin-surface`
- borderTop 1px `--kin-hairline`
- 3–5 items · icon 24 + label 11/14 uppercase weight 600
- **Active:** `--kin-teal` · label weight 700

---

## 09 · Motion

> **Soft, never theatrical.**

Motion in KIN signals calm and continuity. It explains state changes; it never performs for itself.

### Timing Tokens

| Token | Duration | Use |
|---|---|---|
| fast | 120ms | Hover, micro-feedback |
| base | 200ms | Default UI transitions |
| slow | 320ms | Reveals, screen transitions |

### Easing
- **Default:** `cubic-bezier(0.2, 0.8, 0.2, 1)` (ease-out)
- **Spring:** `cubic-bezier(0.34, 1.56, 0.64, 1)` — only Score ring fill and "See the Math" reveal

### Motion Rules
- Score ring animates 0 → value over **800ms** spring on first reveal only. No looping.
- Bottom-sheets enter in **320ms** ease-out, exit in **200ms**.
- Conversation bubbles fade + rise **8px** over **200ms**.
- Honour `prefers-reduced-motion` — drop all transforms, keep crossfades only.
- Never parallax. Never bounce. Never auto-play.

---

## 10 · UX Laws (Locked)

> **Eight rules that override any other instinct.**

These are the non-negotiables. If a design fights any of these, the design is wrong — not the law.

| # | Law | Description |
|---|---|---|
| 01 | **One screen. One thought. One action.** | Every screen has a single primary action. If you can't name it, the screen is wrong. |
| 02 | **Diagnosis before prescription.** | No product, insurer, or premium appears before the protection diagnosis is complete. |
| 03 | **Privacy visible by design.** | Surface 'No phone number', 'No documents', 'You control sharing' in the journey — not buried in legal. |
| 04 | **No-shame UX.** | Low scores create clarity, never guilt. Coral marks risk; copy stays warm. |
| 05 | **See the Math as trust engine.** | Every score, gap, and recommendation is one tap away from its calculation. |
| 06 | **Chat-first diagnostic.** | The diagnostic is a guided WhatsApp-style conversation with choice chips, not a static form. |
| 07 | **Human handoff without pressure.** | An advisor is always one tap away. Never forced. Never on a countdown. |
| 08 | **Family-first emotional framing.** | Connect protection to people: 'your spouse', 'your kids' — not 'sum assured', 'beneficiary'. |

---

## 11 · Copy Rules

> **Family words. Not insurance words.**

Replace category jargon with KIN's locked vocabulary every time.

### Vocabulary — Use / Never

| ✅ Use | ❌ Never |
|---|---|
| Protection Score | Premium calculator |
| Protection Check | Quote request |
| Family protection gap | Sum assured shortfall |
| Existing cover | Existing sum assured |
| The amount your family receives | Death benefit |
| Yearly cost | Annual premium |
| See the Math | View calculation details |
| Hidden coverages | Additional benefits |
| Protection Vault | Policy locker / dashboard |
| Connect to an advisor | Buy now / Get quote |

### Tone Tests (run on every line of copy)
1. **Would an elder sibling say this?** If not, rewrite.
2. **Does it create fear or shame?** Cut or soften.
3. **Is there a number without context?** Pair it with what it means for the family.
4. **Does it sell?** Replace the sell with an explanation.
5. **Length** — first lines under 8 words. Body paragraphs under 3 lines.

---

## 12 · Screen Archetypes

> **Three patterns. Almost every screen is one of them.**

Entry (one thought, one action). Diagnostic (one question, chips, transcript). Score (number + math + path forward).

### A · Entry Screen
*First impression / re-entry*

```
[TOP-LEFT] KIN lockup (mark 40, wordmark 32, gap 10)

[40px gap]

H1: question or promise (max 8 words)

[14px gap]
body: one-line context

[20px gap]
Trust chips row

[flex spacer]

[Primary CTA — full-width 56h]

[14px gap]
Privacy line (caption, muted, centred)
```

### B · Diagnostic Screen
*The chat-first questionnaire*

```
[Top strip] Back  ·  Step N of M (micro UPPER muted)  ·  Skip

[System bubble — the question]

[User bubble — if answered (right-aligned, navy)]

[Optional follow-up system bubble]

[flex spacer]

[Choice chip rack — docked bottom (40h chips, wrap if >4)]
```

### C · Score + Math Screen
*The diagnosis screen*

```
[Eyebrow micro UPPER] "Your Protection Score"

[18px gap]
[Score ring 200–220] centred

[14px gap]
H3 state line: e.g. "Moderate gap — closeable."

[10px gap]
body-sm explanation

[16px gap]
See-the-Math card

[flex spacer]

[Primary CTA] next step: "Show me how to close it"
[Ghost CTA] "Save my Protection Vault"
```

### Pattern Rules
- **Entry:** lockup top-left, single H1, trust chips, one CTA, privacy line below CTA.
- **Diagnostic:** back / step counter / skip strip, one system bubble, optional answer bubble, chip rack docked to bottom.
- **Score:** ring + one-line state, See-the-Math card, primary CTA = next step, ghost CTA = save to vault.
- **Never** combine two archetypes on one screen.

---

## 13 · Accessibility

> **Calm is inclusive.**

If a screen excludes a reader, it's not on-brand. Meet these floors without exception.

- **Contrast** — body 4.5:1, large text & icons 3:1. Teal on Sand is borderline; never use Teal for body text.
- **Hit targets** — minimum **44 × 44px**. Chips & icon-only buttons must have invisible padding to reach 44.
- **Focus** — visible 2px teal outline at 4px offset on keyboard focus. Never `outline:none` without a replacement.
- **Motion** — honour `prefers-reduced-motion`. Score ring becomes static at the final value.
- **Language** — design for English first, then Hindi. Reserve **20% horizontal headroom** for Devanagari ascenders / descenders.
- **Screen reader** — chips, scores, and "See the Math" rows must expose semantic labels and numeric values.
- **Form sensitivity** — never require name, phone, email to reach the Score.

---

## 14 · AI Handoff Prompt

> **One block. Paste it as the system prompt.**

Hand this to any model that will design screens, write copy, or build pages for KIN. It compresses every section above into machine-followable guardrails.

```
# KIN — BRAND & UI BUILD INSTRUCTIONS
# Paste this entire block as the system prompt / first instruction
# for any model that will design or build screens for KIN.

You are designing for KIN, a family protection intelligence companion for working
Indians. KIN is NOT an insurance marketplace, comparison app, calculator, or
lead-gen form. KIN is a calm, intelligent guide that helps users understand how
protected their family really is, BEFORE any product conversation.

============================================================
0 · NON-NEGOTIABLES (read first; these override anything below)
============================================================
- One screen. One thought. One action.
- Diagnosis before prescription. No product, insurer, or premium appears before
  the protection diagnosis is complete.
- Privacy is visible by design. Surface "No phone number", "No documents",
  "You control sharing" inside the journey — not buried in legal.
- No-shame UX. Low scores create clarity, never guilt.
- Always show the math. Every score, gap, and recommendation must be one tap
  from its calculation. The "See the Math" card is a hero, not a footer.
- Chat-first diagnostic. Use a guided conversation with choice chips. Never a
  static form, never a multi-field questionnaire.
- Human advisor is one tap away but NEVER forced. No countdowns, no urgency.
- Family-first emotional framing. Talk about "your spouse, your kids, your
  parents" — not "beneficiary, sum assured, rider".
- Never use Coral red as decoration. Coral is reserved for serious risk states.
- Never invent new colour tokens, new type sizes, or new component variants.

============================================================
1 · IDENTITY
============================================================
Essence:        Family protection made visible.
Tagline:        Know your protection. Protect your people.
Archetype:      Guardian (protects) + Sage (explains) + Companion (stays).
Personality:    Calm · Clear · Protective · Transparent · Respectful · Intelligent
Reference feel: CRED's restraint, Headspace's warmth, Uber's geometric discipline.

============================================================
2 · COLOUR TOKENS (use these names and hexes literally)
============================================================
--kin-sand:        #F7F2EA   /* primary app background */
--kin-sand-deep:   #EDE5D6   /* subtle surface contrast on sand */
--kin-surface:     #FFFFFF   /* raised surface (cards, sheets) */
--kin-navy:        #102A43   /* primary ink: titles, brand body, headers */
--kin-slate:       #263238   /* body text */
--kin-muted:       #6B7280   /* helper, captions, eyebrows */
--kin-teal:        #18A999   /* primary action (CTA, accent, focus) */
--kin-teal-deep:   #0F8676   /* pressed/hover action */
--kin-mint:        #DDF7EF   /* positive state surface */
--kin-amber:       #F5A623   /* moderate gap (45–74) */
--kin-coral:       #E85D5A   /* CRITICAL gap (<45) — serious risk only */
--kin-hairline:    rgba(38,50,56,0.08)
--kin-hairline-strong: rgba(38,50,56,0.16)
--kin-scrim:       rgba(16,42,67,0.55)

Colour rules:
- Default background is Sand. Never default to white.
- Navy is for ink, never for fills under buttons unless inverse splash.
- Teal is for ACTION only. Never use teal as body text.
- Score colour follows value: ≥75 Teal, 45–74 Amber, <45 Coral.
- Contrast minimums: body 4.5:1, large text & icons 3:1.

============================================================
3 · TYPOGRAPHY — Manrope only
============================================================
Family: "Manrope", system-ui, sans-serif (weights 400, 500, 600, 700)
Fallback if Manrope unavailable: Inter.

Scale (size/lineHeight px · weight · letterSpacing):
- display:        40/44 · 700 · -0.03em   /* hero on splash/entry */
- h1:             32/38 · 700 · -0.025em  /* screen title */
- h2:             24/30 · 700 · -0.02em   /* section title, card title */
- h3:             20/26 · 600 · -0.015em  /* subhead, meta */
- body-lg:        17/26 · 400 · 0         /* conversational, long-form */
- body:           15/22 · 400 · 0         /* default body, buttons, inputs */
- body-sm:        13/18 · 400 · 0         /* helper, list dense */
- caption:        12/16 · 500 · 0         /* labels, meta */
- micro:          11/14 · 700 · 0.14em UPPERCASE  /* eyebrow, all-caps */
- numeric-hero:   64/64 · 700 · -0.03em   /* Score number */
- numeric-inline: 28/32 · 700 · -0.02em   /* Score in cards */

Type rules:
- Numbers use font-variant-numeric: tabular-nums in Score, currency, math rows.
- text-wrap: balance on titles; pretty on body; never on single short lines.
- Never centre body. Centre only display and section heads.
- Sentence case everywhere except micro eyebrows.
- First lines under 8 words. Paragraphs under 3 lines.

============================================================
4 · SPACING & RADIUS
============================================================
Spacing (px, 4-base): 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
Radius:  xs 6 · sm 10 · md 14 · lg 20 · xl 28 · pill 999

Mobile canvas (iPhone 14 baseline):
- Viewport:          390 × 844
- Safe top:          60
- Safe bottom:       34
- Horizontal gutter: 20 (min 16)
- Header height:     56
- Bottom nav:        76
- Hit target min:    44 × 44

Radius usage:
- Buttons & inputs: md (14)
- Cards: md (14) or lg (20)
- Bottom sheets: xl (28) on top only
- Chips & avatars: pill (999)
- Never use sharp corners. Minimum radius xs (6).

============================================================
5 · COMPONENTS — full pixel specs
============================================================

BUTTON · PRIMARY
- size lg: 56h, padding 0 22, radius 14
- size md: 44h, padding 0 18, radius 10
- font: Manrope 700, lg 16 / md 14, letterSpacing -0.01em
- bg: --kin-teal · color: --kin-navy
- pressed: bg --kin-teal-deep, transform scale(0.985)
- focus ring: 2px --kin-teal at 4px offset
- icon size: 18, gap from label: 10

BUTTON · SECONDARY
- Same dimensions as primary
- bg: transparent · color: --kin-navy · border: 1.5px --kin-navy

BUTTON · GHOST
- Text only · color: --kin-navy · weight 600

BUTTON · DANGER (rare)
- bg: --kin-coral · color: --kin-sand

CHIP · TRUST (entry, privacy strip)
- 32h, padding 0 12, radius pill
- bg: transparent · border: 1px --kin-hairline-strong · color: --kin-muted
- font: 12, weight 500

CHIP · CHOICE (conversation answers)
- 40h, padding 0 16, radius pill
- bg: --kin-sand-deep · color: --kin-navy · no border
- font: 14, weight 600

CHIP · STATE
- 32h, padding 0 12, radius pill, no border
- positive: bg --kin-mint, color --kin-teal-deep
- moderate: bg rgba(245,166,35,0.14), color #8A5A07
- critical: bg rgba(232,93,90,0.12), color #9F2D2A

INPUT
- 56h, radius 14, padding 0 16
- bg: --kin-surface · border 1.5px --kin-hairline-strong
- focus border: 1.5px --kin-teal
- font: body (15)
- Label above (caption, uppercase, --kin-muted, letterSpacing 0.08em, weight 600)
- Helper below (caption, --kin-muted)

CARD
- bg: --kin-surface · radius 14 · padding 20
- border: 1px --kin-hairline
- shadow: 0 1px 0 rgba(16,42,67,0.04), 0 12px 28px -20px rgba(16,42,67,0.22)

CHAT BUBBLE · SYSTEM (left)
- bg: --kin-surface · color: --kin-slate
- border: 1px --kin-hairline
- radius: 18 18 18 4 (bottom-left pointer)
- max-width: 82%, padding 14 18, font body (15)

CHAT BUBBLE · USER (right)
- bg: --kin-navy · color: --kin-sand
- radius: 18 18 4 18 (bottom-right pointer)
- max-width: 82%, padding 14 18, font body (15)

PROTECTION SCORE RING
- Hero size: 220 × 220, ring stroke 14
- Inline size: 96 × 96, ring stroke 6
- Background ring: rgba(16,42,67,0.08)
- Progress ring: Teal/Amber/Coral per value band
- Number inside: numeric-hero / numeric-inline (Navy, tabular-nums)
- Label below number (hero only): micro UPPER, --kin-muted

SEE THE MATH CARD
- bg: --kin-surface · radius 14 · padding 16 18
- borderLeft: 3px --kin-teal
- border: 1px --kin-hairline
- Header: micro UPPER, --kin-muted
- Rows: body (15), label left (--kin-slate), value right (--kin-navy, weight 600, tabular-nums)
- Row dividers: 1px --kin-hairline between
- Total row: separated by 1px --kin-hairline-strong, label micro UPPER --kin-muted, value 22 weight 700 --kin-navy

NAV HEADER
- 56h, bg --kin-sand, backdrop-filter saturate(140%) blur(8)
- Title: h3 Navy, centred
- Back icon left (24), action icon right (24)

BOTTOM NAV
- 76h (incl safe area), bg --kin-surface
- borderTop 1px --kin-hairline
- 3–5 items, icon 24 + label 11/14 uppercase weight 600
- Active: --kin-teal, label weight 700

============================================================
6 · ICONOGRAPHY
============================================================
- Grid 24 × 24, live area 20 × 20.
- Stroke 1.6px, round caps & joins.
- Sizes 16 / 20 / 24 / 28 / 32. Redraw between sizes, never scale.
- Colour: Navy default; Teal interactive; Muted disabled.
- Filled icons only inside Score ring or active bottom-nav state.

============================================================
7 · MOTION
============================================================
- duration-fast: 120ms · duration-base: 200ms · duration-slow: 320ms
- easing-out: cubic-bezier(0.2, 0.8, 0.2, 1)
- easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1) — only Score reveal + Math reveal
- Score ring animates 0→value over 800ms spring on first reveal only. No loops.
- Bubbles fade + translateY(8→0) over 200ms.
- Bottom sheets: enter 320ms, exit 200ms.
- Honour prefers-reduced-motion: drop transforms, keep crossfades.
- Never parallax, bounce, or auto-play.

============================================================
8 · COPY VOCABULARY (locked)
============================================================
USE                                    NEVER
Protection Score                       Premium calculator
Protection Check                       Quote request
Family protection gap                  Sum assured shortfall
Existing cover                         Existing sum assured
The amount your family receives        Death benefit
Yearly cost                            Annual premium
See the Math                           View calculation details
Hidden coverages                       Additional benefits
Protection Vault                       Policy locker / dashboard
Connect to an advisor                  Buy now / Get quote

Tone tests for every line of copy:
- Would an elder sibling say this?
- Does it create fear or shame?
- Is there a number without context for the family?
- Does it try to sell?
- First line under 8 words?

============================================================
9 · SCREEN ARCHETYPES (almost every screen is one of three)
============================================================

A · ENTRY (first impression / re-entry)
- Top-left: KIN lockup (mark 40, wordmark 32, gap 10)
- 40px gap
- H1: question or promise, max 8 words
- 14px gap, body: one-line context
- 20px gap, trust chips row
- flex spacer
- Primary CTA full-width 56h
- 14px gap, privacy line (caption, muted, centred)

B · DIAGNOSTIC (the chat-first questionnaire)
- Top strip: Back · "Step N of M" (micro UPPER muted) · Skip
- System bubble (the question)
- User bubble if answered (right-aligned, navy)
- Optional follow-up system bubble
- flex spacer
- Choice chip rack docked bottom (40h chips, wrap if >4)

C · SCORE + MATH (the diagnosis screen)
- Eyebrow micro UPPER: "Your Protection Score"
- 18px gap, Score ring (200–220) centred
- 14px gap, H3 state line ("Moderate gap — closeable.")
- 10px gap, body-sm explanation
- 16px gap, See-the-Math card
- flex spacer
- Primary CTA: next step ("Show me how to close it")
- Ghost CTA: "Save my Protection Vault"

NEVER combine two archetypes on one screen.

============================================================
10 · ACCESSIBILITY
============================================================
- Body contrast 4.5:1, large text 3:1.
- Touch targets ≥ 44 × 44.
- Visible focus ring (2px Teal at 4px offset).
- Honour prefers-reduced-motion.
- Plan for Hindi: reserve 20% horizontal headroom for Devanagari.
- Score / chips / math rows must expose semantic labels and numeric values.
- Never require name, phone, email to reach the Score.

============================================================
11 · LOGO USAGE (Shelter mark)
============================================================
APPROVED MARKS — only two:
- A · LOCKED  → master mark. Use everywhere by default.
- B · PURE    → auto-swap below 24px. Favicons, in-line glyphs.

No other marks exist. Earlier exploration sketches (open peak, monogram, soft)
are RETIRED and must never appear on any production surface.

Lockup:
- Primary lockup: Shelter mark (A · Locked) + Manrope "kin" wordmark,
  horizontal, baseline-aligned.
- Clear space: 1 dot-height (1d) on all sides; 2d next to dense type.
- Minimum lockup width: 120px. Minimum mark size: 24px.
- Below 24px the mark MUST swap automatically to B · Pure.
- Never tilt, never animate, never recolour outside the locked palette.
- On dark surfaces: body uses --kin-sand, accent dot stays --kin-teal.

MONOGRAMS / AVATARS / PROFILE CIRCLES — use Locked as a watermark:
- KIN has no monogram mark. Do NOT invent one.
- For avatars or single-letter slots, render the user's initial (or photo)
  inside a circle, with A · Locked as a quiet watermark behind it.
- Watermark opacity: 16–24%. Centred. Never at full opacity inside an avatar.
- On a navy circle: Locked rendered in Sand at 18% opacity.
- On a sand circle: Locked rendered in Navy at 14% opacity.
- Initial/photo always sits in front of the watermark.

============================================================
12 · WHAT TO REFUSE / FLAG
============================================================
- Any screen that asks for phone/email/name BEFORE the Protection Score appears.
- Any "Buy now", "Get quote", "Compare plans" CTA.
- Any countdown timer, urgency banner, "limited offer" copy.
- Any insurer logo strip, marketplace grid, leaderboard.
- Any score shown without a "See the Math" affordance.
- Any use of Coral that is not a serious risk state.

============================================================
13 · DELIVERY CHECKLIST (run before any screen ships)
============================================================
□ One thought, one primary action on screen.
□ Background is Sand. Surfaces are Surface/white. No raw whites on body.
□ Every CTA is a defined component variant. No custom buttons.
□ All type sizes match the scale above. No new sizes.
□ All numbers use tabular-nums.
□ Score, if present, has See-the-Math card.
□ Privacy line visible somewhere on the screen.
□ Hit targets all ≥ 44 × 44.
□ Copy passes all five tone tests.
□ No banned vocabulary anywhere on the screen.

# END OF KIN BRAND & BUILD INSTRUCTIONS
```

---

## Appendix · Design Tokens Reference

### Elevation / Shadow
```css
--kin-shadow-card:  0 1px 0 rgba(16,42,67,0.04), 0 12px 28px -20px rgba(16,42,67,0.22);
--kin-shadow-modal: 0 24px 60px -28px rgba(16,42,67,0.45);
--kin-shadow-tile:  0 12px 28px -16px rgba(16,42,67,0.35);
```

### Complete Token Object
```js
const T = {
  color: {
    sand:            "#F7F2EA",
    sandDeep:        "#EDE5D6",
    surface:         "#FFFFFF",
    navy:            "#102A43",
    slate:           "#263238",
    muted:           "#6B7280",
    teal:            "#18A999",
    tealDeep:        "#0F8676",
    mint:            "#DDF7EF",
    amber:           "#F5A623",
    coral:           "#E85D5A",
    hairline:        "rgba(38,50,56,0.08)",
    hairlineStrong:  "rgba(38,50,56,0.16)",
    scrim:           "rgba(16,42,67,0.55)",
  },
  font: {
    family:       '"Manrope", system-ui, sans-serif',
    display:      { size: 40, lh: 44, weight: 700, ls: "-0.03em" },
    h1:           { size: 32, lh: 38, weight: 700, ls: "-0.025em" },
    h2:           { size: 24, lh: 30, weight: 700, ls: "-0.02em" },
    h3:           { size: 20, lh: 26, weight: 600, ls: "-0.015em" },
    bodyLg:       { size: 17, lh: 26, weight: 400, ls: "0" },
    body:         { size: 15, lh: 22, weight: 400, ls: "0" },
    bodySm:       { size: 13, lh: 18, weight: 400, ls: "0" },
    caption:      { size: 12, lh: 16, weight: 500, ls: "0" },
    micro:        { size: 11, lh: 14, weight: 700, ls: "0.14em" },
    numericHero:  { size: 64, lh: 64, weight: 700, ls: "-0.03em" },
    numericInline:{ size: 28, lh: 32, weight: 700, ls: "-0.02em" },
  },
  space: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96],
  radius: { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, pill: 999 },
  shadow: {
    card:  "0 1px 0 rgba(16,42,67,0.04), 0 12px 28px -20px rgba(16,42,67,0.22)",
    modal: "0 24px 60px -28px rgba(16,42,67,0.45)",
    tile:  "0 12px 28px -16px rgba(16,42,67,0.35)",
  },
  motion: {
    fast:    "120ms",
    base:    "200ms",
    slow:    "320ms",
    easeOut: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    spring:  "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  device: { w: 390, h: 844, safeTop: 60, safeBottom: 34, gutter: 20 },
};
```

---

*KIN Brand & Build Guidelines · v1.0 · Locked*
