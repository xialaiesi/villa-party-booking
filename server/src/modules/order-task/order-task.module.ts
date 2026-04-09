import { Module } from '@nestjs/common';
import { OrderTaskController } from './order-task.controller';
import { OrderTaskService } from './order-task.service';

@Module({
  controllers: [OrderTaskController],
  providers: [OrderTaskService],
  exports: [OrderTaskService],
})
export class OrderTaskModule {}
