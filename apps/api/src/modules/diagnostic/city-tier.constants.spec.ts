import { getCityTier } from './city-tier.constants'

describe('getCityTier', () => {
  it('maps metro cities to T1', () => {
    expect(getCityTier('Mumbai')).toBe('T1')
    expect(getCityTier('mumbai')).toBe('T1')
    expect(getCityTier('Bengaluru')).toBe('T1')
    expect(getCityTier('Bangalore')).toBe('T1')
    expect(getCityTier('New Delhi')).toBe('T1')
    expect(getCityTier('Navi Mumbai')).toBe('T1')
  })

  it('maps large cities to T2', () => {
    expect(getCityTier('Jaipur')).toBe('T2')
    expect(getCityTier('Indore')).toBe('T2')
    expect(getCityTier('Surat')).toBe('T2')
    expect(getCityTier('Chandigarh')).toBe('T2')
  })

  it('defaults unknown / smaller cities to T3', () => {
    expect(getCityTier('Hassan')).toBe('T3')
    expect(getCityTier('Ujjain')).toBe('T3')
    expect(getCityTier('')).toBe('T3')
  })
})
