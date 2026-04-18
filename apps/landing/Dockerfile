# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/landing/package.json apps/landing/package.json
RUN pnpm install --frozen-lockfile --filter @merged/landing...

FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/landing/node_modules ./apps/landing/node_modules
COPY pnpm-workspace.yaml package.json ./
COPY tsconfig.base.json ./
COPY apps/landing ./apps/landing
ARG NEXT_PUBLIC_PORTAL_BASE_URL=https://portal.legal.org.ua
ENV NEXT_PUBLIC_PORTAL_BASE_URL=$NEXT_PUBLIC_PORTAL_BASE_URL
RUN pnpm --filter @merged/landing build

FROM caddy:2-alpine AS runtime
COPY --from=build /repo/apps/landing/out /srv/www
RUN printf ':8080 {\n\troot * /srv/www\n\tfile_server\n\tencode zstd gzip\n\ttry_files {path} {path}/ {path}.html =404\n}\n' > /etc/caddy/Caddyfile
EXPOSE 8080
