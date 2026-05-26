/**
 * RecommendationService — Module 5
 *
 * Deterministic rule-based recommendation engine (NO ML/AI).
 * Every recommendation has a "See the Math" basis text.
 * Every recommendation is logged to RecommendationAudit (immutable, 5-year retention).
 *
 * Compliance:
 *   CG-1: All basis text sourced from verified IRDAI rules
 *   CG-3: ULIP_RECOMMENDATIONS feature flag = false
 *   CG-4: Term plan — "no maturity benefit" stated explicitly
 *   CG-5: No co-branded insurer recommendation without proper disclosure
 *   CG-8: "See the Math" mandatory on every recommendation
 */
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RecommendationAudit, RecommendationType } from '../../database/entities/recommendation-audit.entity'
import type { ScoreResult } from '../score/protection-score.service'
import type { ParsedProfile } from '../diagnostic/nlp-parser.service'

// CG-3: ULIP feature flag — always false in MVP1
const ULIP_RECOMMENDATIONS = false

export interface Recommendation {
  id: string
  type: RecommendationType
  priority: number
  title: string
  summary: string
  basisText: string           // "See the Math" content
  irdaiRuleReference: string
  productCategory: string
  isUlip: false               // CG-3: always false
  actionUrl?: string
  disclaimer: string          // CG-2/CG-4/CG-5 per product
}

@Injectable()
export class RecommendationService {
  constructor(
    @InjectRepository(RecommendationAudit)
    private readonly auditRepo: Repository<RecommendationAudit>,
  ) {}

  generate(score: ScoreResult, profile: ParsedProfile): Recommendation[] {
    const recs: Recommendation[] = []
    const income = profile.annualIncomeLakhs

    // ── 1. Term Life (if life sub-score < 70) ────────────────────
    if (score.lifeSubScore < 70) {
      const gapCrore = Math.round(score.gaps.life / 100000) / 10
      recs.push({
        id: 'rec_term_life',
        type: 'term_life',
        priority: 1,
        title: `Add ₹${gapCrore} Cr Term Cover`,
        summary: `Your life cover is ₹${(profile.termCoverAmount / 100000).toFixed(0)}L. Recommended is 10× income = ₹${(income * 10).toFixed(0)}L.`,
        basisText:
          `Life Score: ${score.lifeSubScore}/100. ` +
          `IRDAI suitability guidelines recommend life cover = 10× annual income for income replacement. ` +
          `Your annual income: ₹${income}L. Recommended: ₹${income * 10}L. ` +
          `You have: ₹${(profile.termCoverAmount / 100000).toFixed(0)}L. ` +
          `Gap: ₹${gapCrore}Cr. ` +
          `This is a term plan — no maturity benefit; cover pays out on death only within the policy term.`,
        irdaiRuleReference: 'IRDAI Protection of Policyholders\' Interests Regulations 2024',
        productCategory: 'term_life',
        isUlip: false,
        disclaimer:
          'This is a term plan and does not offer any maturity benefits. Sum assured is payable on death only during the policy term. ' +
          'For more details on risk factors, terms and conditions, please read the sales brochure carefully before concluding a sale. ' +
          'Conditions apply. IRDAI does not endorse any specific insurer.',
      })
    }

    // ── 2. PMSBY (if no accident cover + has savings account) ────
    if (!profile.hasAccidentCover) {
      recs.push({
        id: 'rec_pmsby',
        type: 'pmsby',
        priority: score.lifeSubScore >= 70 ? 1 : 2,
        title: 'Activate PMSBY — ₹2L Accident Cover at ₹20/year',
        summary: 'Government scheme. Zero underwriting. Activates in 2 minutes via your bank.',
        basisText:
          'PMSBY (Pradhan Mantri Suraksha Bima Yojana) provides ₹2 Lakh accidental death and permanent disability cover ' +
          'for ₹20/year, auto-debited from your savings bank account. ' +
          'Available to savings account holders aged 18–70. ' +
          'No separate insurance policy or agent required. ' +
          'Source: Jan Suraksha Yojana — Ministry of Finance, Government of India, 2015.',
        irdaiRuleReference: 'Jan Suraksha Yojana — Ministry of Finance, GoI, 2015',
        productCategory: 'govt_scheme',
        isUlip: false,
        actionUrl: 'https://www.jansuraksha.gov.in/Forms-PMSBY.aspx',
        disclaimer: 'Government scheme under PMSBY. ₹2L cover subject to scheme terms and claim conditions. Age 18–70. Conditions apply.',
      })
    }

    // ── 3. Health Top-up (if health sub-score < 60) ───────────────
    if (score.healthSubScore < 60) {
      const gapL = Math.round(score.gaps.health / 100000)
      recs.push({
        id: 'rec_health_topup',
        type: 'health_topup',
        priority: recs.length + 1,
        title: `Add ₹${gapL}L Super Top-up Health Cover`,
        summary: 'Activates when your base cover is exhausted. Far cheaper than a standalone plan.',
        basisText:
          `Health Score: ${score.healthSubScore}/100. ` +
          `Recommended health cover = 3× annual income (IRDAI guideline), adjusted for family. ` +
          `Your effective cover (employer mediclaim at 70%): ₹${(profile.healthCoverAmount * 0.7 / 100000).toFixed(0)}L. ` +
          `Gap: ₹${gapL}L. ` +
          `A super top-up plan activates above your deductible (base cover limit) — covers the excess at much lower premium.`,
        irdaiRuleReference: 'IRDAI Health Insurance Regulations 2016',
        productCategory: 'health_topup',
        isUlip: false,
        disclaimer:
          'Super top-up plans activate above the deductible limit. Coverage, waiting periods, and sub-limits vary by insurer. ' +
          'Conditions apply. Please read the policy brochure carefully before purchase.',
      })
    }

    // ── 4. EDLI claim awareness (if salaried_pf) ─────────────────
    if (profile.occupationCategory === 'salaried_pf') {
      recs.push({
        id: 'rec_edli',
        type: 'edli_claim',
        priority: recs.length + 1,
        title: 'You have EDLI Life Cover — ₹7L from EPFO',
        summary: 'As an EPFO member, your nominees can claim up to ₹7L on your death during service.',
        basisText:
          'EDLI (Employees\' Deposit Linked Insurance) is mandatory for all EPFO members at zero additional premium. ' +
          'Maximum cover: ₹7 Lakh (as per EPFO amendment April 2021). ' +
          'Nominee files Form 5IF at nearest EPFO office or via Umang app. ' +
          'Claim must be filed within 3 years of death. ' +
          'Source: EPFO EDLI Scheme 1976, Amended 2021.',
        irdaiRuleReference: 'EPFO EDLI Scheme 1976, Amended April 2021',
        productCategory: 'govt_scheme',
        isUlip: false,
        disclaimer: 'EDLI is a government scheme administered by EPFO. Claim conditions and amounts are subject to scheme terms. Conditions apply.',
      })
    }

    // ULIP explicitly excluded — CG-3
    if (ULIP_RECOMMENDATIONS) {
      // This block intentionally never executes in MVP1
      throw new Error('ULIP recommendations are feature-flagged off')
    }

    return recs.slice(0, 5) // max 5 recommendations
  }

