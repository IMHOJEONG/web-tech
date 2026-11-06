import { defineConfig } from '@playwright/test'
import articleConfig from './playwright.article.config'

const servers = articleConfig.webServer
if (!Array.isArray(servers) || servers.length !== 2)
    throw new Error(
        'Review the experiment after the article server config changes'
    )

export default defineConfig({
    ...articleConfig,
    testMatch: '**/cache-generation.experiment.ts',
    webServer: [
        servers[0]!,
        {
            ...servers[1]!,
            command:
                'pnpm build && node --import ./article-e2e/local-io-probe.ts --import ./article-e2e/request-lifecycle-probe.ts --import ./article-e2e/cache-observation-probe.ts --import ./article-e2e/cache-generation-probe.ts ./node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3111',
        },
    ],
})
