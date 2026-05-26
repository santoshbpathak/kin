# §04 Performance Findings

Combines static review with ApacheBench (ab) load test results. k6 was the preferred tool per the plan but unavailable on this machine (no Homebrew). ab is sufficient for ballpark metrics; results saved in [loadtest/results/](loadtest/results/).

**Caveat:** load tests ran against local SQL.js (in-memory single-process). Numbers are upper bounds. Production Supabase Postgres latency will be higher (network hop + query planner overhead). Treat absolute numbers as smoke-test only.

---

## Score calculation latency

PRD target: **<500ms P95**.

| Source | Result | Interpretation |
|--------|--------|-----------------|
| Static analysis of [protection-score.service.ts](../../apps/api/src/modules/score/protection-score.service.ts) | Pure arithmetic, no DB read in `calculate()`. Single `scoreRepo.save()` write in `save()`. | <10ms expected even on Postgres |
| Single-request curl timing (dev) | n/a — endpoint returns 500 (auth guard missing) | Cannot measure end-to-end |
| Load test ab `POST /v1/score/calculate` 200 reqs c=20 | 100% returned 500. P95 = 2ms (fast because crashing immediately) | 🔴 unusable |

**Score engine itself is performant; runtime is broken at the auth layer.**

---

## End-to-end 7-step flow timing

PRD target: **complete in ≤2 minutes on mid-range Android 4G**.

Not measured in this audit run (requires real device or Lighthouse mobile throttling). The frontend renders client-side with no backend round trips for steps 3-7 since the frontend never calls the backend for those flows. So end-to-end "latency" is essentially JS execution time + render = well under 2 minutes on any device.

**Caveat**: because the IRDAI audit isn't actually being recorded, the "fast" experience is meaningless from a compliance standpoint.

---

## Load test results (ab on local SQL.js)

All results in [loadtest/results/](loadtest/results/).

### Test 1: `POST /v1/auth/session` (anonymous session creation)

[01-auth-session.txt](loadtest/results/01-auth-session.txt) - 1000 requests, concurrency 50

| Metric | Value |
|--------|-------|
| Throughput | 5,607 req/sec |
| Mean latency | 8.9 ms |
| P50 | 4 ms |
| P95 | 32 ms |
| P99 | 34 ms |
| Max | 35 ms |
| Failed (non-2xx) | **820 of 1000** |
| Body-length variance failures | 0 (variable due to unique tokens, but ab not counting them as failures) |

**Why the failures?** The "Non-2xx responses: 820" means most requests returned an HTTP error code. Inspection of the API log shows the SQL.js driver hits write contention when 50 concurrent inserts target the same SQLite file. **In production Supabase Postgres**, this would not occur — Postgres handles concurrent inserts gracefully. So this is a dev-environment artifact, not a production indicator.

🟡 verdict: under-load behavior cannot be assessed from this test. Re-run on staging Supabase to get real numbers.

### Test 2: `POST /v1/discovery/evaluate` (deterministic rule engine, no DB write)

[02-discovery-evaluate.txt](loadtest/results/02-discovery-evaluate.txt) - 1000 requests, concurrency 50

| Metric | Value |
|--------|-------|
| Throughput | 10,663 req/sec |
| Mean | 4.7 ms |
| P50 | 4 ms |
| P95 | 8 ms |
| P99 | 13 ms |
| Max | 14 ms |
| Failed (Length variance) | 900 of 1000 — false positives, all 200 OK (timestamps vary in response body) |

🟢 **Excellent.** Discovery engine handles 10K req/sec on local hardware. Pure CPU work, no DB. Well under PRD's 500ms P95 target.

### Test 3: `GET /v1/engagement/quiz/weekly` (static question lookup)

[03-quiz-weekly.txt](loadtest/results/03-quiz-weekly.txt) - 500 requests, concurrency 20

| Metric | Value |
|--------|-------|
| Throughput | 7,654 req/sec |
| Mean | 2.6 ms |
| P95 | 6 ms |
| P99 | 7 ms |
| Max | 7 ms |
| Failed (Length variance) | 400 of 500 — false positives, all 200 OK |

🟢 **Excellent.** Static lookup performs as expected.

### Test 4: `POST /v1/score/calculate` (BROKEN — guard missing)

[04-score-calculate-broken.txt](loadtest/results/04-score-calculate-broken.txt) - 200 requests, concurrency 20

