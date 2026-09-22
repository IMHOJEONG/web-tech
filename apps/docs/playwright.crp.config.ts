import { defineConfig } from '@playwright/test'

export default defineConfig({
    testDir: './crp-e2e',
    timeout: 15_000,
    expect: {
        timeout: 5_000,
    },
    fullyParallel: false,
    workers: 1,
    reporter: process.env.CI
        ? [
              ['list'],
              [
                  'html',
                  {
                      open: 'never',
                      outputFolder: 'playwright-report-crp',
                  },
              ],
          ]
        : [['list']],
    use: {
        browserName: 'chromium',
        headless: true,
        trace: 'retain-on-failure',
        viewport: { width: 1280, height: 800 },
    },
})
