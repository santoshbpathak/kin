/**
 * Lightweight API client. Centralises:
 *   - Bearer token injection (from sessionStorage `kin_jwt`)
 *   - Base URL handling (configurable via VITE_API_BASE_URL; defaults to /api/v1
 *     which both the Vite dev server and the production vercel.json rewrite to
 *     the API host)
 *   - Error envelope (throws a typed ApiError; callers can decide to fall back
 *     to local-only mode)
 *
 * This is kept dependency-free (fetch only) so it works in any browser.
 */

const TOKEN_KEY = 'kin_jwt'

// In production, set VITE_API_BASE_URL=https://api.kin.ai.in/api/v1 in Vercel.
// In dev, leaving it unset uses the relative /api/v1 path which the Vite proxy
// (or vercel.json rewrite) forwards to the API.
const API_BASE = (import.meta.env?.VITE_API_BASE_URL as string | undefined) ?? '/api/v1'

export class ApiError extends Error {
  status: number
  body?: unknown
  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

export function getJwt(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setJwt(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

// ── Anonymous session bootstrap ──────────────────────────────────────────
// The whole product is "anonymous until you choose to save". Every backend
// route is behind a JWT guard, but an anonymous identity token is enough for
// the anonymous journey (diagnostic, AI advisor, etc.). A token is normally
// minted by the diagnostic consent screen, but screens reachable directly from
// the bottom nav (e.g. /connect) need one too. So we lazily mint an anonymous
// session the first time an authed request finds no token. This does NOT set
// the AuthContext consent session, so the diagnostic consent screen still shows.
let sessionPromise: Promise<void> | null = null

function isAuthPath(path: string): boolean {
  return path.startsWith('/auth') || path.startsWith('auth')
}

async function ensureAnonymousSession(): Promise<void> {
  if (getJwt()) return
  if (!sessionPromise) {
    sessionPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          // Pure anonymous identity — no data-use consent is granted here; that
          // remains the job of the diagnostic consent screen.
          body: JSON.stringify({
            consent: { diagnosticData: false, locationData: false, contactData: false },
          }),
        })
        if (res.ok) {
          const data = (await res.json()) as { token?: string }
          if (data.token) setJwt(data.token)
        }
      } catch {
        // API unavailable — proceed tokenless; the caller's error handling runs.
      } finally {
        // Allow a retry on a later request if this attempt produced no token.
        if (!getJwt()) sessionPromise = null
      }
    })()
  }
  return sessionPromise
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  body?: unknown
  headers?: Record<string, string>
  /** Override the token (used by vault calls that need the vault-scope JWT) */
  token?: string | null
}

export async function apiRequest<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...opts.headers,
  }
  // For default-token requests with no token yet, lazily mint an anonymous
  // session so direct-entry screens work. Callers that pass an explicit token
  // (e.g. vault-scope) or hit /auth routes are left untouched.
  if (opts.token === undefined && !getJwt() && !isAuthPath(path)) {
    await ensureAnonymousSession()
  }
  const token = opts.token === undefined ? getJwt() : opts.token
  if (token) headers['Authorization'] = `Bearer ${token}`
  const init: RequestInit = {
    method: opts.method ?? 'GET',
    headers,
  }
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(opts.body)
  }

  const url = `${API_BASE}${path.startsWith('/') ? path : '/' + path}`
  const res = await fetch(url, init)
  const text = await res.text()
  const body = text ? safeJsonParse(text) : undefined

  if (!res.ok) {
    const message =
      (body && typeof body === 'object' && 'error' in (body as Record<string, unknown>)
        ? extractMessage((body as { error: unknown }).error)
        : null) ?? res.statusText ?? `HTTP ${res.status}`
    throw new ApiError(res.status, message, body)
  }
  return body as T
}

function safeJsonParse(s: string): unknown {
  try {
    return JSON.parse(s)
  } catch {
    return undefined
  }
}

function extractMessage(err: unknown): string | null {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (typeof e.message === 'string') return e.message
    if (Array.isArray(e.message)) return e.message.join('; ')
  }
  return null
}
