import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // KIN brand defaults — overridden at runtime via CSS variables injected by BrandProvider
        primary: 'var(--color-primary, #1B4332)',
        accent: 'var(--color-accent, #52B788)',
        surface: 'var(--color-surface, #F8F9FA)',
        // Score band colours
        'score-critical': '#EF4444',
        'score-significant': '#F97316',
        'score-moderate': '#EAB308',
        'score-well': '#22C55E',
        'score-full': '#14B8A6',
      },
      fontFamily: {
        sans: ['var(--font-family, Inter)', 'system-ui', 'sans-serif'],
      },
      minWidth: {
        'touch': '44px',
      },
      minHeight: {
        'touch': '44px',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
