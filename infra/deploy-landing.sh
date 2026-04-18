#!/usr/bin/env bash
# Build landing locally-ish on the EC2 and swap the webroot atomically.
# Usage: run on the EC2 as deploy user from /srv/merged.
set -euo pipefail

REPO_DIR="/srv/merged/src"
RELEASE_TS="$(date -u +%Y%m%dT%H%M%SZ)"
RELEASE_DIR="/srv/merged/releases/landing-${RELEASE_TS}"
CURRENT_LINK="/srv/merged/landing"

cd "${REPO_DIR}"
git fetch --prune origin
git reset --hard origin/main

pnpm install --frozen-lockfile --prod=false
pnpm --filter @merged/landing build

mkdir -p "${RELEASE_DIR}"
cp -r apps/landing/out/. "${RELEASE_DIR}/"

ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}"
echo "Deployed landing → ${RELEASE_DIR}"

# Keep only last 5 releases
ls -1dt /srv/merged/releases/landing-* | tail -n +6 | xargs -r rm -rf

sudo systemctl reload caddy
