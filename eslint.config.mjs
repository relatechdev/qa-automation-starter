import js from '@eslint/js';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'test-results/',
      'playwright-report/',
      'blob-report/',
      '.auth/',
      '.claude/skills/playwright-cli/',
      '.claude/skills/playwright-trace/',
      'scripts/templates/',
    ],
  },

  js.configs.recommended,

  {
    files: ['**/*.mjs'],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // Playwright fixtures that need no other fixture are written `async ({}, use) => …`.
      'no-empty-pattern': 'off',
    },
  },

  {
    files: ['tests/**/*.ts', 'src/**/*.ts'],
    extends: [playwright.configs['flat/recommended']],
    rules: {
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-networkidle': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-page-pause': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-element-handle': 'error',
      'playwright/no-eval': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/no-useless-await': 'error',
      'playwright/missing-playwright-await': 'error',
      'playwright/no-skipped-test': ['error', { allowConditional: true }],
    },
  },

  {
    // Signing in and sweeping old test data are steps of a run, not checks.
    files: ['tests/setup/**/*.ts'],
    rules: { 'playwright/expect-expect': 'off' },
  },

  {
    files: ['src/pages/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='expect']",
          message: 'Page objects hold locators and actions. Assertions belong in the spec.',
        },
      ],
    },
  },

  {
    files: ['tests/web/**/*.ts', 'tests/api/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              importNames: ['test', 'expect'],
              message:
                "Import test and expect from '@/fixtures/test': they carry app, api and cleanup.",
            },
          ],
        },
      ],
    },
  },
);
