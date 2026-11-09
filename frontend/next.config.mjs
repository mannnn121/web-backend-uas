/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactCompiler: true,
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    const backend = process.env.DEV_BACKEND_URL || "http://localhost:3000";
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backend}/api/backend/:path*`,
      },
    ];
  },
};

export default nextConfig;
