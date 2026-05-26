/**
 * Sentry initialisation - safe to call even when SENTRY_DSN is unset
 * (then it is a no-op so local dev does not need an account).
 *
 * In production with a DSN set, Sentry captures:
 *   - Unhandled exceptions thrown above the HttpExceptionFilter
 *   - HTTP 5xx responses (set in HttpExceptionFilter)
 *   - Bootstrap-time failures (this is initialised before NestFactory.create)
 */

// Sentry is loaded dynamically so the api package can build/run without
// @sentry/node installed in environments that do not need it.
let SentryRef: typeof import('@sentry/node') | null = null

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    SentryRef = require('@sentry/node')
    SentryRef!.init({
      dsn,
      environment: process.env.NODE_ENV ?? 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
      // Strip common PII fields server-side before sending events.
      beforeSend(event) {
        if (event.request?.headers) {
          delete event.request.headers['authorization']
          delete event.request.headers['cookie']
        }
        if (event.request?.data && typeof event.request.data === 'object') {
          const data = event.request.data as Record<string, unknown>
          for (const k of ['otp', 'phone', 'mobile', 'aadhaar', 'aadhaarLast4', 'whatsappNumber']) {
            if (k in data) data[k] = '[redacted]'
          }
        }
        return event
      },
    })
    // eslint-disable-next-line no-console
    console.log('[sentry] initialised')
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[sentry] init skipped - @sentry/node not installed:', (err as Error).message)
  }
}

export function captureException(err: unknown): void {
  if (!SentryRef) return
  SentryRef.captureException(err)
}
