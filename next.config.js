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
  // Copy email templates to the build directory
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['src/server/libraries/email/internal/templates/**/*'],
    },
  },
};

module.exports = nextConfig;
