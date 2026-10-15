import { describe, it, expect } from 'vitest'
import { discoverCoverages, totalBonusCover, DISCOVERY_RULE_VERSION } from './discoveryEngine'
import type { UserProfile } from '../diagnostic/parser'

const BASE: UserProfile = {
  lifeStage: 'single',
  incomeBand: '5_10l',
  dependantsCount: 0,
  monthlyObligationsBand: 'none',
  hasEmployerMediclaim: false,
  hasPersonalHealth: false,
  hasTermLife: false,
  hasEndowment: false,
  cityTier: 'T2',
  occupation: 'salaried_pf',
  edliEligible: true,
}

describe('discoverCoverages', () => {
  it('surfaces EDLI (₹7L) for PF members and not for others', () => {
    const pf = discoverCoverages({}, BASE)
    expect(pf.find(c => c.id === 'edli')).toBeDefined()
    expect(totalBonusCover(pf)).toBeGreaterThanOrEqual(700_000)

    const noPf = discoverCoverages({}, { ...BASE, edliEligible: false, occupation: 'self_employed' })
    expect(noPf.find(c => c.id === 'edli')).toBeUndefined()
  })

  it('is deterministic and every coverage carries a status and a finite amount', () => {
    const answers = { has_savings_account: 'yes', has_vehicle: 'yes', has_home_loan: 'yes', has_credit_card: 'yes' }
    const a = discoverCoverages(answers, BASE)
    expect(a).toEqual(discoverCoverages(answers, BASE))
    for (const c of a) {
      expect(typeof c.status).toBe('string')
      expect(Number.isFinite(c.coverAmount)).toBe(true)
      expect(c.coverAmount).toBeGreaterThanOrEqual(0)
    }
    expect(Number.isFinite(totalBonusCover(a))).toBe(true)
    expect(DISCOVERY_RULE_VERSION).toBe('v1.0.0')
  })
})
