import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import type { AdminContext } from './admin.service';
import { VillaService } from '../villa/villa.service';
import { AdminCtx } from '../../common/decorators/admin-context.decorator';

@Controller('api/admin/villas')
export class AdminVillaController {
  constructor(
    private adminService: AdminService,
    private villaService: VillaService,
  ) {}

  @Get()
  async list(
    @AdminCtx() ctx: AdminContext,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getVillas(
      ctx,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 10,
      status !== undefined ? parseInt(status) : undefined,
    );
  }

  @Post()
  async create(@AdminCtx() ctx: AdminContext, @Body() data: any) {
    return this.adminService.createVilla(ctx, data);
  }

  @Put(':id')
  async update(
    @AdminCtx() ctx: AdminContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.adminService.updateVilla(ctx, id, data);
  }

  @Put(':id/status')
  async updateStatus(
    @AdminCtx() ctx: AdminContext,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: number,
  ) {
    return this.adminService.updateVillaStatus(ctx, id, status);
  }

  @Get(':id/calendar')
  async getCalendar(
    @Param('id', ParseIntPipe) id: number,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.villaService.getCalendar(
      id,
      parseInt(year) || new Date().getFullYear(),
      parseInt(month) || new Date().getMonth() + 1,
    );
  }

  @Put(':id/calendar')
  async setCalendar(
    @AdminCtx() ctx: AdminContext,
    @Param('id', ParseIntPipe) id: number,
    @Body('dates') dates: { date: string; price: number; status: number }[],
  ) {
    return this.adminService.setCalendar(ctx, id, dates);
  }

  @Get(':id/slots')
  async getSlots(
    @AdminCtx() ctx: AdminContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.getVillaSlots(ctx, id);
  }

  @Put(':id/slots')
  async setSlots(
    @AdminCtx() ctx: AdminContext,
    @Param('id', ParseIntPipe) id: number,
    @Body('slots') slots: any[],
  ) {
    return this.adminService.setVillaSlots(ctx, id, slots || []);
  }
}
