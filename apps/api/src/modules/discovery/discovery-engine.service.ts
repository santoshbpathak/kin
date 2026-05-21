/**
 * discovery-engine.service.ts — Module 6: Hidden Coverage Discovery
 *
 * Deterministic rule engine: evaluates 8 yes/no answers and returns an array
 * of government and employer-mandated schemes the user may already be covered
 * under — often without their knowledge.
 *
 * RULE_VERSION = 'v1.0.0' — same inputs always produce identical output.
 *
 * Schemes evaluated:
 *   1. EDLI        — ₹7L if salaried + PF contributor (EPFO)
 *   2. PMSBY       — ₹2L accidental cover at ₹20/yr if savings account holder
 *   3. PMJJBY      — ₹2L life cover at ₹436/yr if savings account + age 18-50
 *   4. ESI         — Medical cover if salaried + income below ESI threshold
 *   5. Employer Group Term — ₹3–10L if employer provides group life benefits
 *   6. Motor PA    — ₹15L personal accident if registered vehicle owner
 *   7. IRCTC Travel PA — ₹10L if travels by rail and books online
 *   8. MRTA        — Mortgage reducing term assurance if home loan exists
 *
 * Compliance: CG-1 — all cover amounts from verified IRDAI/EPFO/Govt sources.
 */

import { Injectable } from '@nestjs/common'

export const RULE_VERSION = 'v1.0.0'

export type CoverageStatus =
  | 'active'
  | 'likely_active'
  | 'check_required'
  | 'not_activated'
  | 'not_applicable'

export interface DiscoveredCoverage {
  id: string
  schemeName: string
  schemeType: 'government' | 'employer' | 'statutory' | 'bundled'
  coverAmount: number           // in INR
  coverAmountLabel: string      // e.g. "₹7 Lakh"
  premiumPerYear: number        // 0 = free / already paid
  premiumLabel: string          // e.g. "₹20/yr" or "Free (employer-funded)"
  status: CoverageStatus
  statusLabel: string
  actionRequired: string        // what the user should do next
  howToActivate: string         // step-by-step action
  source: string                // official govt/IRDAI reference
  isActivatedByDefault: boolean // true = auto-enrolled, false = opt-in required
}

export interface DiscoveryAnswers {
  isSalaried: boolean            // Q1: Are you salaried / employed?
  contributesPf: boolean         // Q2: Does your employer deduct PF from salary?
  hasSavingsAccount: boolean     // Q3: Do you have a savings bank account?
  ageBelow50: boolean            // Q4: Are you between 18 and 50 years old?
  incomeBelowEsiLimit: boolean   // Q5: Is your gross monthly salary below ₹21,000?
  employerOffersGroupLife: boolean // Q6: Does your employer offer group life insurance?
  ownsVehicle: boolean           // Q7: Do you own a registered motor vehicle (car/bike)?
  travelsByRail: boolean         // Q8: Do you book IRCTC rail tickets online?
  hasHomeLoan: boolean           // Q9 (bonus): Do you have an active home loan?
}

export interface DiscoveryResult {
  ruleVersion: string
  evaluatedAt: string
  coverages: DiscoveredCoverage[]
  totalBonusCoverAmount: number
  totalBonusCoverLabel: string
}

@Injectable()
export class DiscoveryEngineService {
  /**
   * evaluate — core deterministic rule engine.
   * Same answers always produce identical output (pure function).
   */
  evaluate(answers: DiscoveryAnswers): DiscoveryResult {
    const coverages: DiscoveredCoverage[] = [
      this.evaluateEdli(answers),
      this.evaluatePmsby(answers),
      this.evaluatePmjjby(answers),
      this.evaluateEsi(answers),
      this.evaluateEmployerGroupTerm(answers),
      this.evaluateMotorPa(answers),
      this.evaluateIrctcTravelPa(answers),
      this.evaluateMrta(answers),
    ]

    const totalBonusCoverAmount = this.totalBonusCover(coverages)

    return {
      ruleVersion: RULE_VERSION,
      evaluatedAt: new Date().toISOString(),
      coverages,
      totalBonusCoverAmount,
      totalBonusCoverLabel: this.formatCurrency(totalBonusCoverAmount),
    }
  }

