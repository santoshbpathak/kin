/**
 * Meta (WhatsApp Business Cloud API) webhook signature verification.
 *
 * Meta signs every POST with `X-Hub-Signature-256: sha256=<hex HMAC>` over the
 * raw request body using the app secret. Pure helpers so they can be unit
 * tested without an HTTP context.
 */
import { createHmac, timingSafeEqual } from 'crypto'

export function computeMetaSignature(rawBody: Buffer | string, appSecret: string): string {
  return 'sha256=' + createHmac('sha256', appSecret).update(rawBody).digest('hex')
}

export function verifyMetaSignature(
  rawBody: Buffer | string | undefined,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!rawBody || !signatureHeader || !appSecret) return false
  const expected = Buffer.from(computeMetaSignature(rawBody, appSecret))
  const received = Buffer.from(String(signatureHeader).trim())
  if (expected.length !== received.length) return false
  return timingSafeEqual(expected, received)
}

/** Constant-time string comparison for the GET verify-token handshake. */
export function safeEqual(a: string | undefined, b: string | undefined): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}
