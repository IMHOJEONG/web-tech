import { defineConfig } from '@playwright/test'

// Isolated expected-failure input; never discovered by the product suites.
export default defineConfig({
    testDir: './evidence-fixtures',
    workers: 1,
    retries: 0,
    timeout: 10000,
    outputDir: 'test-results/offline/retention-probe',
    reporter: [
        ['list'],
        [
            'json',
            { outputFile: 'test-results/offline-report/retention-probe.json' },
        ],
        [
            'html',
            {
                outputFolder: 'playwright-report/offline/retention-probe',
                open: 'never',
            },
        ],
    ],
    use: { browserName: 'chromium', trace: 'retain-on-failure' },
})
