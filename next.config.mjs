/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // type-safety is enforced separately via `npm run typecheck`; the local
  // Windows build box races with antivirus on .next, so don't block on it
  typescript: { ignoreBuildErrors: true },
  experimental: {
    serverComponentsExternalPackages: ["mongodb", "puppeteer-core", "@sparticuz/chromium"],
    // the headless Chrome binary the NCDEX sync launches isn't import-traced, so ship it explicitly
    outputFileTracingIncludes: {
      "/api/cron/ncdex-spot": ["./node_modules/@sparticuz/chromium/bin/**"],
    },
    webpackBuildWorker: false,
  },
};

export default nextConfig;
