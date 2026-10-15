# 04 — Application security review

Method: full read of every controller, guard, strategy, filter, interceptor
and user-scoped service in `apps/api`, the auth/API client/storage code in
`apps/web`, the deployment headers, the database RLS migration and the
storage policies; grep sweeps for injection sinks (raw SQL, `exec`,
`innerHTML`, `dangerouslySetInnerHTML`, redirects, file paths); behaviour
checks against Nest's `ValidationPipe` source; and **active verification
over HTTP** against the built API running in demo mode (see §4). Findings
are mapped to OWASP Top 10 (2021). Confidence is 1–10; only ≥ 8 is listed
as a finding, lower-confidence observations are in §3.

## 1. Findings

| # | Sev | Conf | Status | OWASP | Title | Location | Fix on this branch | Regression test |
|---|---|---|---|---|---|---|---|---|
| APP-1 | **HIGH** | 9 | VERIFIED + fixed | A01 Broken Access Control / A04 | Mass assignment on vault `PATCH` routes: bodies typed `Partial<AddDocumentDto>` / `Partial<AddNomineeDto>` compile to `Object`, which Nest's `ValidationPipe` skips (`toValidate` returns false for `Object`), so `whitelist`/`forbidNonWhitelisted` never ran and `Object.assign(doc, dto)` accepted `userId`, `docId`, `s3Key`. | `vault.controller.ts:84,132` (before) | Explicit `UpdateDocumentDto`/`UpdateNomineeDto` classes; services copy only an allow-list of columns; `ParseUUIDPipe` on ids; `ConfirmUploadDto.s3Key` must match `vault/<uuid>/<uuid>`. Verified over HTTP: the exploit body now returns `400 property s3Key should not exist`. | `vault.dto.spec.ts`, `vault.service.spec.ts` |
| APP-2 | **MEDIUM** | 9 | VERIFIED + fixed | A07 / A02 | WhatsApp webhook: hard-coded fallback verify token (public once open-sourced), challenge read from headers instead of query parameters (Meta sends query params, so the handshake could never succeed), and **no `X-Hub-Signature-256` verification** on inbound POSTs. Today inbound only logs, but the roadmap routes STOP/SCORE through it. | `lifecycle.controller.ts:71-115` (before) | No default token; query params; HMAC-SHA256 verification with `WHATSAPP_APP_SECRET` over the raw body (`rawBody: true` in both bootstraps); unsigned requests rejected in production, accepted with a warning elsewhere. | `webhook-signature.spec.ts`, `lifecycle.controller.spec.ts` |
| APP-3 | **MEDIUM** | 8 | VERIFIED + fixed | A09 | PII in logs: full phone numbers in WhatsApp send paths, full session token in compliance-violation logs, SQL bound parameters in dev query logs. | `whatsapp.service.ts:35,55`, `compliance-guard.service.ts:133`, `app.module.ts:75` | Masking, truncation, opt-in query logging. | covered by existing compliance spec; log lines inspected during live run |
| APP-4 | **MEDIUM** | 8 | VERIFIED, **mitigated, needs operator action** | A02 / A05 | Database TLS with `rejectUnauthorized: false` — the API accepts any certificate for the Postgres connection, enabling MITM of all user data in transit to the DB. | `app.module.ts:97-99` | New `DATABASE_SSL_REJECT_UNAUTHORIZED` (+ `DATABASE_SSL_CA`). **Default kept at the historical `false`** so the existing deployment keeps working; production startup now logs a warning. The owner must set it to `true` after confirming the provider's certificate chain. | — (config) |
| APP-5 | **MEDIUM** | 8 | VERIFIED + fixed | A04 (LLM spend) | Unbounded LLM calls per conversation: a single session could send unlimited turns (each a GPT-4o call); only the global 100/min/IP throttle applied. | `intake-agent.service.ts`, `ai-advisor.service.ts` | `MAX_CONVERSATION_TURNS` (default 40) → HTTP 429 beyond it. | behaviour is config-driven; covered by live run |
| APP-6 | **LOW** | 8 | VERIFIED + fixed | A04 | Public OTP endpoints shared the global rate limit (100/min/IP): OTP/WhatsApp flooding and OTP guessing pressure once delivery goes live. | `auth.controller.ts` | `@Throttle` 5/min/IP on send, 10/min/IP on verify (plus the existing single-use OTP which already defeats brute force). Vault routes now enforce the documented 10/min. | live run: 4th request → 429 |
| APP-7 | **LOW** | 8 | VERIFIED + fixed | A03 | `POST /score/calculate` accepted an unvalidated interface (`ParsedProfile`) — arbitrary JSON reached the engine and was persisted in `inputs_snapshot`. | `score.controller.ts:49` | Validated `CalculateScoreDto` with enums and bounds. Live run: junk body → 400. | `protection-score.service.spec.ts` covers engine guards |
| APP-8 | **LOW** | 9 | VERIFIED + fixed | A05 | Engines produced `NaN`/negative scores on invalid input (unknown band, negative or non-finite figures), which then flowed into audit rows and the UI. | `scoreEngine.ts`, `protection-score.service.ts` | Input guards; formulas unchanged. | both engine suites |

