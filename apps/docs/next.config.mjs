/** @type {import('next').NextConfig} */
import createMDX from '@next/mdx'
import createNextIntlPlugin from 'next-intl/plugin'

import { shikiRehypeOptions } from './lib/shiki-options.js'

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
        process.env.BLOG_CONTENT_ASSET_BASE_URL_PUBLIC,
        process.env.BLOG_CONTENT_ASSET_BASE_URL_INTERNAL,
        process.env.BLOG_CONTENT_ASSET_BASE_URL,
        process.env.BLOG_CONTENT_MARKDOWN_BASE_URL_PUBLIC,
        process.env.BLOG_CONTENT_MARKDOWN_BASE_URL_INTERNAL,
        process.env.BLOG_CONTENT_MARKDOWN_BASE_URL,
        process.env.BLOG_CONTENT_API_BASE_URL_PUBLIC,
        process.env.BLOG_CONTENT_API_BASE_URL_INTERNAL,
        process.env.BLOG_CONTENT_API_BASE_URL,
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
    // Configure `pageExtensions` to include markdown and MDX files
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
    // Optionally, add any other Next.js config below,
    reactStrictMode: true,
    transpilePackages: ['@web-tech/ui'],
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
