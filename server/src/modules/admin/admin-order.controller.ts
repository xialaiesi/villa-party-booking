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

@Controller('api/admin/orders')
export class AdminOrderController {
  constructor(private adminService: AdminService) {}

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

  @Post(':id/confirm')
  async confirm(@AdminCtx() ctx: AdminContext, @Param('id', ParseIntPipe) id: number) {
    return this.adminService.confirmOrder(ctx, id);
  }

  @Post(':id/reject')
  async reject(
    @AdminCtx() ctx: AdminContext,
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.rejectOrder(ctx, id, reason);
  }

  @Post(':id/deposit/refund')
  async refundDeposit(
    @AdminCtx() ctx: AdminContext,
    @Param('id', ParseIntPipe) id: number,
    @Body('amount') amount: number,
  ) {
    return this.adminService.refundDeposit(ctx, id, amount);
  }
}
