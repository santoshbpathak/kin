// ESLint 9 flat config for the web app. The previous `.eslintrc`-style
// invocation (`eslint . --ext ts,tsx`) is rejected by ESLint 9, so lint had
// been silently non-functional.
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist/**', 'dev-dist/**', 'node_modules/**', 'eslint.config.js', 'postcss.config.js', 'tailwind.config.ts', 'vite.config.ts'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
      globals: { window: 'readonly', document: 'readonly', fetch: 'readonly', sessionStorage: 'readonly', localStorage: 'readonly', crypto: 'readonly', console: 'readonly', navigator: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly', URLSearchParams: 'readonly', HTMLElement: 'readonly', HTMLInputElement: 'readonly', HTMLDivElement: 'readonly', KeyboardEvent: 'readonly', MouseEvent: 'readonly', Event: 'readonly', Blob: 'readonly', URL: 'readonly', React: 'readonly' },
    },
    plugins: { '@typescript-eslint': tsPlugin, 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]
