import { Global, Module } from '@nestjs/common';
import { MessageController } from './message.controller';
import { AdminMessageController } from './admin-message.controller';
import { AdminMessageService } from './admin-message.service';

@Global()
@Module({
  controllers: [MessageController, AdminMessageController],
  providers: [AdminMessageService],
  exports: [AdminMessageService],
})
export class MessageModule {}
