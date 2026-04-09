import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { FacilityService } from './facility.service';
import { AdminCtx } from '../../common/decorators/admin-context.decorator';
import type { AdminContext } from '../../common/types/admin-context';

@Controller('api/admin/facilities')
export class AdminFacilityController {
  constructor(private service: FacilityService) {}

  @Get()
  async list(@AdminCtx() ctx: AdminContext) { return this.service.adminList(ctx); }

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
