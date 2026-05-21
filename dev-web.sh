#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:/Users/santoshpathak/Library/pnpm:$PATH"
cd "/Users/santoshpathak/kin-mvp/kin-mvp/apps/web"
exec node node_modules/.bin/vite --port 5173