## 2. Controls verified as sound (no finding)

- **Authentication enforced server-side:** `JwtAuthGuard` registered as
  `APP_GUARD`; every route is protected unless `@Public()`. Public routes:
  anonymous session, OTP send/verify, Google stub, partner session/brand,
  WhatsApp webhook, health. The vault controller is `@Public()` only to
  bypass the *standard* guard and then requires the vault-scoped JWT
  (`VaultGuard`); confirmed over HTTP (standard token → 401, anonymous
  user cannot mint a vault token → 403).
- **Authorization / IDOR:** every by-id read or write checks ownership
  (`vault`, `nominee`, `bookings`, `advisor sessions`, `intake
  conversations`, `recommendation audits`, `score ↔ audit` link). Prior
  IDOR fixes from May 2026 confirmed present.
- **Injection:** TypeORM parameterised queries throughout; the single raw
  query (`DELETE /auth/me` count) uses a bound parameter. No `exec`,
  `spawn`, `eval`, `new Function`, `innerHTML`, `dangerouslySetInnerHTML`,
  `document.write`. React escapes output; model output is JSON-parsed and
  passed through the compliance regex guard before rendering as text.
- **SSRF / open redirect:** no server-side fetch of user-supplied URLs;
  the only outbound calls go to fixed SDK hosts. Partner purchase
  "redirect" is a URL returned to the client from a static allow-list;
  `window.open` uses `noopener,noreferrer`.
- **File upload:** no file bytes transit the API; clients PUT to 15-minute
  signed Supabase URLs under their own prefix; bucket is private with
  5 MB / PDF-JPEG-PNG limits; storage key never returned (verified:
  `confirm-upload` response has no `s3Key`).
- **Session handling:** stateless JWTs; `validateUser` re-checks the user
  row on every request so deleted users are rejected; vault scope has a
  separate secret and 1-hour expiry. JWT stored in `sessionStorage` (tab
  scoped, cleared on close). CSRF not applicable (bearer header, no
  cookies, CORS allow-list with explicit origins).
- **Security headers:** API uses Helmet (CSP default in prod, COEP off
  for embedding); web `vercel.json` sets a strict CSP (`default-src
  'self'`, no inline scripts, `frame-ancestors 'none'`), HSTS,
  `X-Frame-Options DENY`, `Referrer-Policy`, `Permissions-Policy`,
  `nosniff`.
- **Error handling:** global filter returns a fixed envelope; non-HTTP
  exceptions become `Internal server error` without stack traces; 5xx are
  logged server-side and sent to Sentry. Verified over HTTP.
