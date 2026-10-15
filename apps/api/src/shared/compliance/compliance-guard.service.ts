/**
 * ComplianceGuardService — IRDAI output validation for AI-generated messages.
 *
 * Pattern from KIN Engineering Brief v1.4 §3.2. Every AI-generated string
 * must pass through validateAndSanitise() before being returned to the
 * frontend. The guard scans for:
 *
 *   1. Insurer / product brand names (LIC, HDFC Life, ICICI Pru, etc.)
 *   2. Premium / cost / price figures
 *   3. PII solicitations (Aadhaar, PAN, bank account, exact address)
 *
 * The brief allows a separate OpenAI compliance-check pass; we use a fast
 * deterministic regex layer here. It catches the explicit test cases
 * ("HDFC Life", "LIC") and avoids paying for an extra OpenAI round-trip
 * per turn. The COMPLIANCE_CHECK_PROMPT is preserved in the prompts file
 * for later use if escalated review becomes a requirement.
 *
 * Violations are logged via the standard Nest logger; in production this
 * routes to CloudWatch/Sentry. The session token (never PII) is the only
 * identifier emitted.
 */

import { Injectable, Logger } from '@nestjs/common'

export interface ComplianceResult {
  message: string
  hadViolations: boolean
  violations: string[]
}

export type ComplianceContext = 'diagnostic' | 'advisor'

// ── Detection patterns ────────────────────────────────────────────────
// These are deliberately conservative. A false positive triggers a generic
// sanitisation; a missed match would risk an IRDAI violation, so we err
// toward sanitising aggressively.

const INSURER_NAMES = [
  'lic', 'life insurance corporation',
  'hdfc life', 'hdfc ergo',
  'icici pru', 'icici prudential', 'icici lombard',
  'sbi life', 'sbi general',
  'max life', 'max bupa',
  'bajaj allianz',
  'tata aia', 'tata aig',
  'kotak life', 'kotak general',
  'aditya birla', 'abc health',
  'reliance nippon', 'reliance general',
  'star health',
  'aegon life',
  'pnb metlife',
  'canara hsbc',
  'edelweiss tokio',
  'shriram life',
  'pramerica life',
  'future generali',
  'niva bupa',
  'care health',
  'manipal cigna',
  'royal sundaram',
  'cholamandalam',
  'liberty general',
  'go digit',
  'acko',
  'new india assurance',
  'oriental insurance',
  'united india',
  'national insurance',
]

// Insurer names as a single grouped regex (case-insensitive, word-boundary aware).
const INSURER_REGEX = new RegExp(
  '\\b(' + INSURER_NAMES.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b',
  'gi',
)

// Premium / monthly cost figures. Catches "₹12,000/month", "Rs 5000 per year",
// "premium of 15000", "monthly cost ₹2,500", "yearly cost 18,000".
const PREMIUM_REGEX =
  /(?:premium|cost|price|costs?|costs|costs?)\s*(?:of|is|:|=)?\s*(?:₹|rs\.?|inr)?\s*\d[\d,]*\s*(?:per\s*(?:month|year|annum)|\/\s*(?:month|year|annum|m|yr)|p\.?\s*[my]\.?|month|year|annum)?/gi

const PREMIUM_QUOTE_REGEX =
  /(?:₹|rs\.?|inr)\s*\d[\d,]*\s*(?:per\s*(?:month|year|annum)|\/\s*(?:month|year|annum|m|yr)|p\.?\s*[my]\.?)/gi

// PII solicitations.
const PII_REQUEST_REGEX =
  /\b(aadhaar|aadhar|pan\s*(?:card|number|no\.?)|bank\s*account|account\s*number|ifsc|cvv|password|exact\s*address|residential\s*address)\b/gi

const SANITISED_PLACEHOLDER = '[redacted by KIN compliance guard]'

@Injectable()
export class ComplianceGuardService {
  private readonly logger = new Logger(ComplianceGuardService.name)

  /**
   * Validate and sanitise an AI-generated message before it leaves the
   * backend. Always returns a safe-to-render message; never throws.
   */
  async validateAndSanitise(
    rawMessage: string,
    context: ComplianceContext,
    sessionToken?: string,
  ): Promise<ComplianceResult> {
    const violations: string[] = []
    let sanitised = rawMessage

    if (INSURER_REGEX.test(sanitised)) {
      violations.push('insurer_name')
      sanitised = sanitised.replace(INSURER_REGEX, SANITISED_PLACEHOLDER)
    }
    INSURER_REGEX.lastIndex = 0

    if (PREMIUM_QUOTE_REGEX.test(sanitised)) {
      violations.push('premium_quote')
      sanitised = sanitised.replace(PREMIUM_QUOTE_REGEX, SANITISED_PLACEHOLDER)
    }
    PREMIUM_QUOTE_REGEX.lastIndex = 0

    if (PREMIUM_REGEX.test(sanitised)) {
      violations.push('premium_mention')
      sanitised = sanitised.replace(PREMIUM_REGEX, SANITISED_PLACEHOLDER)
    }
    PREMIUM_REGEX.lastIndex = 0

    if (PII_REQUEST_REGEX.test(sanitised)) {
      violations.push('pii_request')
      sanitised = sanitised.replace(PII_REQUEST_REGEX, SANITISED_PLACEHOLDER)
    }
    PII_REQUEST_REGEX.lastIndex = 0

    if (violations.length > 0) {
      this.logger.warn(
        `Compliance violation [${context}] session=${sessionToken ? sessionToken.slice(0, 8) + '…' : 'unknown'} ` +
        `types=${violations.join(',')}`,
      )
    }

    return {
      message: sanitised,
      hadViolations: violations.length > 0,
      violations,
    }
  }
}
