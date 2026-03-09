import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Static HTML export only for production (Cloudflare Pages deployment).
  // In development we use the Next.js dev server directly.
  ...(isProd ? { output: 'export', trailingSlash: true } : {}),
  images: {
    // Static export requires unoptimized images
    unoptimized: true,
  },
};

export default nextConfig;
