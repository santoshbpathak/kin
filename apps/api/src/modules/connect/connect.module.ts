import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdvisorBooking } from '../../database/entities/advisor-booking.entity'
import { ConnectController } from './connect.controller'
import { ConnectService } from './connect.service'

@Module({
  imports: [TypeOrmModule.forFeature([AdvisorBooking])],
  controllers: [ConnectController],
  providers: [ConnectService],
  exports: [ConnectService],
})
export class ConnectModule {}
