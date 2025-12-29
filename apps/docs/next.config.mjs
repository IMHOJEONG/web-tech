/** @type {import('next').NextConfig} */
import createMDX from '@next/mdx'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig = {
    // Configure `pageExtensions` to include markdown and MDX files
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
    // Optionally, add any other Next.js config below,
    reactStrictMode: true,
    images: {
        qualities: [25, 50, 75, 90],
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
        ],
    },
})

const withNextIntl = createNextIntlPlugin('./shared/message/request.ts')

// Merge MDX config with Next.js config
export default withNextIntl(withMDX(nextConfig))
