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
      // Ignore all root-level scripts and test files
      '*.ts',
      '*.mts',
      '*.mjs',
      '*.js',
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
