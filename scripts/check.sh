#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/audit-dependencies.mjs
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm audit:dist
