import { defineConfig } from '@playwright/test'

const baseURL = 'http://127.0.0.1:3111'
const contentURL = 'http://127.0.0.1:3112'

export default defineConfig({
    testDir: './article-e2e',
    testMatch: '**/*.spec.ts',
    timeout: 30_000,
    expect: { timeout: 10_000 },
    workers: 1,
    retries: 0,
    reporter: [['list']],
    use: {
        baseURL,
        browserName: 'chromium',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    webServer: [
        {
            command:
                'node --experimental-strip-types article-e2e/content-server.ts',
            url: `${contentURL}/health`,
            reuseExistingServer: false,
        },
        {
            command:
                'pnpm build && pnpm exec next start --hostname 127.0.0.1 --port 3111',
            url: `${baseURL}/ko/about`,
            timeout: 180_000,
            reuseExistingServer: false,
            env: {
                // Override every candidate so a local .env cannot select the NAS.
                BLOG_CONTENT_API_BASE_URL: contentURL,
                BLOG_CONTENT_API_BASE_URL_PUBLIC: contentURL,
                BLOG_CONTENT_API_BASE_URL_INTERNAL: contentURL,
                BLOG_CONTENT_MARKDOWN_BASE_URL: contentURL,
                BLOG_CONTENT_MARKDOWN_BASE_URL_PUBLIC: contentURL,
                BLOG_CONTENT_MARKDOWN_BASE_URL_INTERNAL: contentURL,
                BLOG_CONTENT_ASSET_BASE_URL: '',
                BLOG_CONTENT_ASSET_BASE_URL_PUBLIC: '',
                BLOG_CONTENT_ASSET_BASE_URL_INTERNAL: '',
                NEXT_PUBLIC_BLOG_CONTENT_ASSET_BASE_URL_PUBLIC: '',
                BLOG_CONTENT_API_POSTS_PATH: '/api/posts',
                BLOG_CONTENT_MARKDOWN_PATH_PREFIX: '/posts',
                BLOG_CONTENT_API_TOKEN: 'article-e2e-only-token',
                BLOG_CONTENT_REVALIDATE_TOKEN: 'article-e2e-only-revalidation',
                BLOG_CONTENT_INCLUDE_REMOTE_INDEX: 'true',
                // Avoid a natural TTL expiry masking a broken webhook assertion.
                BLOG_CONTENT_REVALIDATE_SECONDS: '3600',
                BLOG_CONTENT_API_TIMEOUT_MS: '2500',
                DOCS_BETTER_STACK_SOURCE_TOKEN: '',
                DOCS_BETTER_STACK_INGESTING_URL: '',
                DOCS_BETTER_STACK_ENVIRONMENT: '',
                DOCS_ENABLE_REACT_INSPECTION: 'false',
            },
        },
    ],
    projects: [
        {
            name: 'article-mobile',
            use: {
                viewport: { width: 390, height: 844 },
                isMobile: true,
                hasTouch: true,
            },
        },
        {
            name: 'article-desktop',
            use: { viewport: { width: 1280, height: 800 } },
        },
    ],
})