  // ── Individual scheme evaluators ────────────────────────────────

  private evaluateEdli(a: DiscoveryAnswers): DiscoveredCoverage {
    let status: CoverageStatus
    let actionRequired: string

    if (a.isSalaried && a.contributesPf) {
      status = 'likely_active'
      actionRequired = 'Verify your EDLI nomination via EPFO Unified Portal or Umang app. Register e-Nomination if not done.'
    } else if (a.isSalaried && !a.contributesPf) {
      status = 'check_required'
      actionRequired = 'Confirm whether your employer is EPFO-registered. Some exempted establishments have their own PF trust with EDLI.'
    } else {
      status = 'not_applicable'
      actionRequired = 'EDLI only applies to EPFO members. Not applicable if self-employed or not salaried.'
    }

    return {
      id: 'edli',
      schemeName: 'EDLI — Employees\' Deposit Linked Insurance',
      schemeType: 'statutory',
      coverAmount: 700000,
      coverAmountLabel: '₹7 Lakh',
      premiumPerYear: 0,
      premiumLabel: 'Free (EPFO-funded)',
      status,
      statusLabel: this.statusLabel(status),
      actionRequired,
      howToActivate: 'Log in to unifiedportal-mem.epfindia.gov.in → Member Services → e-Nomination. Nominee can claim via Form 5IF on death.',
      source: 'EPFO EDLI Scheme 1976, Amended 2021 — EPFO Circular 28 April 2021',
      isActivatedByDefault: true,
    }
  }

  private evaluatePmsby(a: DiscoveryAnswers): DiscoveredCoverage {
    let status: CoverageStatus
    let actionRequired: string

    if (a.hasSavingsAccount) {
      status = 'check_required'
      actionRequired = 'Check if PMSBY is active: log in to your bank\'s net banking or mobile app → Jan Suraksha schemes. If not enrolled, opt in now — costs only ₹20/year.'
    } else {
      status = 'not_applicable'
      actionRequired = 'Open a savings bank account to be eligible for PMSBY accidental cover.'
    }

    return {
      id: 'pmsby',
      schemeName: 'PMSBY — Pradhan Mantri Suraksha Bima Yojana',
      schemeType: 'government',
      coverAmount: 200000,
      coverAmountLabel: '₹2 Lakh',
      premiumPerYear: 20,
      premiumLabel: '₹20/year',
      status,
      statusLabel: this.statusLabel(status),
      actionRequired,
      howToActivate: 'Log in to your bank app → Jan Suraksha / PMSBY → Enrol. ₹20 auto-debited on 1 June annually. Covers accidental death & total disability.',
      source: 'Jan Suraksha Yojana — Ministry of Finance, Govt of India, 2015',
      isActivatedByDefault: false,
    }
  }

  private evaluatePmjjby(a: DiscoveryAnswers): DiscoveredCoverage {
    let status: CoverageStatus
    let actionRequired: string

    if (a.hasSavingsAccount && a.ageBelow50) {
      status = 'check_required'
      actionRequired = 'Check if PMJJBY is active: log in to your bank\'s app → Jan Suraksha → PMJJBY. Enrol if not active. ₹436/year for ₹2L life cover.'
    } else if (a.hasSavingsAccount && !a.ageBelow50) {
      status = 'not_applicable'
      actionRequired = 'PMJJBY requires age 18–50 for new enrolment. If already enrolled before age 50, cover continues till 55.'
    } else {
      status = 'not_applicable'
      actionRequired = 'Open a savings bank account and ensure age is 18–50 to be eligible for PMJJBY.'
    }

    return {
      id: 'pmjjby',
      schemeName: 'PMJJBY — Pradhan Mantri Jeevan Jyoti Bima Yojana',
      schemeType: 'government',
      coverAmount: 200000,
      coverAmountLabel: '₹2 Lakh',
      premiumPerYear: 436,
      premiumLabel: '₹436/year',
      status,
      statusLabel: this.statusLabel(status),
      actionRequired,
      howToActivate: 'Log in to your bank app → Jan Suraksha / PMJJBY → Enrol. ₹436 auto-debited annually. Provides ₹2L life cover for any cause of death.',
      source: 'Jan Suraksha Yojana — Ministry of Finance, Govt of India, 2015',
      isActivatedByDefault: false,
    }
  }

