/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  // @merged/db is a workspace package with raw TS — Next needs to transpile it
  transpilePackages: ['@merged/db'],
};

export default nextConfig;
