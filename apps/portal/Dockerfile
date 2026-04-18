# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/portal/package.json apps/portal/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/github-app/package.json packages/github-app/package.json
RUN pnpm install --frozen-lockfile --filter @merged/portal...

FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/portal/node_modules ./apps/portal/node_modules
COPY --from=deps /repo/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /repo/packages/github-app/node_modules ./packages/github-app/node_modules
COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/portal ./apps/portal
COPY packages/db ./packages/db
COPY packages/github-app ./packages/github-app
# Build-time placeholders — these let Next collect page data without connecting
# to real services. Runtime env (from .env.portal) overrides them in production.
ENV DATABASE_URL=postgres://build:build@localhost:5432/build \
    AUTH_SECRET=build-placeholder-auth-secret-not-used-at-runtime \
    AUTH_URL=https://portal.merged.com.ua \
    AUTH_TRUST_HOST=true \
    AUTH_GOOGLE_ID=build-placeholder \
    AUTH_GOOGLE_SECRET=build-placeholder
RUN pnpm --filter @merged/portal build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Next.js standalone bundle — only what's needed
COPY --from=build /repo/apps/portal/.next/standalone/ ./
COPY --from=build /repo/apps/portal/.next/static ./apps/portal/.next/static
COPY --from=build /repo/apps/portal/public ./apps/portal/public

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health | grep -q '"status":"ok"' || exit 1

CMD ["node", "apps/portal/server.js"]
