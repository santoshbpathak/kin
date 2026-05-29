import type { Config } from 'tailwindcss'

/**
 * KIN design system — Brand & Build Guidelines v1.0 (locked).
 * Colours, radius, shadow, type scale and motion all map to the CSS
 * variables defined in index.css. The legacy `primary`/`accent`/`surface`
 * tokens remain (aliased to KIN navy/teal/sand) so screens not yet
 * redesigned stay on-brand, and so BrandProvider's white-label partner
 * overrides keep working.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // KIN locked palette
        sand: 'var(--kin-sand, #F7F2EA)',
        'sand-deep': 'var(--kin-sand-deep, #EDE5D6)',
        navy: 'var(--kin-navy, #102A43)',
        slate: 'var(--kin-slate, #263238)',
        muted: 'var(--kin-muted, #6B7280)',
        teal: 'var(--kin-teal, #18A999)',
        'teal-deep': 'var(--kin-teal-deep, #0F8676)',
        mint: 'var(--kin-mint, #DDF7EF)',
        amber: 'var(--kin-amber, #F5A623)',
        coral: 'var(--kin-coral, #E85D5A)',
        hairline: 'var(--kin-hairline, rgba(38,50,56,0.08))',
        'hairline-strong': 'var(--kin-hairline-strong, rgba(38,50,56,0.16))',

        // Raised surface (cards/sheets) is white in KIN
        surface: 'var(--kin-surface, #FFFFFF)',

        // Legacy aliases (runtime-overridable by BrandProvider for partners)
        primary: 'var(--color-primary, #102A43)',
        accent: 'var(--color-accent, #18A999)',

        // Score band colours follow value: ≥75 Teal · 45–74 Amber · <45 Coral
        'score-full': 'var(--kin-teal, #18A999)',
        'score-well': 'var(--kin-teal, #18A999)',
        'score-moderate': 'var(--kin-amber, #F5A623)',
        'score-significant': 'var(--kin-amber, #F5A623)',
        'score-critical': 'var(--kin-coral, #E85D5A)',
      },
      fontFamily: {
        sans: ['var(--font-family, Manrope)', 'Manrope', 'system-ui', 'sans-serif'],
      },
      // Type scale (§05) — size paired with line-height/letter-spacing/weight
      fontSize: {
        display: ['40px', { lineHeight: '44px', letterSpacing: '-0.03em', fontWeight: '700' }],
        h1: ['32px', { lineHeight: '38px', letterSpacing: '-0.025em', fontWeight: '700' }],
        h2: ['24px', { lineHeight: '30px', letterSpacing: '-0.02em', fontWeight: '700' }],
        h3: ['20px', { lineHeight: '26px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'body-lg': ['17px', { lineHeight: '26px' }],
        body: ['15px', { lineHeight: '22px' }],
        'body-sm': ['13px', { lineHeight: '18px' }],
        caption: ['12px', { lineHeight: '16px', fontWeight: '500' }],
        micro: ['11px', { lineHeight: '14px', letterSpacing: '0.14em', fontWeight: '700' }],
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '14px',
        lg: '20px',
        xl: '28px',
        pill: '999px',
      },
      boxShadow: {
        card: 'var(--kin-shadow-card)',
        modal: 'var(--kin-shadow-modal)',
        tile: 'var(--kin-shadow-tile)',
      },
      // 4-base spacing scale (§06) — extends Tailwind's defaults
      spacing: {
        18: '72px',
        22: '88px',
      },
      minWidth: { touch: '44px' },
      minHeight: { touch: '44px' },
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '320ms',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        // Conversation bubbles: fade + rise 8px over 200ms (§09)
        'fade-in': 'fade-in 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        // Bottom sheets enter over 320ms ease-out (§09)
        'sheet-up': 'sheet-up 320ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
}

export default config
