import { Module } from '@nestjs/common'
import { LifecycleController } from './lifecycle.controller'
import { WhatsAppService } from './whatsapp.service'
import { NotificationPrefsService } from './notification-prefs.service'

@Module({
  controllers: [LifecycleController],
  providers: [WhatsAppService, NotificationPrefsService],
  exports: [WhatsAppService, NotificationPrefsService],
})
export class LifecycleModule {}
