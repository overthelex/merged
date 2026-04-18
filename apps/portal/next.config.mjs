import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Pin the tracing root to the monorepo root so the standalone bundle uses
  // predictable 'apps/portal/server.js' paths (matches Dockerfile CMD).
  outputFileTracingRoot: path.join(__dirname, '../..'),
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  // @merged/db is a workspace package with raw TS — Next needs to transpile it
  transpilePackages: ['@merged/db', '@merged/github-app'],
};

export default nextConfig;
