/**
 * PeerBenchmarkService — Module 4
 *
 * Returns anonymised cohort-level averages.
 * NO individual data exposed — only aggregates by (age_band + city_tier + income_band).
 */
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ProtectionScore } from '../../database/entities/protection-score.entity'

@Injectable()
export class PeerBenchmarkService {
  constructor(
    @InjectRepository(ProtectionScore)
    private readonly scoreRepo: Repository<ProtectionScore>,
  ) {}

  async getCohortAverage(incomeBand: string, cityTier: string): Promise<{ peerAverage: number; percentile: number }> {
    // Phase 2: join UserProfile + ProtectionScore for cohort query
    // MVP1: return static benchmark data by band
    const benchmarks: Record<string, number> = {
      'lt3l_T3':    28,
      'lt3l_T2':    30,
      'lt3l_T1':    33,
      '3l_5l_T3':   32,
      '3l_5l_T2':   35,
      '3l_5l_T1':   38,
      '5l_10l_T3':  40,
      '5l_10l_T2':  43,
      '5l_10l_T1':  47,
      '10l_20l_T2': 50,
      '10l_20l_T1': 54,
      '20l_50l_T1': 62,
      'gt50l_T1':   71,
    }
    const key = `${incomeBand}_${cityTier}`
    const peerAverage = benchmarks[key] ?? 45

    return { peerAverage, percentile: 0 } // percentile computed after real data
  }
}
