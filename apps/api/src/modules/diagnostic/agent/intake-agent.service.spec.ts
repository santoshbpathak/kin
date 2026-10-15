import {
  groupAProgress,
  isConversationComplete,
} from './intake-agent.service'
import type { CollectedFields } from './intake-agent.types'

describe('intake-agent pure helpers', () => {
  describe('isConversationComplete', () => {
    function fullGroupA(): CollectedFields {
      return {
        annual_income_band: '10-20L',
        dependants_count: 2,
        life_stage: 'married_with_kids',
        city: 'Bengaluru',
        city_tier: 'T1',
        monthly_obligations_band: '30K-50K',
        occupation_category: 'salaried',
      }
    }

    it('returns false until Group A is complete', () => {
      const partial: CollectedFields = {
        annual_income_band: '10-20L',
        dependants_count: 2,
        life_stage: 'married_with_kids',
      }
      expect(isConversationComplete(partial)).toBe(false)
    })

    it('still returns false if Group A is done but Life cover not answered (Brief §1.4 hard rule)', () => {
      const c: CollectedFields = {
        ...fullGroupA(),
        personal_health_cover_amount: 500000,
        employer_mediclaim_amount: 300000,
        ci_cover_amount: 0,
        // personal_life_cover_amount intentionally absent
      }
      expect(isConversationComplete(c)).toBe(false)
    })

    it('still returns false if Group A is done but Income Protection cover not answered (hard rule)', () => {
      const c: CollectedFields = {
        ...fullGroupA(),
        personal_life_cover_amount: 5000000,
        personal_health_cover_amount: 500000,
        employer_mediclaim_amount: 300000,
        // income_protection_cover_amount intentionally absent
      }
      expect(isConversationComplete(c)).toBe(false)
    })

    it('completes once Group A done, Life + Income Protection answered, and ≥3 Group B fields collected', () => {
      const c: CollectedFields = {
        ...fullGroupA(),
        personal_life_cover_amount: 5000000,
        personal_health_cover_amount: 500000,
        employer_mediclaim_amount: 300000,
        income_protection_cover_amount: 0,
      }
      expect(isConversationComplete(c)).toBe(true)
    })

    it('accepts an explicit "skipped" value for Group A and hard-rule fields', () => {
      const c: CollectedFields = {
        ...fullGroupA(),
        monthly_obligations_band: 'skipped',
        personal_life_cover_amount: 'skipped',
        income_protection_cover_amount: 'skipped',
        personal_health_cover_amount: 0,
        employer_mediclaim_amount: 0,
      }
      expect(isConversationComplete(c)).toBe(true)
    })
  })

  describe('groupAProgress', () => {
    it('returns 0 for empty collected', () => {
      expect(groupAProgress({})).toBe(0)
    })

    it('returns 100 for full Group A coverage', () => {
      const c: CollectedFields = {
        annual_income_band: '10-20L',
        dependants_count: 2,
        life_stage: 'married_with_kids',
        city: 'Bengaluru',
        city_tier: 'T1',
        monthly_obligations_band: '30K-50K',
        occupation_category: 'salaried',
      }
      expect(groupAProgress(c)).toBe(100)
    })

    it('rounds the partial progress', () => {
      const c: CollectedFields = {
        annual_income_band: '10-20L',
        dependants_count: 2,
        life_stage: 'married_with_kids',
      }
      // 3 / 7 ≈ 43
      expect(groupAProgress(c)).toBe(43)
    })
  })
})
