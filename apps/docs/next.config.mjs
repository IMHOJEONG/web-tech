/** @type {import('next').NextConfig} */
import createMDX from '@next/mdx'
import createNextIntlPlugin from 'next-intl/plugin'
import { fileURLToPath } from 'node:url'

import { shikiRehypeOptions } from './lib/shiki-options.js'
import { getLocalSearchRevision } from './lib/local-search-revision.ts'

const { env } = process

function toRemotePattern(value) {
    const trimmedValue = value?.trim()

    if (!trimmedValue) {
        return null
    }

    try {
        const url = new URL(trimmedValue)

        return {
            protocol: url.protocol.replace(':', ''),
            hostname: url.hostname,
            port: url.port,
            pathname: '/**',
        }
    } catch {
        return null
    }
}

function getRemoteImagePatterns() {
    const candidates = [
        env.BLOG_CONTENT_ASSET_BASE_URL_PUBLIC,
        env.NEXT_PUBLIC_BLOG_CONTENT_ASSET_BASE_URL_PUBLIC,
        env.BLOG_CONTENT_ASSET_BASE_URL_INTERNAL,
        env.BLOG_CONTENT_ASSET_BASE_URL,
        env.BLOG_CONTENT_MARKDOWN_BASE_URL_PUBLIC,
        env.BLOG_CONTENT_MARKDOWN_BASE_URL_INTERNAL,
        env.BLOG_CONTENT_MARKDOWN_BASE_URL,
        env.BLOG_CONTENT_API_BASE_URL_PUBLIC,
        env.BLOG_CONTENT_API_BASE_URL_INTERNAL,
        env.BLOG_CONTENT_API_BASE_URL,
    ]

    const patterns = candidates
        .map((value) => toRemotePattern(value))
        .filter((value) => value !== null)

    return patterns.filter((pattern, index, array) => {
        return (
            array.findIndex(
                (candidate) =>
                    candidate.protocol === pattern.protocol &&
                    candidate.hostname === pattern.hostname &&
                    candidate.port === pattern.port &&
                    candidate.pathname === pattern.pathname
            ) === index
        )
    })
}

const nextConfig = {
    env: {
        // A non-secret content digest prevents Data Cache reuse across changed builds.
        DOCS_LOCAL_SEARCH_REVISION: getLocalSearchRevision(
            fileURLToPath(new URL('.', import.meta.url))
        ),
    },
    // Configure `pageExtensions` to include markdown and MDX files
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
    // Optionally, add any other Next.js config below,
    reactStrictMode: true,
    transpilePackages: ['@web-tech/ui'],
    outputFileTracingIncludes: {
        '/og/article.png': ['./public/fonts/Pretendard-Bold.otf'],
        '/*': [
            './data/**/*.md',
            './data/**/*.mdx',
            './category/**/*.md',
            './category/**/*.mdx',
        ],
    },
    headers() {
        return [
            {
                source: '/push-sw.js',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-cache, no-store, must-revalidate',
                    },
                    {
                        key: 'Content-Type',
                        value: 'application/javascript; charset=utf-8',
                    },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'none'; script-src 'self'",
                    },
                ],
            },
        ]
    },
    redirects() {
        const aliases = [
            '/docs/category/fe/react/test',
            '/docs/drawer-aria-focus-management',
            '/category/fe/react/drawer-aria-focus-management',
            '/category/fe/react/test',
        ]
        const destination = '/docs/ui-ux/blocked-aria-hidden'
        return aliases.flatMap((source) => [
            { source, destination, permanent: true },
            {
                source: `/:locale(ko|en)${source}`,
                destination: `/:locale${destination}`,
                permanent: true,
            },
        ])
    },
    images: {
        qualities: [25, 50, 75, 90],
        remotePatterns: getRemoteImagePatterns(),
    },
}

const withMDX = createMDX({
    experimental: {
        mdxRs: true,
    },
    options: {
        remarkPlugins: [
            // Without options
            'remark-gfm',
            // With options
            ['remark-toc', { heading: 'The Table' }],
        ],
        rehypePlugins: [
            // Without options
            'rehype-slug',
            // With options
            ['rehype-katex', { strict: true, throwOnError: true }],
            ['@shikijs/rehype', shikiRehypeOptions],
        ],
    },
})

const withNextIntl = createNextIntlPlugin('./shared/message/request.ts')

// Merge MDX config with Next.js config
export default withNextIntl(withMDX(nextConfig))
