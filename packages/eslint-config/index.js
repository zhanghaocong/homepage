import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import { reactRefresh } from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// React Router route modules legitimately export these alongside components,
// so Fast Refresh should not flag them.
const reactRouterRouteExports = [
  'meta',
  'links',
  'headers',
  'loader',
  'clientLoader',
  'action',
  'clientAction',
  'ErrorBoundary',
  'HydrateFallback',
  'Layout',
  'handle',
  'shouldRevalidate',
  'middleware',
]

// react-hooks v7 enables React Compiler-oriented rules as errors by default.
// Per project decision we keep them on as warnings (signal without blocking),
// while the classic rules-of-hooks (error) / exhaustive-deps (warn) stay as-is.
const reactHooksCompilerRules = [
  'static-components',
  'use-memo',
  'preserve-manual-memoization',
  'incompatible-library',
  'immutability',
  'globals',
  'refs',
  'set-state-in-effect',
  'error-boundaries',
  'purity',
  'set-state-in-render',
  'unsupported-syntax',
  'config',
  'gating',
]

/**
 * @param {object} options
 * @param {string} options.tsconfigRootDir Absolute path to the package root (directory containing tsconfig.json).
 * @param {string[]} [options.ignores]
 * @param {boolean} [options.prettier]
 * @param {boolean} [options.nodeGlobals]
 */
export function createReactRouterAppConfig({
  tsconfigRootDir,
  ignores = [],
  prettier = false,
  nodeGlobals = true,
} = {}) {
  return tseslint.config(
    { ignores },

    js.configs.recommended,
    ...tseslint.configs.recommended,
    reactHooks.configs.flat.recommended,
    {
      name: 'react-hooks/compiler-rules-as-warnings',
      rules: Object.fromEntries(reactHooksCompilerRules.map((rule) => [`react-hooks/${rule}`, 'warn'])),
    },

    {
      files: ['**/*.{js,mjs,cjs,ts,tsx}'],
      languageOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        globals: {
          ...globals.browser,
          ...(nodeGlobals ? globals.node : {}),
        },
      },
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],
      },
    },

    {
      files: ['**/*.{ts,tsx}'],
      languageOptions: {
        parserOptions: {
          tsconfigRootDir,
        },
      },
      plugins: {
        'react-refresh': reactRefresh.plugin,
      },
      rules: {
        'react-refresh/only-export-components': [
          'warn',
          {
            allowConstantExport: true,
            allowExportNames: reactRouterRouteExports,
          },
        ],
      },
    },

    ...(prettier ? [eslintConfigPrettier] : []),
  )
}

/**
 * @param {object} options
 * @param {string} options.tsconfigRootDir Absolute path to the package root (directory containing tsconfig.json).
 * @param {string[]} [options.ignores]
 */
export function createReactLibraryConfig({ tsconfigRootDir, ignores = ['dist'] } = {}) {
  return tseslint.config(
    { ignores },

    js.configs.recommended,
    ...tseslint.configs.recommended,
    reactHooks.configs.flat.recommended,
    {
      name: 'react-hooks/compiler-rules-as-warnings',
      rules: Object.fromEntries(reactHooksCompilerRules.map((rule) => [`react-hooks/${rule}`, 'warn'])),
    },

    {
      files: ['**/*.{ts,tsx}'],
      languageOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        globals: globals.browser,
        parserOptions: {
          tsconfigRootDir,
        },
      },
      plugins: {
        'react-refresh': reactRefresh.plugin,
      },
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],
        'react-refresh/only-export-components': [
          'warn',
          {
            allowConstantExport: true,
          },
        ],
      },
    },
  )
}
