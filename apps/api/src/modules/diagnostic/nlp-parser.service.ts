/**
 * NlpParserService — Module 3
 *
 * Rule-based (NOT ML) parser for free-text diagnostic answers.
 * Maps natural language to structured enums.
 *
 * Examples:
 *   "around 15 lakhs"  → income_band: '10l_20l'
 *   "wife and 2 kids"  → dependants_count: 3, life_stage: married_with_kids
 *   "LIC and mediclaim" → has_life_cover: true, has_health_cover: true
 */
import { Injectable } from '@nestjs/common'
import type { IncomeBand, CityTier, LifeStage } from '../../database/entities/user-profile.entity'

export interface ParsedProfile {
  incomeBand: IncomeBand
  cityTier: CityTier
  lifeStage: LifeStage
  dependantsCount: number
  monthlyObligationsBand: string
  hasLifeCover: boolean
  hasHealthCover: boolean
  hasAccidentCover: boolean
  termCoverAmount: number        // ₹ — 0 if none
  healthCoverAmount: number      // ₹ — 0 if none
  incomeProtectionAmount: number // ₹ — 0 if none
  annualIncomeLakhs: number      // midpoint of income band
  occupationCategory: 'salaried_pf' | 'self_employed' | 'govt' | 'other'
}

@Injectable()
export class NlpParserService {
  parseIncomeBand(text: string): { band: IncomeBand; midpointLakhs: number } {
    const n = this.extractNumber(text)
    if (n < 3)  return { band: 'lt3l',    midpointLakhs: 2   }
    if (n < 5)  return { band: '3l_5l',   midpointLakhs: 4   }
    if (n < 10) return { band: '5l_10l',  midpointLakhs: 7.5 }
    if (n < 20) return { band: '10l_20l', midpointLakhs: 15  }
    if (n < 50) return { band: '20l_50l', midpointLakhs: 35  }
    return             { band: 'gt50l',   midpointLakhs: 75  }
  }

  parseDependants(text: string): { count: number; includesParents: boolean } {
    const lower = text.toLowerCase()
    let count = 0
    const includesParents = /parent|mother|father|mum|dad|ageing/i.test(lower)

    // "wife and 2 kids" → 3
    if (/wife|husband|spouse|partner/i.test(lower)) count++
    const kidsMatch = lower.match(/(\d+)\s*(kid|child|children|son|daughter)/i)
    if (kidsMatch) count += parseInt(kidsMatch[1], 10)
    if (/parents|mother|father|mum|dad/i.test(lower)) count++

    return { count: Math.max(count, 0), includesParents }
  }

  parseCoverages(text: string): {
    hasLifeCover: boolean
    hasHealthCover: boolean
    hasAccidentCover: boolean
    termCoverAmount: number
    healthCoverAmount: number
  } {
    const lower = text.toLowerCase()
    const hasLifeCover = /lic|term|life\s*insurance|jeevan/i.test(lower)
    const hasHealthCover = /mediclaim|health|medi\s*claim|apollo|star\s*health/i.test(lower)
    const hasAccidentCover = /accident|pa\s*cover|personal\s*accident/i.test(lower)

    // Extract amounts (e.g., "50 lakh term plan")
    const termMatch = lower.match(/(\d+)\s*(?:lakh|l)\s*(?:term|life)/i)
    const healthMatch = lower.match(/(\d+)\s*(?:lakh|l)\s*(?:health|mediclaim)/i)

    return {
      hasLifeCover,
      hasHealthCover,
      hasAccidentCover,
      termCoverAmount: termMatch ? parseInt(termMatch[1], 10) * 100000 : hasLifeCover ? 500000 : 0,
      healthCoverAmount: healthMatch ? parseInt(healthMatch[1], 10) * 100000 : hasHealthCover ? 300000 : 0,
    }
  }

  parseCityTier(cityName: string): CityTier {
    const T1 = /mumbai|delhi|bengaluru|bangalore|chennai|hyderabad|kolkata|pune/i
    const T2 = /jaipur|ahmedabad|surat|lucknow|kanpur|nagpur|patna|bhopal|indore|coimbatore|kochi|chandigarh/i
    if (T1.test(cityName)) return 'T1'
    if (T2.test(cityName)) return 'T2'
    return 'T3'
  }

  parseOccupation(text: string): 'salaried_pf' | 'self_employed' | 'govt' | 'other' {
    const lower = text.toLowerCase()
    if (/govt|government|public\s*sector|ias|ips|psu/i.test(lower)) return 'govt'
    if (/self.?employ|freelanc|business|own|proprietor/i.test(lower)) return 'self_employed'
    if (/salaried|employee|office|corporate|company|pf|epf/i.test(lower)) return 'salaried_pf'
    return 'other'
  }

  private extractNumber(text: string): number {
    const match = text.match(/(\d+(?:\.\d+)?)\s*(?:lakh|l|lac)?/i)
    if (!match) return 0
    return parseFloat(match[1])
  }
}
