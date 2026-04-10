import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import type { AdminContext } from './admin.service';
import { AdminCtx } from '../../common/decorators/admin-context.decorator';
import { ORDER_STATUS_MAP } from '../../common/constants/order-status';

@Controller('api/admin/orders')
export class AdminOrderController {
  constructor(private adminService: AdminService) {}

  /** 订单状态字典 */
  @Get('status-dict')
  getStatusDict() {
    return ORDER_STATUS_MAP;
  }

  @Get()
  async list(
    @AdminCtx() ctx: AdminContext,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getOrders(
      ctx,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 10,
      status !== undefined ? parseInt(status) : undefined,
    );
  }

  /** 确认定金到账（0→1） */
  @Post(':id/deposit-paid')
  async confirmDeposit(@AdminCtx() ctx: AdminContext, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.confirmDepositPaid(ctx, id);
  }

  /** 商家确认订单（1→2） */
  @Post(':id/confirm')
  async confirm(@AdminCtx() ctx: AdminContext, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.confirmOrder(ctx, id);
  }

  /** 拒绝订单（1→7） */
  @Post(':id/reject')
  async reject(
    @AdminCtx() ctx: AdminContext,
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.rejectOrder(ctx, id, reason);
  }

  /** 确认尾款到账（2→3） */
  @Post(':id/final-paid')
  async finalPaid(@AdminCtx() ctx: AdminContext, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.confirmFinalPayment(ctx, id);
  }

  /** 标记已入住（3→4） */
  @Post(':id/check-in')
  async checkIn(@AdminCtx() ctx: AdminContext, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.markCheckedIn(ctx, id);
  }

  /** 手动完成（4→5） */
  @Post(':id/complete')
  async complete(@AdminCtx() ctx: AdminContext, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.markCompleted(ctx, id);
  }
}
