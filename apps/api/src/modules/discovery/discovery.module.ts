import { Module } from '@nestjs/common'
import { DiscoveryController } from './discovery.controller'
import { DiscoveryEngineService } from './discovery-engine.service'

@Module({
  controllers: [DiscoveryController],
  providers: [DiscoveryEngineService],
  exports: [DiscoveryEngineService],
})
export class DiscoveryModule {}
