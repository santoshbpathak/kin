import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PartnerConfig } from '../../database/entities/partner-config.entity'
import { PartnerController } from './partner.controller'
import { PartnerService } from './partner.service'

@Module({
  imports: [TypeOrmModule.forFeature([PartnerConfig])],
  controllers: [PartnerController],
  providers: [PartnerService],
  exports: [PartnerService],
})
export class PartnerModule {}
