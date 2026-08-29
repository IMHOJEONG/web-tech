import { defineConfig } from '@playwright/test'

const port = Number.parseInt(process.env.DOCS_E2E_PORT ?? '3001', 10)
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    expect: {
        timeout: 5_000,
    },
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI
        ? [
              ['list'],
              ['html', { open: 'never', outputFolder: 'playwright-report' }],
          ]
        : [['list']],
    use: {
        baseURL,
        trace: 'on-first-retry',
    },
    webServer: {
        command: 'pnpm dev:e2e',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
            BLOG_CONTENT_INCLUDE_REMOTE_INDEX: 'false',
            BLOG_CONTENT_API_BASE_URL: '',
            BLOG_CONTENT_API_BASE_URL_INTERNAL: '',
            BLOG_CONTENT_API_BASE_URL_PUBLIC: '',
        },
    },
    projects: [
        {
            name: 'chromium-mobile',
            use: {
                browserName: 'chromium',
                hasTouch: true,
                isMobile: true,
                viewport: { width: 390, height: 844 },
            },
        },
        {
            name: 'chromium-tablet',
            use: {
                browserName: 'chromium',
                hasTouch: true,
                viewport: { width: 768, height: 1024 },
            },
        },
        {
            name: 'chromium-desktop',
            use: {
                browserName: 'chromium',
                viewport: { width: 1280, height: 800 },
            },
        },
    ],
})