- **Debug surfaces:** Swagger only outside production; TypeORM
  `synchronize` only for SQL.js; query logging now opt-in.
- **Secrets at rest:** OTPs stored as SHA-256 hashes, single-use, 5-min
  TTL; Aadhaar last-4 only; service-role key never in the web bundle (the
  web app has exactly one `VITE_` variable).
- **Database permissions:** RLS enabled on all user tables and on storage
  objects as defence in depth; the API's service role bypasses RLS by
  design, so application-layer ownership checks are the real control and
  are present everywhere.
- **LLM security:** user text is only ever placed in the `user` role,
  never in the system prompt; model replies are JSON-parsed with a
  fallback, then run through the deterministic compliance guard (insurer
  names, premiums, PII solicitation); the system prompt is stripped from
  transcripts returned to clients; conversation history is trimmed to 30
  messages; cost is now bounded per conversation (APP-5).

## 3. Observations below the reporting bar / accepted

- The `Partial<>` body type also appeared on `getUploadUrl` (`{ docId?:
  string }`); fixed in the same change (`UploadUrlDto`).
- Rate limiting uses the in-process Throttler store; on serverless each
  function instance counts separately, so limits are per-instance, not
  global. Acceptable for a pilot; move to a shared store (Redis/Upstash)
  before real scale.
- Vault step-up does not require a *fresh* OTP; a stolen standard token
  for a verified user can mint a vault token. Documented in code as a
  go-live task.
- `verifyWhatsAppOtp` upgrades the anonymous session whose
  `sessionToken` is supplied in the body. The token is a random UUID known
  only to that browser, so the risk is theoretical; noted.
- The web `AuthContext` contains a development fallback that marks the UI
  as "verified" when the API is unreachable. No token is issued, so no
  server-side access results; cosmetic only.
- `partner/session` does not bind the returned KIN session token to the
  partner's `userToken`; the partner layer is stateless by design.
- The serverless path's webhook HMAC falls back to re-serialising the
  parsed body if the platform consumed the raw stream; verify on the
  target platform before relying on inbound WhatsApp commands.

## 4. Active verification log (demo mode, built API, SQL.js)

| Check | Result |
|---|---|
| `GET /health` | `200 {status:ok, demoMode:true}` |
| Scripted diagnostic, 12 turns → `/complete` | profile persisted; legacy profile matches persona B |
| `POST /score/calculate` persona B | `17.9 / 33.3 / 13 / 0`, "Critical Risk" (matches hand computation) |
| `POST /score/calculate` junk body | `400` |
| Attacker `PATCH` own doc with victim `s3Key`+`userId` | `400 property s3Key should not exist` |
| Attacker `PATCH` victim doc | `403` |
| Attacker nominee `PATCH` with `userId` | `400` |
| Anonymous → `/auth/vault-token` | `403` |
| Standard JWT on `/vault/documents` | `401` |
| Webhook GET with the old hard-coded token | `403` |
| Webhook POST unsigned, development | `200` (sandbox) |
| 7 OTP requests in a burst | `201 ×3, 429 ×4` (earlier requests in the window counted) |
| Unknown conversation id | `404` with fixed envelope, no internals |
| API log after the run | phones masked to last 4, no JWTs |

## 5. Remaining risks requiring a decision

1. **APP-4** — flip `DATABASE_SSL_REJECT_UNAUTHORIZED=true` in production
   after confirming the Supabase pooler certificate validates (it should;
   supply `DATABASE_SSL_CA` otherwise).
2. Shared rate-limit store before scaling beyond a pilot.
3. Fresh-OTP step-up for the vault before vault go-live.
4. Replace the serialised-body fallback in the webhook signature check with
   a platform-verified raw body if WhatsApp commands become actionable.

This review is an AI-assisted read-through with targeted live tests. It is
not a penetration test and does not guarantee the absence of
vulnerabilities; a professional assessment is recommended before handling
real policyholder data at scale.