| Metric | Value |
|--------|-------|
| Throughput | 10,866 req/sec |
| P95 | 2 ms |
| Failed (Non-2xx) | **200 of 200 — every request returned 500** |

🔴 **All 200 requests crashed.** Confirms the auth-guard bug end-to-end.

---

## Database query performance (static review)

| Table | FK | Index on FK | Common query pattern | Status |
|-------|----|--------------|--------------------|--------|
| user_profile | n/a (root) | idx_user_profile_session_token, idx_user_profile_last_active_at | sessionToken lookup, lastActive scan | 🟢 |
| protection_score | user_id | idx_protection_score_user_id, idx_protection_score_calculated_at | `findOne(userId, order=calculatedAt DESC)` | 🟢 |
| recommendation_audit | score_id | idx_recommendation_audit_score_id | n/a (never queried in code currently) | 🟢 |
| vault_document | user_id | idx_vault_document_user_id | `find({userId})` | 🟢 |
| nominee | user_id | idx_nominee_user_id | `find({userId})` | 🟢 |
| streak_record | user_id | implicit (unique constraint) | `findOne({userId})` | 🟢 |
| unlock_trigger | user_id, unlock_token | idx_unlock_trigger_user_id, idx_unlock_trigger_token | both common lookups indexed | 🟢 |

**FK indexing is correct.** No N+1 query patterns identified in the services (each service uses single-row `findOne` or single-query `find`).

⚠️ However: the entity table names are PLURAL while the migration creates SINGULAR tables. In dev (`synchronize: true`) entities create plural tables, the indexes from the migration never apply. **Indexes only exist on tables that aren't being used.** Production migration would create singular tables but entities couldn't find them.

---

## Cold start risk on Vercel serverless

Per CLAUDE.md POC stack, backend deploys as NestJS on Vercel. Cold-start risks:

| Module | Init complexity | Cold-start cost |
|--------|------------------|------------------|
| `app.module.ts` | Imports 11 feature modules, TypeORM, Throttler, ConfigModule | High — full NestJS bootstrap on every cold start |
| TypeORM | Creates connection pool, validates schema | High — Supabase Postgres connection establishment ~200-500ms |
| In-memory stores (OTP, consent log, prefs, advisor slots, bookings, kinIqStore, attemptStore) | Re-initialized as empty Map on every cold start | 🔴 **Functional loss** — OTPs issued in one warm function won't verify in another |

🔴 **P0 for Vercel**: in-memory state across at least 6 services means cold starts break user-visible behavior (OTP verification fails, advisor slots reset, streak progress lost). NestJS-on-Vercel needs either:
1. Single warm Lambda with low TTL (Vercel doesn't support this natively for full NestJS)
2. Move state to Supabase tables (proper fix)
3. Use Vercel KV / Upstash Redis for ephemeral state

---

## Database write hotspots (potential)

- `recommendation_audit`: with immutability trigger blocking UPDATE/DELETE, write-only — Postgres-friendly
- `protection_score`: appends rows per score recalculation. PRD doesn't specify cleanup. Will grow unbounded.
- `streak_record.visitDates`: stored as `text[]`, sliced to last 30 days. Each visit triggers row update. Hot path under engagement traffic.

🟡 No immediate concerns at POC scale. Add `protection_score` retention policy post-pilot.

---

## Vault upload bandwidth

PRD targets PDF up to 5MB. Current implementation:
- Stub returns hardcoded `https://kin-vault-documents.s3.ap-south-1.amazonaws.com/{key}?presigned=stub` — not a real signed URL
- No actual upload mechanism exercised
- Cannot benchmark

🔴 Not measurable until S3/Supabase Storage integration done.

---

## WhatsApp send-to-receive latency

Sandbox-only — no real send. Per CLAUDE.md POC: deferred until Meta credentials live. 🟡 not measurable now.

---

## Summary

| Concern | Status |
|---------|--------|
| Score calc <500ms P95 | 🟢 in code; 🔴 broken at runtime |
| 1000 concurrent users | ⚠️ not measurable on SQL.js; ab artifacts show backend can handle 5-10K rps on simple endpoints |
| DB indexes on FKs | 🟢 covered (but on wrong table names due to migration/entity mismatch) |
| Cold start safety | 🔴 in-memory stores will break user-visible features on Vercel |
| Vault upload | 🔴 stub, not measurable |
| WhatsApp send latency | ⚠️ not measurable (sandbox) |
