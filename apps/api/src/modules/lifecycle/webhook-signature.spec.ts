import { computeMetaSignature, verifyMetaSignature, safeEqual } from './webhook-signature'

const SECRET = 'demo-app-secret-not-real'
const BODY = Buffer.from(JSON.stringify({ object: 'whatsapp_business_account', entry: [] }))

describe('verifyMetaSignature', () => {
  it('accepts a signature computed with the same secret over the same bytes', () => {
    expect(verifyMetaSignature(BODY, computeMetaSignature(BODY, SECRET), SECRET)).toBe(true)
  })
  it('rejects a signature made with a different secret', () => {
    expect(verifyMetaSignature(BODY, computeMetaSignature(BODY, 'other'), SECRET)).toBe(false)
  })
  it('rejects a tampered body', () => {
    const sig = computeMetaSignature(BODY, SECRET)
    expect(verifyMetaSignature(Buffer.from(BODY.toString() + ' '), sig, SECRET)).toBe(false)
  })
  it('rejects a missing header, missing body or empty secret', () => {
    expect(verifyMetaSignature(BODY, undefined, SECRET)).toBe(false)
    expect(verifyMetaSignature(undefined, computeMetaSignature(BODY, SECRET), SECRET)).toBe(false)
    expect(verifyMetaSignature(BODY, computeMetaSignature(BODY, SECRET), '')).toBe(false)
  })
  it('rejects a header of a different length without throwing', () => {
    expect(verifyMetaSignature(BODY, 'sha256=abc', SECRET)).toBe(false)
  })
})

describe('safeEqual', () => {
  it('compares strings in constant time semantics', () => {
    expect(safeEqual('token', 'token')).toBe(true)
    expect(safeEqual('token', 'token2')).toBe(false)
    expect(safeEqual(undefined, 'token')).toBe(false)
  })
})
