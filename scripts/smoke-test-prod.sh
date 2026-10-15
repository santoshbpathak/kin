#!/usr/bin/env bash
# Production end-to-end smoke test for the KIN API.
#
# Usage:
#   ./scripts/smoke-test-prod.sh [base-url]
#
# Defaults to https://api.kin.ai.in. Exits non-zero on any failed assertion.

set -euo pipefail

BASE="${1:-https://api.kin.ai.in}"
API="$BASE/api/v1"
TMPDIR="$(mktemp -d)"
trap "rm -rf $TMPDIR" EXIT

# ── Pretty-printers ──────────────────────────────────────────────
pass()  { echo "  PASS - $*"; }
fail()  { echo "  FAIL - $*" >&2; exit 1; }
header() { echo ""; echo "── $* ──"; }

# ── Helpers ──────────────────────────────────────────────────────
require_status() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    pass "$label (HTTP $actual)"
  else
    fail "$label (expected HTTP $expected, got $actual)"
  fi
}

extract_field() {
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$1',''))"
}

# ── Test 1: Anonymous session ─────────────────────────────────────
header "1. POST /auth/session (anonymous)"
START=$(python3 -c "import time;print(int(time.time()*1000))")
curl -s -o "$TMPDIR/s1.json" -w "%{http_code}" -X POST "$API/auth/session" > "$TMPDIR/s1.code"
END=$(python3 -c "import time;print(int(time.time()*1000))")
require_status "anonymous session" "201" "$(cat $TMPDIR/s1.code)"
TOKEN=$(extract_field token < "$TMPDIR/s1.json")
[ -n "$TOKEN" ] || fail "no token returned"
pass "JWT received (length ${#TOKEN}, cold-start latency $((END-START))ms)"

# ── Test 2: Protected endpoint without auth ──────────────────────
header "2. GET /score/latest with NO token (should 401)"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API/score/latest")
require_status "unauth /score/latest" "401" "$CODE"

# ── Test 3: OTP send with phone field ────────────────────────────
header "3. POST /auth/whatsapp/otp"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/whatsapp/otp" \
  -H "Content-Type: application/json" \
  -d '{"phone":"${SMOKE_PHONE:?Set SMOKE_PHONE to a Meta test number (an OTP will be sent to it)}"}')
require_status "otp send" "201" "$CODE"

# ── Test 4: Google OAuth stub ────────────────────────────────────
header "4. POST /auth/google (should 501)"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/auth/google")
require_status "google stub" "501" "$CODE"

# ── Test 5: Score save (auth) ────────────────────────────────────
header "5. POST /score/save (auth)"
curl -s -o "$TMPDIR/s5.json" -w "%{http_code}" -X POST "$API/score/save" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"compositeScore":62,"lifeSubScore":58,"healthSubScore":70,"incomeSubScore":55,"ruleVersion":"v1.0.0","inputsSnapshot":{"incomeBand":"10_20l"}}' > "$TMPDIR/s5.code"
require_status "score save" "201" "$(cat $TMPDIR/s5.code)"
SCORE_ID=$(extract_field scoreId < "$TMPDIR/s5.json")
[ -n "$SCORE_ID" ] || fail "no scoreId returned"
pass "scoreId=$SCORE_ID"

# ── Test 6: Recommendations audit log ────────────────────────────
header "6. POST /trust/recommendations (audit log)"
curl -s -o "$TMPDIR/s6.json" -w "%{http_code}" -X POST "$API/trust/recommendations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"scoreId\":\"$SCORE_ID\",\"recommendations\":[{\"id\":\"R1\",\"recommendationType\":\"term_life\",\"basisText\":\"Smoke test basis\",\"irdaiRuleReference\":\"IRDAI test\"}]}" > "$TMPDIR/s6.code"
require_status "rec audit log" "201" "$(cat $TMPDIR/s6.code)"
AUDIT_ID=$(python3 -c "import sys,json; d=json.load(sys.stdin); print(d['audits'][0]['auditId'])" < "$TMPDIR/s6.json")
[ -n "$AUDIT_ID" ] || fail "no auditId returned"
pass "auditId=$AUDIT_ID"

# ── Test 7: See the Math fetches the audit row ───────────────────
header "7. GET /trust/see-the-math/:auditId (own audit)"
curl -s -o "$TMPDIR/s7.json" -w "%{http_code}" -X GET "$API/trust/see-the-math/$AUDIT_ID" \
  -H "Authorization: Bearer $TOKEN" > "$TMPDIR/s7.code"
require_status "see-the-math own" "200" "$(cat $TMPDIR/s7.code)"
BASIS=$(extract_field basisText < "$TMPDIR/s7.json")
if [ "$BASIS" = "Smoke test basis" ]; then
  pass "basisText returned verbatim"
