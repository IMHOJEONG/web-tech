import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: './code-block-e2e',
    testMatch: '**/*.spec.ts',
    outputDir: 'test-results/code-block',
    workers: 1,
    retries: 0,
    reporter: 'list',
    use: { browserName: 'chromium', trace: 'retain-on-failure' },
    projects: [
        {
            name: 'code-desktop',
            use: { viewport: { width: 1280, height: 800 } },
        },
        {
            name: 'code-mobile',
            use: {
                viewport: { width: 390, height: 844 },
                isMobile: true,
                hasTouch: true,
            },
        },
    ],
})
