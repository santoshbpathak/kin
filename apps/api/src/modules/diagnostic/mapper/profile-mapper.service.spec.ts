import { mapIncomeBand } from './profile-mapper.service'

describe('mapIncomeBand (Brief §5 income-format normalisation)', () => {
  it('prefers exact figure when present', () => {
    // ₹22 lakhs == 2_200_000 -> 20l_50l per score-engine enum
    expect(mapIncomeBand(2_200_000, '20-40L')).toBe('20l_50l')
  })

  it('₹22L exact maps to the same internal band whichever UI band was tagged', () => {
    expect(mapIncomeBand(2_200_000, null)).toBe('20l_50l')
    expect(mapIncomeBand(2_200_000, '20-40L')).toBe('20l_50l')
    expect(mapIncomeBand(2_200_000, '10-20L')).toBe('20l_50l')
  })

  it('falls back to UI band when no exact figure given', () => {
    expect(mapIncomeBand(null, '<5L')).toBe('3l_5l')
    expect(mapIncomeBand(null, '5-10L')).toBe('5l_10l')
    expect(mapIncomeBand(null, '10-20L')).toBe('10l_20l')
    expect(mapIncomeBand(null, '20-40L')).toBe('20l_50l')
    expect(mapIncomeBand(null, '40L+')).toBe('gt50l')
  })

  it('handles a sub-₹3L exact figure', () => {
    expect(mapIncomeBand(200_000, null)).toBe('lt3l')
  })

  it('handles a 60L+ exact figure', () => {
    expect(mapIncomeBand(6_000_000, null)).toBe('gt50l')
  })

  it('returns null when neither input is provided', () => {
    expect(mapIncomeBand(null, null)).toBeNull()
  })
})
