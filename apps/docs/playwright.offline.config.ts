import { defineConfig } from '@playwright/test'

const port = 3018
export default defineConfig({
    testDir: './offline-e2e',
    workers: 1,
    retries: 0,
    reporter: [
        ['list'],
        ['json', { outputFile: 'test-results/offline-report/results.json' }],
        ['html', { outputFolder: 'playwright-report/offline', open: 'never' }],
    ],
    timeout: 60000,
    outputDir: 'test-results/offline',
    use: {
        baseURL: `http://127.0.0.1:${port}`,
        browserName: 'chromium',
        trace: 'retain-on-failure',
    },
    projects: [
        {
            name: 'offline-desktop',
            use: { viewport: { width: 1280, height: 800 } },
        },
        {
            name: 'offline-mobile',
            use: {
                viewport: { width: 390, height: 844 },
                isMobile: true,
                hasTouch: true,
            },
        },
    ],
    webServer: {
        command:
            process.env.NODE_ENV === 'production'
                ? `pnpm exec next start --port ${port} --hostname 127.0.0.1`
                : 'pnpm dev:e2e',
        url: `http://127.0.0.1:${port}`,
        reuseExistingServer: false,
        timeout: 120000,
        env: {
            DOCS_E2E_PORT: String(port),
            BLOG_CONTENT_INCLUDE_REMOTE_INDEX: 'false',
            BLOG_CONTENT_API_BASE_URL: '',
            BLOG_CONTENT_API_BASE_URL_PUBLIC: '',
            BLOG_CONTENT_API_BASE_URL_INTERNAL: '',
            BLOG_PUSH_ENABLED: 'false',
        },
    },
})
