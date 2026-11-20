import type { NextConfig } from 'next';

const mediaBaseUrl = process.env.MEDIA_PUBLIC_BASE_URL;
const remotePattern = mediaBaseUrl
  ? (() => {
      const url = new URL(mediaBaseUrl);
      return {
        protocol: url.protocol.replace(':', '') as 'http' | 'https',
        hostname: url.hostname,
        port: url.port,
        pathname: '/**',
      };
    })()
  : null;

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  serverExternalPackages: ['argon2', 'sharp'],
  images: {
    remotePatterns: remotePattern ? [remotePattern] : [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;

