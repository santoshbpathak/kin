import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StreakRecord } from '../../database/entities/streak-record.entity'
import { ContentController } from './content.controller'
import { ContentService } from './content.service'
import { StreakService } from '../engagement/streak.service'

@Module({
  imports: [TypeOrmModule.forFeature([StreakRecord])],
  controllers: [ContentController],
  providers: [ContentService, StreakService],
  exports: [ContentService],
})
export class ContentModule {}
