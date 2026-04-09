import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ThemePackService } from './theme-pack.service';
import { AdminCtx } from '../../common/decorators/admin-context.decorator';
import type { AdminContext } from '../../common/types/admin-context';

@Controller('api/admin/theme-packs')
export class AdminThemePackController {
  constructor(private service: ThemePackService) {}

  @Get()
  async list(
    @AdminCtx() ctx: AdminContext,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.adminList(ctx, page ? parseInt(page) : 1, pageSize ? parseInt(pageSize) : 10);
  }

  @Post()
  async create(@AdminCtx() ctx: AdminContext, @Body() data: any) { return this.service.create(ctx, data); }

  @Put(':id')
  async update(@AdminCtx() ctx: AdminContext, @Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.service.update(ctx, id, data);
  }

  @Delete(':id')
  async delete(@AdminCtx() ctx: AdminContext, @Param('id', ParseIntPipe) id: number) {
    return this.service.delete(ctx, id);
  }
}
