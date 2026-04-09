import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { AdminCtx } from '../../common/decorators/admin-context.decorator';
import type { AdminContext } from '../../common/types/admin-context';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('api/admin/merchants')
@UseGuards(RolesGuard)
export class AdminMerchantController {
  constructor(private service: MerchantService) {}

  // ============ 平台超管接口 ============

  @Roles('platform')
  @Get()
  async list(@Query('page') page?: string, @Query('pageSize') ps?: string) {
    return this.service.list(page ? parseInt(page) : 1, ps ? parseInt(ps) : 10);
  }

  @Roles('platform')
  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Roles('platform')
  @Post()
  async create(@Body() data: any) { return this.service.create(data); }

  @Roles('platform')
  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Roles('platform')
  @Put(':id/status')
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: number) {
    return this.service.updateStatus(id, status);
  }

  @Roles('platform')
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) { return this.service.delete(id); }

  // ============ 商家财务 ============

  @Get('my/finance')
  async myFinance(@AdminCtx() ctx: AdminContext) {
    return this.service.finance(ctx);
  }

  @Get('my/settlements')
  async mySettlements(
    @AdminCtx() ctx: AdminContext,
    @Query('page') page?: string,
    @Query('pageSize') ps?: string,
  ) {
    return this.service.settlements(ctx, page ? parseInt(page) : 1, ps ? parseInt(ps) : 20);
  }

  // ============ 平台超管：标记结算完成 ============

  @Roles('platform')
  @Post('settlements/:id/mark-settled')
  async markSettled(@Param('id', ParseIntPipe) id: number) {
    return this.service.markSettled(id);
  }
}
