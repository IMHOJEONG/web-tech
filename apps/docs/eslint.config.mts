import nextJsConfig from '@web-tech/eslint-config/next-js'
import globals from 'globals'

/** @type {import("eslint").Linter.Config} */
export default [
    ...nextJsConfig,
    {
        files: [
            'next.config.mjs',
            '*.config.mjs',
            '*.config.js',
            '*.config.cjs',
            'scripts/**/*.mjs',
        ],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
    {
        // These Node CLIs also contain callbacks executed in the browser.
        files: [
            'scripts/verify-deployed-article-shell.cjs',
            'scripts/verify-deployed-fonts.cjs',
            'scripts/trace-deployed-rendering.cjs',
            'scripts/measure-deployed-performance.mjs',
        ],
        languageOptions: {
            globals: { ...globals.node, ...globals.browser },
        },
    },
    {
        files: [
            'scripts/verify-deployed-article-shell.cjs',
            'scripts/verify-deployed-fonts.cjs',
            'scripts/trace-deployed-rendering.cjs',
        ],
        languageOptions: {
            sourceType: 'commonjs',
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
    {
        files: ['scripts/verify-deployed-article-shell.cjs'],
        rules: {
            'turbo/no-undeclared-env-vars': [
                'warn',
                { allowList: ['SHELL_OUTPUT'] },
            ],
        },
    },
    {
        files: ['scripts/trace-deployed-rendering.cjs'],
        rules: {
            'turbo/no-undeclared-env-vars': [
                'warn',
                { allowList: ['TRACE_OUTPUT', 'NO_FONTS'] },
            ],
        },
    },
    {
        files: ['scripts/measure-deployed-performance.mjs'],
        rules: {
            'turbo/no-undeclared-env-vars': [
                'warn',
                { allowList: ['PERF_OUTPUT'] },
            ],
        },
    },
]
