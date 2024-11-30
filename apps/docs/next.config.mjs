import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions` to include markdown and MDX files
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Optionally, add any other Next.js config below,
  reactStrictMode: true,
  experimental: {
    mdxRs: true,
  },
  transpilePackages: ["@web-tech/ui", "next-mdx-remote"],
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
  options: {},
});

// Merge MDX config with Next.js config
export default withMDX(nextConfig);
