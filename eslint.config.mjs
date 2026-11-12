import globals from 'globals';
import html from 'eslint-plugin-html';
import js from '@eslint/js';

const auditedFiles = [
    'games/lofi-pup.html',
    'eslint.config.mjs',
    'playwright.config.mjs',
    'tests/**/*.{js,mjs}',
];

export default [
    {
        ...js.configs.recommended,
        files: auditedFiles,
    },
    {
        files: ['games/lofi-pup.html'],
        plugins: { html },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                dataLayer: 'writable',
            },
        },
        rules: {
            'eqeqeq': ['error', 'always'],
            'no-implicit-globals': 'error',
            'no-redeclare': ['error', { builtinGlobals: false }],
            'no-undef': 'error',
            'no-unused-vars': ['error', { vars: 'all', args: 'none', caughtErrors: 'all' }],
        },
    },
    {
        files: ['eslint.config.mjs', 'playwright.config.mjs', 'tests/**/*.{js,mjs}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        rules: {
            'eqeqeq': ['error', 'always'],
            'no-redeclare': ['error', { builtinGlobals: false }],
            'no-undef': 'error',
            'no-unused-vars': ['error', { vars: 'all', args: 'none', caughtErrors: 'all' }],
        },
    },
    {
        ignores: [
            'games/*.js',
            'games/high-society/**',
            'music/**',
            'node_modules/',
            'playwright-report/',
            'test-results/',
        ],
    },
];