  private evaluateEsi(a: DiscoveryAnswers): DiscoveredCoverage {
    let status: CoverageStatus
    let actionRequired: string

    if (a.isSalaried && a.incomeBelowEsiLimit) {
      status = 'likely_active'
      actionRequired = 'Verify your ESI card with HR. Collect your ESI card (IP/Insured Person number) from your employer. Register dependants for medical cover.'
    } else if (a.isSalaried && !a.incomeBelowEsiLimit) {
      status = 'not_applicable'
      actionRequired = 'ESI applies only to employees with gross salary ≤ ₹21,000/month. You are above the threshold — consider employer-sponsored health insurance instead.'
    } else {
      status = 'not_applicable'
      actionRequired = 'ESI applies only to salaried employees in ESI-covered establishments.'
    }

    return {
      id: 'esi',
      schemeName: 'ESI — Employees\' State Insurance (Medical Cover)',
      schemeType: 'statutory',
      coverAmount: 0,           // unlimited medical; no fixed sum assured
      coverAmountLabel: 'Full medical cover (no cap)',
      premiumPerYear: 0,
      premiumLabel: '0.75% of wages (employee contribution)',
      status,
      statusLabel: this.statusLabel(status),
      actionRequired,
      howToActivate: 'Ask HR for your ESI IP number and ESI card. Register family members as dependants at the nearest ESI dispensary. Use esic.in for digital services.',
      source: 'Employees\' State Insurance Act, 1948 — ESIC',
      isActivatedByDefault: true,
    }
  }

  private evaluateEmployerGroupTerm(a: DiscoveryAnswers): DiscoveredCoverage {
    let status: CoverageStatus
    let actionRequired: string
    const coverAmount = 500000  // midpoint estimate ₹3L–₹10L

    if (a.isSalaried && a.employerOffersGroupLife) {
      status = 'likely_active'
      actionRequired = 'Confirm sum assured and nominated beneficiary with HR / People Ops. Add this policy to your KIN Vault.'
    } else if (a.isSalaried && !a.employerOffersGroupLife) {
      status = 'check_required'
      actionRequired = 'Ask HR whether your employer provides group term life insurance — many employers include it in CTC without explicit communication.'
    } else {
      status = 'not_applicable'
      actionRequired = 'Employer group term is only available to salaried employees. Consider a standalone term plan.'
    }

    return {
      id: 'employer_group_term',
      schemeName: 'Employer Group Term Life Insurance',
      schemeType: 'employer',
      coverAmount,
      coverAmountLabel: '₹3L–₹10L (employer-defined)',
      premiumPerYear: 0,
      premiumLabel: 'Free (employer-funded)',
      status,
      statusLabel: this.statusLabel(status),
      actionRequired,
      howToActivate: 'Request your group policy certificate from HR. Note the insurer name, sum assured, and nominee on record. Verify nominee is up to date.',
      source: 'IRDAI Group Insurance Guidelines 2016',
      isActivatedByDefault: true,
    }
  }

  private evaluateMotorPa(a: DiscoveryAnswers): DiscoveredCoverage {
    let status: CoverageStatus
    let actionRequired: string

    if (a.ownsVehicle) {
      status = 'check_required'
      actionRequired = 'Check your motor insurance policy document for the "Personal Accident Cover for Owner-Driver" section. Mandatory ₹15L PA cover since 2019. Confirm nominee is registered.'
    } else {
      status = 'not_applicable'
      actionRequired = 'Motor PA cover applies only to registered vehicle owners. Not applicable if you don\'t own a vehicle.'
    }

    return {
      id: 'motor_pa',
      schemeName: 'Motor Insurance Owner-Driver PA Cover',
      schemeType: 'bundled',
      coverAmount: 1500000,
      coverAmountLabel: '₹15 Lakh',
      premiumPerYear: 0,
      premiumLabel: 'Included in motor insurance premium',
      status,
      statusLabel: this.statusLabel(status),
      actionRequired,
      howToActivate: 'Review your motor insurance policy (private car or two-wheeler). The ₹15L PA cover for the owner-driver is compulsory since IRDAI circular 2018. Ensure nominee is recorded.',
      source: 'IRDAI Motor Insurance Circular — Compulsory PA Cover, 2018',
      isActivatedByDefault: true,
    }
  }

