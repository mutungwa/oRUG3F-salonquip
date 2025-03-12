/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.module.rules.push({
        test: /\.(html|css)$/,
        type: 'asset/source',
        include: /src\/server\/libraries\/email\/internal\/templates/,
      });
    }
    return config;
  },
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['src/server/libraries/email/internal/templates/**/*'],
    },
  },
  // Generate unique build ID for proper caching
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  // Prevent API response caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  }
};

export default nextConfig;
