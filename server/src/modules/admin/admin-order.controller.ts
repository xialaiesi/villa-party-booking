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

@Controller('api/admin/orders')
export class AdminOrderController {
  constructor(private adminService: AdminService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getOrders(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 10,
      status !== undefined ? parseInt(status) : undefined,
    );
  }

  @Post(':id/confirm')
  async confirm(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.confirmOrder(id);
  }

  @Post(':id/reject')
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ) {
    return this.adminService.rejectOrder(id, reason);
  }

  @Post(':id/deposit/refund')
  async refundDeposit(
    @Param('id', ParseIntPipe) id: number,
    @Body('amount') amount: number,
  ) {
    return this.adminService.refundDeposit(id, amount);
  }
}
