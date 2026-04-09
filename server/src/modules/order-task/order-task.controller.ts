import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { OrderTaskService } from './order-task.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/orders')
export class OrderTaskController {
  constructor(private service: OrderTaskService) {}

  /** 获取订单任务清单（含倒计时） */
  @Get(':orderId/tasks')
  async getTasks(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser('sub') userId: number,
  ) {
    return this.service.getTasks(orderId, userId);
  }

  /** 生成任务清单（订单确认后手动触发或自动调用） */
  @Post(':orderId/tasks/generate')
  async generate(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.service.generateTasks(orderId);
  }

  /** 勾选/取消任务 */
  @Post('tasks/:taskId/toggle')
  async toggle(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('sub') userId: number,
  ) {
    return this.service.toggleTask(taskId, userId);
  }
}
