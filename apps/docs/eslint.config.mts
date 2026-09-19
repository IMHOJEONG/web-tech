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
        // The standalone CommonJS CLI contains Playwright browser callbacks.
        files: ['scripts/verify-deployed-article-shell.cjs'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: { ...globals.node, ...globals.browser },
        },
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
            'turbo/no-undeclared-env-vars': [
                'warn',
                { allowList: ['SHELL_OUTPUT'] },
            ],
        },
    },
]
