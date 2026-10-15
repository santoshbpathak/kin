#!/usr/bin/env bash
# Start only the web dev server (the API is started separately with
# `pnpm --filter api dev:local`). Paths are relative to this script.
set -euo pipefail
cd "$(dirname "$0")/apps/web"
exec pnpm exec vite --port 5173
