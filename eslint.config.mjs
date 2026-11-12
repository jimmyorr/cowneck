import globals from 'globals';
import html from 'eslint-plugin-html';
import js from '@eslint/js';

const auditedHtmlFiles = [
    'games/high-fidelity.html',
    'games/lofi-pup.html',
    'games/donut-chef.html',
    'games/slope-builder.html',
    'games/shore-road.html',
];

const auditedFiles = [
    ...auditedHtmlFiles,
    'games/donut-chef-logic.js',
    'games/donut-chef.test.js',
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
        files: auditedHtmlFiles,
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
        files: ['games/donut-chef-logic.js', 'games/donut-chef.test.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
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
            '!games/donut-chef-logic.js',
            '!games/donut-chef.test.js',
            'games/high-society/**',
            'music/**',
            'node_modules/',
            'playwright-report/',
            'test-results/',
        ],
    },
];