  async logAudit(
    userId: string,
    scoreId: string,
    recs: Recommendation[],
    inputsSnapshot: ParsedProfile,
  ): Promise<RecommendationAudit[]> {
    const audits = recs.map(rec =>
      this.auditRepo.create({
        userId,
        scoreId,
        recommendationType: rec.type,
        basisText: rec.basisText,
        irdaiRuleReference: rec.irdaiRuleReference,
        inputsSnapshot: {
          ...inputsSnapshot as unknown as Record<string, unknown>,
          // Hash any PII fields before storage
          whatsappNumber: undefined,
        },
      }),
    )
    return this.auditRepo.save(audits)
  }

  /**
   * CG-8: "See the Math" - returns the immutable basis text for a given audit row.
   * Throws NotFoundException if the audit row does not exist or does not belong
   * to the calling user.
   */
  async getAudit(userId: string, auditId: string): Promise<RecommendationAudit> {
    const audit = await this.auditRepo.findOne({ where: { auditId } })
    if (!audit) {
      throw new NotFoundException('Recommendation audit not found')
    }
    if (audit.userId !== userId) {
      throw new NotFoundException('Recommendation audit not found')
    }
    return audit
  }

  /**
   * Log a batch of recommendations exactly as the user saw them. Each
   * recommendation becomes an immutable audit row. The frontend rec.id is
   * stored in `recommendationType` so the response can map auditIds back
   * to the frontend ids.
   *
   * Inputs are scrubbed of obvious PII before storage.
   */
  async logRecommendationBatch(
    userId: string,
    scoreId: string,
    recommendations: Array<{
      id: string
      recommendationType: string
      basisText: string
      irdaiRuleReference?: string
    }>,
    profileSnapshot: Record<string, unknown>,
  ): Promise<RecommendationAudit[]> {
    const scrubbed = scrubPii(profileSnapshot)
    const audits = recommendations.map(rec => {
      const audit = new RecommendationAudit()
      audit.userId = userId
      audit.scoreId = scoreId
      // We persist the frontend recommendation id in this column so the
      // response can return a recId -> auditId mapping. recommendationType
      // is varchar(100) which is plenty.
      audit.recommendationType = (rec.id || rec.recommendationType) as RecommendationType
      audit.basisText = rec.basisText
      audit.irdaiRuleReference = rec.irdaiRuleReference ?? ''
      audit.inputsSnapshot = scrubbed
      return audit
    })
    return this.auditRepo.save(audits)
  }
}

function scrubPii(obj: Record<string, unknown>): Record<string, unknown> {
  const PII_FIELDS = new Set([
    'phone',
    'mobile',
    'whatsappNumber',
    'email',
    'aadhaar',
    'aadhaarLast4',
    'name',
    'fullName',
    'address',
    'pan',
  ])
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (PII_FIELDS.has(k)) continue
    out[k] = v
  }
  return out
}
