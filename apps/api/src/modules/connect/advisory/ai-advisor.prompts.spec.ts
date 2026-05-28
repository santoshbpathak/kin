import { buildAdvisorSystemPrompt, promptHash } from './ai-advisor.prompts'
import type { KinReportSnapshot } from '../../../database/entities/advisor-session.entity'

const SAMPLE_REPORT: KinReportSnapshot = {
  compositeScore: 62,
  lifeSubScore: 40,
  healthSubScore: 75,
  incomeSubScore: 60,
  lifeGapSummary: 'Term cover gap of about ₹1.2 Cr',
  healthGapSummary: 'Mediclaim covers about 60% of recommended',
  incomeGapSummary: 'No income protection in place yet',
  topRecommendation: 'Add ₹1.2 Cr term cover',
  recommendations: [
    {
      type: 'term_life',
      title: 'Add ₹1.2 Cr Term Cover',
      basisText: '10 × annual income minus existing cover.',
    },
  ],
  hiddenCoverages: ['EDLI'],
  estimatedFields: ['employer_group_term_amount'],
  unknownFields: [],
}

describe('buildAdvisorSystemPrompt', () => {
  it('always contains the canonical opening identity line (Brief §5)', () => {
    const prompt = buildAdvisorSystemPrompt(SAMPLE_REPORT)
    expect(prompt).toMatch(/"Hi, I'm KIN's AI assistant\./i)
  })

  it('injects the composite score and sub-scores', () => {
    const prompt = buildAdvisorSystemPrompt(SAMPLE_REPORT)
    expect(prompt).toContain('Protection Score: 62/100')
    expect(prompt).toContain('Life Protection: 40/100')
    expect(prompt).toContain('Health Protection: 75/100')
    expect(prompt).toContain('Income Protection: 60/100')
  })

  it('mentions estimated fields when present', () => {
    const prompt = buildAdvisorSystemPrompt(SAMPLE_REPORT)
    expect(prompt).toContain('employer_group_term_amount')
  })

  it('lists at least the first recommendation', () => {
    const prompt = buildAdvisorSystemPrompt(SAMPLE_REPORT)
    expect(prompt).toContain('Add ₹1.2 Cr Term Cover')
    expect(prompt).toContain('10 × annual income minus existing cover')
  })

  it('forbids insurer names in the compliance rule block', () => {
    const prompt = buildAdvisorSystemPrompt(SAMPLE_REPORT)
    expect(prompt).toMatch(/NEVER name any insurance company/i)
  })
})

describe('promptHash', () => {
  it('returns a stable 64-char hex digest', () => {
    const h1 = promptHash('abc')
    const h2 = promptHash('abc')
    expect(h1).toBe(h2)
    expect(h1).toHaveLength(64)
    expect(h1).toMatch(/^[0-9a-f]+$/)
  })

  it('changes when the prompt changes', () => {
    expect(promptHash('a')).not.toBe(promptHash('b'))
  })
})