else
  fail "basisText mismatch (got: $BASIS)"
fi

# ── Test 8: IDOR check — another user's token cannot read it ─────
header "8. GET /trust/see-the-math/:auditId with OTHER user's token (should 404)"
OTHER_TOKEN=$(curl -s -X POST "$API/auth/session" | extract_field token)
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API/trust/see-the-math/$AUDIT_ID" \
  -H "Authorization: Bearer $OTHER_TOKEN")
require_status "see-the-math foreign" "404" "$CODE"

# ── Test 9: Vault token issuance ─────────────────────────────────
header "9. POST /auth/vault-token"
curl -s -o "$TMPDIR/s9.json" -w "%{http_code}" -X POST "$API/auth/vault-token" \
  -H "Authorization: Bearer $TOKEN" > "$TMPDIR/s9.code"
require_status "vault token issue" "201" "$(cat $TMPDIR/s9.code)"
VAULT_TOKEN=$(extract_field vaultToken < "$TMPDIR/s9.json")
[ -n "$VAULT_TOKEN" ] || fail "no vaultToken returned"

# ── Test 10: Vault doc create ────────────────────────────────────
header "10. POST /vault/document (vault token)"
curl -s -o "$TMPDIR/s10.json" -w "%{http_code}" -X POST "$API/vault/document" \
  -H "Authorization: Bearer $VAULT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"docType":"term_life","insurerName":"Smoke Test Insurer","policyNumber":"ST-001","sumAssured":1000000}' > "$TMPDIR/s10.code"
require_status "vault doc create" "201" "$(cat $TMPDIR/s10.code)"
DOC_ID=$(extract_field docId < "$TMPDIR/s10.json")
[ -n "$DOC_ID" ] || fail "no docId returned"

# ── Test 11: Vault Storage signed upload URL ─────────────────────
header "11. POST /vault/document/upload-url (real Supabase signed URL)"
curl -s -o "$TMPDIR/s11.json" -w "%{http_code}" -X POST "$API/vault/document/upload-url" \
  -H "Authorization: Bearer $VAULT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"docId\":\"$DOC_ID\"}" > "$TMPDIR/s11.code"
require_status "upload-url" "201" "$(cat $TMPDIR/s11.code)"
UPLOAD_URL=$(extract_field uploadUrl < "$TMPDIR/s11.json")
S3KEY=$(extract_field s3Key < "$TMPDIR/s11.json")
if echo "$UPLOAD_URL" | grep -q '\.supabase\.co'; then
  pass "real Supabase signed URL returned"
elif echo "$UPLOAD_URL" | grep -q 'kin-vault-documents.local'; then
  fail "stub URL returned - Supabase not configured in production env"
else
  fail "unexpected URL: $UPLOAD_URL"
fi

# ── Test 12: PUT a sample file to Storage ────────────────────────
header "12. PUT sample PDF to signed upload URL"
echo "%PDF-1.4 KIN smoke test marker" > "$TMPDIR/sample.pdf"
CODE=$(curl -s -o "$TMPDIR/s12.body" -w "%{http_code}" -X PUT "$UPLOAD_URL" \
  -H "Content-Type: application/pdf" \
  --data-binary "@$TMPDIR/sample.pdf")
if [ "$CODE" = "200" ] || [ "$CODE" = "201" ]; then
  pass "uploaded to Supabase Storage (HTTP $CODE)"
else
  fail "upload failed (HTTP $CODE): $(cat $TMPDIR/s12.body)"
fi

# ── Test 13: Confirm + download flow ─────────────────────────────
header "13. confirm-upload then download-url then GET file"
CODE=$(curl -s -o "$TMPDIR/s13a.json" -w "%{http_code}" -X POST "$API/vault/document/confirm-upload" \
  -H "Authorization: Bearer $VAULT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"docId\":\"$DOC_ID\",\"s3Key\":\"$S3KEY\"}")
require_status "confirm-upload" "201" "$CODE"

CODE=$(curl -s -o "$TMPDIR/s13b.json" -w "%{http_code}" -X GET "$API/vault/document/$DOC_ID/download-url" \
  -H "Authorization: Bearer $VAULT_TOKEN")
require_status "download-url" "200" "$CODE"
DOWNLOAD_URL=$(extract_field downloadUrl < "$TMPDIR/s13b.json")

CODE=$(curl -s -o "$TMPDIR/s13c.pdf" -w "%{http_code}" "$DOWNLOAD_URL")
if [ "$CODE" = "200" ] && grep -q "KIN smoke test marker" "$TMPDIR/s13c.pdf"; then
  pass "file fetched back from Storage and content matches"
else
  fail "file fetch failed (HTTP $CODE) or content mismatch"
fi

# ── Done ─────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo "  ALL 13 SMOKE TESTS PASSED against $API"
echo "============================================================"
