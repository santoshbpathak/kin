#!/usr/bin/env bash
# Generates fresh secret values to paste into Vercel env vars.
#
# Usage: ./scripts/generate-secrets.sh
#
# Output is plaintext to stdout. Pipe through `pbcopy` on macOS or `xclip` on
# Linux if you want to grab the whole block at once.

set -euo pipefail

if ! command -v openssl >/dev/null 2>&1; then
  echo "ERROR: openssl is required but not installed." >&2
  exit 1
fi

JWT_SECRET=$(openssl rand -hex 32)
VAULT_JWT_SECRET=$(openssl rand -hex 32)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=$(openssl rand -hex 16)

cat <<EOF
# ── Paste these into Vercel kin-api project env vars (Production scope) ──
# Generated $(date -u +"%Y-%m-%dT%H:%M:%SZ")

JWT_SECRET=$JWT_SECRET
VAULT_JWT_SECRET=$VAULT_JWT_SECRET
WHATSAPP_WEBHOOK_VERIFY_TOKEN=$WHATSAPP_WEBHOOK_VERIFY_TOKEN

# ── DO NOT commit this output. Save in a password manager note titled
# ── "KIN go-live secrets" alongside Supabase keys.
EOF
