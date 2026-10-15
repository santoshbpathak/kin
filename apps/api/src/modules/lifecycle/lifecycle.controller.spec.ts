import { ForbiddenException } from '@nestjs/common'
import { LifecycleController } from './lifecycle.controller'
import { computeMetaSignature } from './webhook-signature'

const SECRET = 'demo-app-secret-not-real'

function controller(config: Record<string, unknown>) {
  const cfg = { get: (key: string) => config[key] }
  const prefs = {} as never
  const whatsapp = { parseInboundMessage: (body: string) => ({ command: body.trim().toUpperCase(), raw: body }) } as never
  return new LifecycleController(prefs, whatsapp, cfg as never)
}

function inbound(body: object, secret?: string) {
  const raw = Buffer.from(JSON.stringify(body))
  const req = { rawBody: raw, body } as never
  const sig = secret ? computeMetaSignature(raw, secret) : undefined
  return { req, sig, body }
}

describe('LifecycleController — WhatsApp webhook verification (GET)', () => {
  it('echoes the challenge only for mode=subscribe with the configured token', () => {
    const c = controller({ 'whatsapp.webhookVerifyToken': 'verify-me' })
    expect(c.verifyWebhook('subscribe', '12345', 'verify-me')).toBe('12345')
  })
  it('rejects a wrong token and a wrong mode', () => {
    const c = controller({ 'whatsapp.webhookVerifyToken': 'verify-me' })
    expect(() => c.verifyWebhook('subscribe', '12345', 'guess')).toThrow(ForbiddenException)
    expect(() => c.verifyWebhook('unsubscribe', '12345', 'verify-me')).toThrow(ForbiddenException)
  })
  it('has no default token: an unset token disables the handshake', () => {
    const c = controller({})
    expect(() => c.verifyWebhook('subscribe', '12345', 'kin_webhook_verify_2026')).toThrow(ForbiddenException)
  })
})

describe('LifecycleController — WhatsApp inbound (POST) signature enforcement', () => {
  const payload = { object: 'whatsapp_business_account', entry: [{ changes: [{ value: { messages: [{ type: 'text', from: '919999999999', text: { body: 'STOP' } }] } }] }] }

  it('accepts a correctly signed payload', () => {
    const c = controller({ 'whatsapp.appSecret': SECRET, nodeEnv: 'production' })
    const { req, sig, body } = inbound(payload, SECRET)
    expect(c.handleInbound(req, sig, body as never)).toEqual({ status: 'ok' })
  })
  it('rejects an unsigned payload in production', () => {
    const c = controller({ 'whatsapp.appSecret': SECRET, nodeEnv: 'production' })
    const { req, body } = inbound(payload)
    expect(() => c.handleInbound(req, undefined, body as never)).toThrow(ForbiddenException)
  })
  it('rejects a payload signed with the wrong secret', () => {
    const c = controller({ 'whatsapp.appSecret': SECRET, nodeEnv: 'production' })
    const { req, sig, body } = inbound(payload, 'wrong')
    expect(() => c.handleInbound(req, sig, body as never)).toThrow(ForbiddenException)
  })
  it('rejects everything in production when no app secret is configured', () => {
    const c = controller({ nodeEnv: 'production' })
    const { req, sig, body } = inbound(payload, SECRET)
    expect(() => c.handleInbound(req, sig, body as never)).toThrow(ForbiddenException)
  })
  it('accepts unsigned payloads outside production when no secret is configured (sandbox)', () => {
    const c = controller({ nodeEnv: 'development' })
    const { req, body } = inbound(payload)
    expect(c.handleInbound(req, undefined, body as never)).toEqual({ status: 'ok' })
  })
})