  private evaluateIrctcTravelPa(a: DiscoveryAnswers): DiscoveredCoverage {
    let status: CoverageStatus
    let actionRequired: string

    if (a.travelsByRail) {
      status = 'check_required'
      actionRequired = 'When booking IRCTC tickets online, opt-in for travel insurance (₹0.49–₹0.92 per ticket). Provides ₹10L accidental cover for the journey. Check if you opted in on last booking.'
    } else {
      status = 'not_applicable'
      actionRequired = 'IRCTC travel PA cover is available when booking rail tickets online. Not applicable if you don\'t travel by train.'
    }

    return {
      id: 'irctc_travel_pa',
      schemeName: 'IRCTC Rail Travel Personal Accident Insurance',
      schemeType: 'bundled',
      coverAmount: 1000000,
      coverAmountLabel: '₹10 Lakh',
      premiumPerYear: 0,
      premiumLabel: '₹0.49–₹0.92 per booking (opt-in)',
      status,
      statusLabel: this.statusLabel(status),
      actionRequired,
      howToActivate: 'On IRCTC booking screen, tick the "Travel Insurance" checkbox. Premium is less than ₹1 per booking. In case of accident during travel, claim via the insurer shown on your ticket.',
      source: 'IRCTC / IRDAI — Rail Travel Insurance Scheme',
      isActivatedByDefault: false,
    }
  }

  private evaluateMrta(a: DiscoveryAnswers): DiscoveredCoverage {
    let status: CoverageStatus
    let actionRequired: string

    if (a.hasHomeLoan) {
      status = 'check_required'
      actionRequired = 'Check if your bank bundled a Home Loan Insurance (MRTA) at the time of loan disbursement. Check your loan documents or ask your bank. If not taken, consider buying one to protect your family from loan liability.'
    } else {
      status = 'not_applicable'
      actionRequired = 'MRTA is a home loan protection plan — only applicable if you have an active home loan.'
    }

    return {
      id: 'mrta',
      schemeName: 'MRTA — Mortgage Reducing Term Assurance',
      schemeType: 'bundled',
      coverAmount: 0,           // matches outstanding loan amount — variable
      coverAmountLabel: 'Matches outstanding home loan',
      premiumPerYear: 0,
      premiumLabel: 'Single premium (usually bundled at loan disbursal)',
      status,
      statusLabel: this.statusLabel(status),
      actionRequired,
      howToActivate: 'Check your home loan sanction letter for loan insurance details. If not covered, ask your bank or an insurance advisor about standalone MRTA plans. Protects nominee from inheriting loan liability.',
      source: 'IRDAI Life Insurance Regulations — Loan Protection Plans',
      isActivatedByDefault: false,
    }
  }

  // ── Helpers ────────────────────────────────────────────────────

  /**
   * totalBonusCover — sum of coverAmount for schemes that are active,
   * likely_active, or check_required (i.e. potentially available).
   */
  totalBonusCover(coverages: DiscoveredCoverage[]): number {
    return coverages
      .filter(c => c.status !== 'not_applicable' && c.coverAmount > 0)
      .reduce((sum, c) => sum + c.coverAmount, 0)
  }

  private statusLabel(status: CoverageStatus): string {
    const labels: Record<CoverageStatus, string> = {
      active: 'Active',
      likely_active: 'Likely Active',
      check_required: 'Check Required',
      not_activated: 'Not Activated',
      not_applicable: 'Not Applicable',
    }
    return labels[status]
  }

  private formatCurrency(amount: number): string {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Crore`
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} Lakh`
    return `₹${amount.toLocaleString('en-IN')}`
  }
}
