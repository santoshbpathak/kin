# Partner Embedding — Security Checklist (PRIORITY before go-live)

> **Status:** KIN currently runs **standalone** on `app.kin.ai.in` and is **not**
> embeddable (CSP `frame-ancestors 'none'` + `X-Frame-Options: DENY`).
> **Do NOT enable partner iframe embedding without completing every item below.**
> Embedding turns a same-origin app into a cross-origin, multi-tenant surface and
> re-opens clickjacking, token-theft, and tenant-isolation risks. Treat this as a
> blocking checklist, not a guideline.

Owner: _assign before first partner_ · Last reviewed: 2026-05-30

---

## 0. Threat model that embedding introduces
- **Clickjacking** — a malicious site frames KIN and tricks users into clicking.
- **Cross-origin token/PII theft** — a hostile parent frame or a non-allowlisted
  embedder reading or driving the KIN iframe.
- **`partner_id` spoofing** — the brand/partner is selected from a URL param today
  (`BrandProvider` → `GET /partner/brand/:partnerKey`); an attacker can set any id.
- **Tenant bleed** — one partner's users/data reachable from another partner's embed.
- **`postMessage` abuse** — unvalidated cross-frame messages.

---

## 1. Framing controls (replace the standalone lockdown)
In [`apps/web/vercel.json`](../../apps/web/vercel.json):
- [ ] **Remove `X-Frame-Options: DENY`** (it's all-or-nothing and conflicts with
      embedding — modern browsers honour CSP `frame-ancestors` instead).
- [ ] Change CSP **`frame-ancestors 'none'`** → an **explicit allowlist** of partner
      origins, e.g. `frame-ancestors https://partnerA.com https://app.partnerB.in`.
      **Never** use `frame-ancestors *` or `'self' *`.
- [ ] Keep all other CSP directives strict (`script-src 'self'`, etc.).
- [ ] If different partners need different ancestors, generate the CSP per-deployment
      or move framing enforcement to the API/edge keyed by the validated partner.

## 2. CORS (API)
In [`apps/api/src/main.ts`](../../apps/api/src/main.ts) / `PARTNER_EMBED_ALLOWED_ORIGINS`:
- [ ] Populate `PARTNER_EMBED_ALLOWED_ORIGINS` with the **exact** partner origins
      (scheme + host, no wildcards). The code already restricts CORS to this list in
      prod — verify it is non-empty and correct for every partner.
- [ ] Re-confirm `credentials: true` is still required; if tokens stay in the
      `Authorization` header (not cookies), prefer `credentials: false`.
- [ ] Reject requests whose `Origin` is not allowlisted (do not echo arbitrary origins).

## 3. `partner_id` / partner resolution (anti-spoofing)
- [ ] Treat the URL `partner_id` as **untrusted input**. Validate it server-side
      against `partner_config`; reject unknown ids.
- [ ] Bind the partner to the **session** at creation (`POST /partner/session`) and
      stamp it into the JWT (a `partnerId` claim), rather than trusting the client to
      re-send it on each call.
- [ ] Enforce that every partner-scoped resource read/write matches the JWT's
      `partnerId` (same object-ownership pattern we use for `userId`/`sessionToken`).
- [ ] `GET /partner/brand/:partnerKey` returns only **public** branding — confirm it
      leaks no secrets, internal config, or other partners' data, and rate-limit it
      (it's `@Public` and enumerable).

## 4. Tenant isolation
- [ ] Every query that can be partner-specific must filter by the validated partner,
      not just by user. Audit: scores, recommendations, vault, engagement, content.
- [ ] Add automated tests: partner A's token must get **404** on partner B's resources
      (mirror the IDOR tests in the security suite).

## 5. `postMessage` / frame communication (if used)
- [ ] If KIN ↔ parent frame messaging is added, **always** check `event.origin`
      against the partner allowlist before acting, and specify a target origin on
      `postMessage` (never `'*'`).
- [ ] Never expose tokens, PII, or score data via `postMessage` to the parent.

## 6. Tokens & storage inside an iframe
- [ ] The JWT and PII currently live in `sessionStorage`/`localStorage` (see audit
      finding #4). Inside a cross-origin iframe this is **per-frame** storage, but a
      hostile embedder + any XSS still exfiltrates it. Before embedding, move
      sensitive data **server-side** (the backend vault already exists) or to
      **httpOnly, SameSite cookies** scoped to the API origin.
- [ ] Set cookies (if introduced) `SameSite=None; Secure` only for explicitly
      allowlisted partner contexts; otherwise `SameSite=Lax/Strict`.
- [ ] Consider the iframe `sandbox` attribute guidance you give partners
      (e.g. `sandbox="allow-scripts allow-forms allow-same-origin"` — note
      `allow-same-origin` + `allow-scripts` together weakens sandboxing).

## 7. Vault step-up (ties to audit #5)
- [ ] Before the vault is reachable in an embedded context, require a **fresh OTP
      re-authentication** to mint a vault-scope token (today `issueVaultToken` only
      checks identity, not recency — see the inline NOTE in `auth.service.ts`).

## 8. Rate limiting (ties to audit findings A/C)
- [ ] Embedding multiplies traffic and abuse surface. Move `@nestjs/throttler` to a
      **shared store (Redis/Upstash)**, fix the `ttl` units bug, and key limits by
      **user/partner** rather than IP (many embedded users share a partner's egress IP).

## 9. Verification before enabling any partner
- [ ] Load KIN inside a **test partner page** on an allowlisted origin → works.
- [ ] Load KIN inside a **non-allowlisted** page → browser blocks the frame.
- [ ] Re-run the IDOR/exploit suite with two partners → cross-partner access = 404.
- [ ] DevTools console on the embedded app shows **no CSP violations**.
- [ ] Pen-test the `partner_id` spoofing and `postMessage` paths specifically.

---

### Quick reference — what changes from standalone → embedded
| Control | Standalone (now) | Embedded (then) |
|---|---|---|
| `X-Frame-Options` | `DENY` | **remove** |
| CSP `frame-ancestors` | `'none'` | **explicit partner allowlist** |
| CORS origins | app origin only | + validated partner origins |
| `partner_id` | n/a | validated server-side, bound to JWT |
| Token/PII storage | Web Storage (interim) | server-side / httpOnly cookie |
| Vault token | identity gate | **fresh-OTP step-up** |
| Rate limiting | per-instance (interim) | shared store, keyed by user/partner |
