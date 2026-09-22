import { defineConfig } from '@playwright/test'

const baseURL = 'http://127.0.0.1:3115'

export default defineConfig({
    testDir: './e2e',
    testMatch: ['mobile-drawer-close.spec.ts', 'hub-topic-filters.spec.ts'],
    outputDir: 'test-results/ui-consumer',
    workers: 1,
    timeout: 30_000,
    expect: { timeout: 5_000 },
    reporter: 'list',
    use: { baseURL, browserName: 'chromium', trace: 'retain-on-failure' },
    webServer: {
        command:
            'pnpm build && pnpm exec next start --hostname 127.0.0.1 --port 3115',
        url: `${baseURL}/ko/about`,
        timeout: 180_000,
        reuseExistingServer: false,
        env: {
            BLOG_CONTENT_INCLUDE_REMOTE_INDEX: 'false',
            BLOG_CONTENT_API_BASE_URL: '',
            BLOG_CONTENT_API_BASE_URL_INTERNAL: '',
            BLOG_CONTENT_API_BASE_URL_PUBLIC: '',
            DOCS_BETTER_STACK_SOURCE_TOKEN: '',
            DOCS_BETTER_STACK_INGESTING_URL: '',
            DOCS_ENABLE_REACT_INSPECTION: 'false',
        },
    },
    projects: [
        {
            name: 'chromium-mobile',
            use: {
                viewport: { width: 390, height: 844 },
                isMobile: true,
                hasTouch: true,
            },
        },
        {
            name: 'chromium-desktop',
            testIgnore: 'mobile-drawer-close.spec.ts',
            use: { viewport: { width: 1280, height: 800 } },
        },
    ],
})
