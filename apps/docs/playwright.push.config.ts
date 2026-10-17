import { defineConfig } from '@playwright/test'
import base from './playwright.config'

const port = 3017

export default defineConfig({
    ...base,
    testDir: './e2e-push',
    projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
    use: { ...base.use, baseURL: `http://127.0.0.1:${port}` },
    webServer: {
        command: 'pnpm dev:e2e',
        url: `http://127.0.0.1:${port}`,
        reuseExistingServer: false,
        timeout: 120000,
        env: {
            DOCS_E2E_PORT: String(port),
            BLOG_PUSH_ENABLED: 'true',
            BLOG_PUSH_WAF_VERIFIED: 'false',
            BLOG_PUSH_INVITE_CODE: 'a'.repeat(64),
            BLOG_PUSH_SESSION_SECRET: 'b'.repeat(64),
            BLOG_PUSH_API_BASE_URL: '',
            BLOG_PUSH_API_TOKEN: '',
            BLOG_CONTENT_INCLUDE_REMOTE_INDEX: 'false',
            BLOG_CONTENT_API_BASE_URL: '',
            BLOG_CONTENT_API_BASE_URL_INTERNAL: '',
            BLOG_CONTENT_API_BASE_URL_PUBLIC: '',
        },
    },
})
