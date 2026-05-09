// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from '@angular-eslint/eslint-plugin';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import angularTemplateParser from '@angular-eslint/template-parser';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['dist/**', '.angular/**', 'coverage/**', '**/*.d.ts'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // ── TypeScript source files ───────────────────────────────────────────────
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      // Unused imports — dedicated plugin gives better auto-fix than no-unused-vars
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-vars': ['warn', {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      }],

      // TypeScript hygiene
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        disallowTypeAnnotations: false,
      }],
      '@typescript-eslint/no-empty-object-type': 'error',
      '@typescript-eslint/no-wrapper-object-types': 'error',

      // General correctness
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'warn',
      'object-shorthand': ['error', 'always'],
      'prefer-template': 'error',
    },
  },

  // ── Angular TypeScript ────────────────────────────────────────────────────
  {
    files: ['src/**/*.ts'],
    plugins: {
      '@angular-eslint': angular,
    },
    // @ts-expect-error — @angular-eslint types use Linter.RulesRecord, incompatible with FlatConfig.Rules at the type level; runtime behaviour is correct
    rules: {
      ...angular.configs.recommended.rules,
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'lba', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'lba', style: 'camelCase' },
      ],
      '@angular-eslint/use-lifecycle-interface': 'error',
      '@angular-eslint/no-empty-lifecycle-method': 'error',
      '@angular-eslint/prefer-output-readonly': 'error',
      '@angular-eslint/no-output-on-prefix': 'error',
      '@angular-eslint/no-input-rename': 'error',
      '@angular-eslint/no-output-rename': 'error',
      '@angular-eslint/prefer-inject': 'off',
      '@angular-eslint/component-max-inline-declarations': 'off',
    },
  },

  // ── Angular templates ─────────────────────────────────────────────────────
  {
    files: ['src/**/*.html'],
    languageOptions: {
      parser: angularTemplateParser,
    },
    plugins: {
      '@angular-eslint/template': angularTemplate,
    },
    rules: {
      ...angularTemplate.configs.recommended.rules,
      '@angular-eslint/template/alt-text': 'error',
      '@angular-eslint/template/elements-content': 'error',
      '@angular-eslint/template/label-has-associated-control': 'error',
      '@angular-eslint/template/no-duplicate-attributes': 'error',
      '@angular-eslint/template/no-negated-async': 'error',
      '@angular-eslint/template/banana-in-box': 'error',
    },
  },

  // ── Test files (Jest globals) ─────────────────────────────────────────────
  {
    files: ['src/**/*.spec.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,  // adds describe, it, expect, beforeEach, afterEach, jest, etc.
      },
    },
  },

  prettierConfig,
);
