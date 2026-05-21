import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { VaultDocument } from '../../database/entities/vault-document.entity'
import { Nominee } from '../../database/entities/nominee.entity'
import { UnlockTrigger } from '../../database/entities/unlock-trigger.entity'
import { VaultController } from './vault.controller'
import { VaultService } from './vault.service'
import { NomineeService } from './nominee.service'
import { UnlockService } from './unlock.service'

@Module({
  imports: [TypeOrmModule.forFeature([VaultDocument, Nominee, UnlockTrigger])],
  controllers: [VaultController],
  providers: [VaultService, NomineeService, UnlockService],
  exports: [VaultService, NomineeService],
})
export class VaultModule {}
