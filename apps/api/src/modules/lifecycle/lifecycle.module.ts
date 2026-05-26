import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NotificationPrefsEntity } from '../../database/entities/notification-prefs.entity'
import { LifecycleController } from './lifecycle.controller'
import { WhatsAppService } from './whatsapp.service'
import { NotificationPrefsService } from './notification-prefs.service'

@Module({
  imports: [TypeOrmModule.forFeature([NotificationPrefsEntity])],
  controllers: [LifecycleController],
  providers: [WhatsAppService, NotificationPrefsService],
  exports: [WhatsAppService, NotificationPrefsService],
})
export class LifecycleModule {}
