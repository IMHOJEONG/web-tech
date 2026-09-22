import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: './activity-e2e',
    timeout: 15_000,
    expect: { timeout: 5_000 },
    workers: 1,
    reporter: 'list',
    outputDir: 'test-results/activity',
    use: {
        browserName: 'chromium',
        headless: true,
        trace: 'retain-on-failure',
    },
    projects: [
        { name: 'chromium', metadata: { strict: false } },
        { name: 'chromium-strict', metadata: { strict: true } },
    ],
})
