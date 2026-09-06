/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // type-safety is enforced separately via `npm run typecheck`; the local
  // Windows build box races with antivirus on .next, so don't block on it
  typescript: { ignoreBuildErrors: true },
  experimental: {
    serverComponentsExternalPackages: ["mongodb"],
    webpackBuildWorker: false,
  },
};

export default nextConfig;
