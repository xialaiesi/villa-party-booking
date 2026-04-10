import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderCronService } from './order-cron.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, OrderCronService],
  exports: [OrderService],
})
export class OrderModule {}
