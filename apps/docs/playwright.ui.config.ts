import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: './ui-e2e',
    timeout: 15_000,
    expect: { timeout: 5_000 },
    workers: 1,
    reporter: 'list',
    outputDir: 'test-results/ui',
    use: { browserName: 'chromium', trace: 'retain-on-failure' },
    projects: [
        { name: 'light', use: { colorScheme: 'light' } },
        { name: 'dark', use: { colorScheme: 'dark' } },
    ],
})
