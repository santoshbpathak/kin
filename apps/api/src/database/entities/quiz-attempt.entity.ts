import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm'
import { timestampColumnType } from './column-types'

@Entity('quiz_attempts')
@Unique(['userId', 'weekNumber'])
export class QuizAttempt {
  @PrimaryGeneratedColumn('uuid')
  attemptId: string

  @Index()
  @Column()
  userId: string

  @Column({ type: 'smallint' })
  weekNumber: number

  @Column({ type: 'smallint' })
  correctCount: number

  @Column({ type: 'smallint' })
  delta: number

  @CreateDateColumn({ type: timestampColumnType })
  completedAt: Date
}
