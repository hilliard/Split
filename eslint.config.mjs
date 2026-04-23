import js from '@eslint/js';
import tsEslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier/recommended';
import noUnsanitized from 'eslint-plugin-no-unsanitized';

export default [
  {
    ignores: [
      'dist',
      '.astro',
      'node_modules',
      '.env*',
      'coverage',
      // Ignore root-level utility scripts (not src files)
      'check-*.ts',
      'check-*.mjs',
      'check-*.js',
      'setup-*.ts',
      'create-*.ts',
      'debug-*.ts',
      'debug-*.mjs',
      'inspect-*.ts',
      'list-*.ts',
      'make-*.ts',
      'reset-*.ts',
      'set-*.ts',
      'verify-*.mjs',
      'fix-*.mjs',
      'fix-*.ts',
      'add-*.ts',
      'apply-*.mjs',
      'apply-*.mts',
      'cleanup-*.mjs',
      'delete-*.mjs',
      'diagnose-*.mjs',
      'execute-*.mjs',
      'find-*.mjs',
      'link-*.ts',
      'migrate-*.ts',
      'migrate-*.mjs',
      'populate-*.ts',
      'run-*.mjs',
      'run-*.ts',
      'seed-*.mjs',
      'quick-*.mjs',
      'test-*.ts',
      'test-*.mjs',
      'test-*.js',
      'scripts/',
      '*.sql',
      // Ignore directories
      'analytics/',
      'migrations/',
      'playwright-report/',
      'test-results/',
      'exports/',
    ],
  },
  js.configs.recommended,
  ...tsEslint.configs.recommended,
  prettier,
  {
    plugins: {
      'no-unsanitized': noUnsanitized,
    },
  },
  {
    files: [
      'src/**/*.{ts,tsx,astro}',
      '*.config.{ts,mjs}',
      'vitest.config.ts',
      'playwright.config.ts',
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.astro'],
      },
    },
    rules: {
      'prettier/prettier': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      // Security: Prevent template literal injection vulnerabilities
      'no-unsanitized/method': 'error',
      'no-unsanitized/property': 'warn',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tsEslint.configs.disableTypeChecked,
  },
];
