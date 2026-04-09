import { Module } from '@nestjs/common';
import { OrderShareController } from './order-share.controller';
import { OrderShareService } from './order-share.service';

@Module({
  controllers: [OrderShareController],
  providers: [OrderShareService],
  exports: [OrderShareService],
})
export class OrderShareModule {}
