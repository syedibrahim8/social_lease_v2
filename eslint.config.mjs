// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  // Ignore build artifacts, dependencies, and the separate web/ frontend app
  // (it has its own ESLint config + tsconfig; the backend's type-checked rules
  // must not touch it).
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      'web/**',
      // Standalone dev scripts (run via tsx, not part of the build's tsconfig
      // project) — the type-checked rules can't resolve type info for them.
      'scripts/**',
      '*.config.mjs',
    ],
  },

  // Base JS + TypeScript recommended rules (type-checked).
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Enforce explicit, intentional code.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': 'warn',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },

  // Disable formatting rules that conflict with Prettier (keep this last).
  prettier
);
