import { defineConfig } from '@playwright/test'
import articleConfig from './playwright.article.config'

// Explicit observation mode; the normal suite and production settings stay unchanged.
export default defineConfig({
    ...articleConfig,
    use: {
        ...articleConfig.use,
        extraHTTPHeaders: {
            ...articleConfig.use?.extraHTTPHeaders,
            'x-article-cache-probe': '1',
        },
    },
})
