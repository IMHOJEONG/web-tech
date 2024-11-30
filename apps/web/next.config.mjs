/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Optionally, add any other Next.js config below,
  reactStrictMode: true,
  transpilePackages: ["@web-tech/ui"],
};

export default nextConfig;
