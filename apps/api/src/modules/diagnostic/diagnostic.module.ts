import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserProfile } from '../../database/entities/user-profile.entity'
import { DiagnosticController } from './diagnostic.controller'
import { DiagnosticService } from './diagnostic.service'
import { NlpParserService } from './nlp-parser.service'

@Module({
  imports: [TypeOrmModule.forFeature([UserProfile])],
  controllers: [DiagnosticController],
  providers: [DiagnosticService, NlpParserService],
  exports: [DiagnosticService],
})
export class DiagnosticModule {}
