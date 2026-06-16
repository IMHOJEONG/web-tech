import nextJsConfig from '@web-tech/eslint-config/next-js'
import globals from 'globals'

/** @type {import("eslint").Linter.Config} */
export default [
    ...nextJsConfig,
    {
        files: ['next.config.mjs', '*.config.mjs', '*.config.js', '*.config.cjs'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
]
