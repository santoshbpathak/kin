import { ComplianceGuardService } from './compliance-guard.service'

describe('ComplianceGuardService', () => {
  const guard = new ComplianceGuardService()

  describe('insurer name detection (Brief §5)', () => {
    it('blocks LIC', async () => {
      const r = await guard.validateAndSanitise(
        'You could check with LIC for term options.',
        'diagnostic',
      )
      expect(r.hadViolations).toBe(true)
      expect(r.violations).toContain('insurer_name')
      expect(r.message).not.toMatch(/\bLIC\b/i)
    })

    it('blocks HDFC Life', async () => {
      const r = await guard.validateAndSanitise(
        'Look at HDFC Life products with your advisor.',
        'advisor',
      )
      expect(r.hadViolations).toBe(true)
      expect(r.violations).toContain('insurer_name')
      expect(r.message).not.toMatch(/HDFC Life/i)
    })

    it('blocks ICICI Prudential', async () => {
      const r = await guard.validateAndSanitise(
        'ICICI Prudential has competitive options.',
        'advisor',
      )
      expect(r.hadViolations).toBe(true)
      expect(r.violations).toContain('insurer_name')
    })

    it('lets a clean message through', async () => {
      const r = await guard.validateAndSanitise(
        "Let's talk about term life cover and how the math works.",
        'diagnostic',
      )
      expect(r.hadViolations).toBe(false)
      expect(r.violations).toEqual([])
      expect(r.message).toBe("Let's talk about term life cover and how the math works.")
    })
  })

  describe('premium / cost figures', () => {
    it('blocks an explicit rupee monthly quote', async () => {
      const r = await guard.validateAndSanitise(
        'A typical premium of ₹15,000 per year.',
        'advisor',
      )
      expect(r.hadViolations).toBe(true)
    })

    it('blocks a rupee figure with "per month"', async () => {
      const r = await guard.validateAndSanitise(
        'You could expect ₹1,200 per month roughly.',
        'advisor',
      )
      expect(r.hadViolations).toBe(true)
    })
  })

  describe('PII solicitations', () => {
    it('blocks Aadhaar requests', async () => {
      const r = await guard.validateAndSanitise(
        'Share your Aadhaar to proceed.',
        'diagnostic',
      )
      expect(r.hadViolations).toBe(true)
      expect(r.violations).toContain('pii_request')
    })

    it('blocks PAN card requests', async () => {
      const r = await guard.validateAndSanitise(
        'I need your PAN number to continue.',
        'diagnostic',
      )
      expect(r.hadViolations).toBe(true)
      expect(r.violations).toContain('pii_request')
    })

    it('blocks bank account requests', async () => {
      const r = await guard.validateAndSanitise(
        'Please share your bank account details.',
        'advisor',
      )
      expect(r.hadViolations).toBe(true)
    })
  })
})
