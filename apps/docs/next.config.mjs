/** @type {import('next').NextConfig} */
import createMDX from '@next/mdx'

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

// Merge MDX config with Next.js config
export default withMDX(nextConfig)
