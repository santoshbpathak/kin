import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserProfile } from '../../database/entities/user-profile.entity'
import { NlpParserService, ParsedProfile } from './nlp-parser.service'

export interface DiagnosticAnswers {
  lifeStage: string
  annualIncome: string
  dependants: string
  monthlyObligations: string
  existingInsurance: string
  city: string
  occupation: string
}

@Injectable()
export class DiagnosticService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userRepo: Repository<UserProfile>,
    private readonly parser: NlpParserService,
  ) {}

  parseAnswers(answers: DiagnosticAnswers): ParsedProfile {
    const { band: incomeBand, midpointLakhs } = this.parser.parseIncomeBand(answers.annualIncome)
    const { count: dependantsCount } = this.parser.parseDependants(answers.dependants)
    const coverages = this.parser.parseCoverages(answers.existingInsurance)
    const cityTier = this.parser.parseCityTier(answers.city)
    const occupationCategory = this.parser.parseOccupation(answers.occupation)

    // Life stage mapping
    const lifeStageMap: Record<string, 'single' | 'married_no_kids' | 'married_with_kids' | 'parent_caregiver'> = {
      single:              'single',
      married_no_kids:     'married_no_kids',
      married_with_kids:   'married_with_kids',
      parent_caregiver:    'parent_caregiver',
    }
    const lifeStage = lifeStageMap[answers.lifeStage] ?? 'single'

    return {
      incomeBand,
      cityTier,
      lifeStage,
      dependantsCount,
      monthlyObligationsBand: answers.monthlyObligations,
      hasLifeCover: coverages.hasLifeCover,
      hasHealthCover: coverages.hasHealthCover,
      hasAccidentCover: coverages.hasAccidentCover,
      termCoverAmount: coverages.termCoverAmount,
      healthCoverAmount: coverages.healthCoverAmount,
      incomeProtectionAmount: 0,
      annualIncomeLakhs: midpointLakhs,
      occupationCategory,
    }
  }

  async saveProfile(userId: string, parsed: ParsedProfile): Promise<UserProfile> {
    await this.userRepo.update(userId, {
      incomeBand: parsed.incomeBand,
      cityTier: parsed.cityTier,
      lifeStage: parsed.lifeStage,
      dependantsCount: parsed.dependantsCount,
      monthlyObligationsBand: parsed.monthlyObligationsBand,
    })
    const updated = await this.userRepo.findOneOrFail({ where: { userId } })
    return updated
  }
}
