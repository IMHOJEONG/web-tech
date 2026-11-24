/** @type {import('next').NextConfig} */
import createMDX from '@next/mdx'
import createNextIntlPlugin from 'next-intl/plugin'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'

import { shikiRehypeOptions } from './lib/shiki-options.js'
import { getLocalSearchRevision } from './lib/local-search-revision.ts'
import {
    getContentDeliveryMode,
    getPrivateContentRevision,
} from './lib/content-delivery-mode.ts'
import { resolveLocalContentRoot } from './lib/local-content-paths.ts'

const { env } = process
const appRoot = fileURLToPath(new URL('.', import.meta.url))
const contentMode = getContentDeliveryMode()
const contentRevision =
    contentMode === 'private-git'
        ? getPrivateContentRevision({
              DOCS_CONTENT_SOURCE: contentMode,
              DOCS_PRIVATE_CONTENT_REVISION: JSON.parse(
                  readFileSync(
                      new URL('./content-release.lock.json', import.meta.url),
                      'utf8'
                  )
              ).revision,
          })
        : ''
if (
    contentMode === 'private-git' &&
    env.DOCS_PRIVATE_CONTENT_REVISION &&
    env.DOCS_PRIVATE_CONTENT_REVISION !== contentRevision
) {
    throw new Error('Prepared content differs from the release lock')
}
const contentTraceRoot = contentRevision
    ? `./.generated-content/${contentRevision}`
    : '.'

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
        DOCS_CONTENT_SOURCE: contentMode,
        DOCS_PRIVATE_CONTENT_REVISION: contentRevision,
        // A non-secret content digest prevents Data Cache reuse across changed builds.
        DOCS_LOCAL_SEARCH_REVISION: getLocalSearchRevision(
            resolveLocalContentRoot(appRoot, contentRevision || undefined),
            contentRevision
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
            './public/**/*.{png,jpg,jpeg,webp,gif,avif,svg}',
            `${contentTraceRoot}/data/**/*.md`,
            `${contentTraceRoot}/data/**/*.mdx`,
            `${contentTraceRoot}/category/**/*.md`,
            `${contentTraceRoot}/category/**/*.mdx`,
        ],
    },
    outputFileTracingExcludes: contentRevision
        ? {
              '/*': [
                  './data/**',
                  './category/**',
                  './.generated-content/**/ready.json',
                  './.generated-content/assets.json',
              ],
          }
        : undefined,
    headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                ],
            },
            ...[
                '/offline-worker.js',
                '/offline-reader.js',
                '/offline-reader.css',
                '/offline.html',
            ].map((source) => ({
                source,
                headers: [
                    { key: 'Cache-Control', value: 'no-cache' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    ...(source === '/offline.html'
                        ? [
                              {
                                  key: 'Content-Security-Policy',
                                  value: "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
                              },
                          ]
                        : []),
                ],
            })),
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
                        value: "default-src 'none'; script-src 'self'; connect-src 'self'",
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
