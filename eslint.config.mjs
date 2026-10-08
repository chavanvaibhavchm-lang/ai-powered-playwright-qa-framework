import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'allure-results/**',
      'allure-report/**',
      'playwright-report/**',
      'test-results/**',
      'test-history/**',
      'docs/evidence/**',
      'scripts/*.cjs',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // Playwright fixtures require an object destructuring parameter, even with no dependencies.
  { files: ['fixtures/*.ts'], rules: { 'no-empty-pattern': 'off' } },
);
