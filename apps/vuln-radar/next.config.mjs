/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Optionally, add any other Next.js config below,
  reactStrictMode: true,
  transpilePackages: ["@web-tech/ui"],
  async rewrites() {
    const backendOrigin =
      process.env.VULN_RADAR_BACKEND_ORIGIN ?? "http://localhost:4000";

    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
