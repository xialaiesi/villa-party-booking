import { Module } from '@nestjs/common';
import { LocalServiceController } from './local-service.controller';
import { AdminLocalServiceController } from './admin-local-service.controller';
import { LocalServiceService } from './local-service.service';

@Module({
  controllers: [LocalServiceController, AdminLocalServiceController],
  providers: [LocalServiceService],
})
export class LocalServiceModule {}
