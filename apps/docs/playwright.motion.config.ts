import { defineConfig } from '@playwright/test'
import base from './playwright.config'

export default defineConfig({
    ...base,
    testDir: './motion-e2e',
    outputDir: 'test-results/motion',
    workers: 1,
    retries: 0,
    reporter: [
        ['list'],
        ['json', { outputFile: 'test-results/motion-results.json' }],
    ],
    use: { ...base.use, trace: 'retain-on-failure' },
    projects: [
        {
            name: 'motion-chromium-320',
            use: {
                browserName: 'chromium',
                viewport: { width: 320, height: 844 },
                isMobile: true,
                hasTouch: true,
            },
        },
        {
            name: 'motion-chromium-390',
            use: {
                browserName: 'chromium',
                viewport: { width: 390, height: 844 },
                isMobile: true,
                hasTouch: true,
            },
        },
        {
            name: 'motion-chromium-desktop',
            use: {
                browserName: 'chromium',
                viewport: { width: 1280, height: 900 },
            },
        },
        {
            name: 'motion-webkit-390',
            use: {
                browserName: 'webkit',
                viewport: { width: 390, height: 844 },
                isMobile: true,
                hasTouch: true,
            },
        },
    ],
})
