import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { VillaService } from '../villa/villa.service';

@Controller('api/admin/villas')
export class AdminVillaController {
  constructor(
    private adminService: AdminService,
    private villaService: VillaService,
  ) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getVillas(
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 10,
      status !== undefined ? parseInt(status) : undefined,
    );
  }

  @Post()
  async create(@Body() data: any) {
    return this.adminService.createVilla(data);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.adminService.updateVilla(id, data);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: number,
  ) {
    return this.adminService.updateVillaStatus(id, status);
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
    @Param('id', ParseIntPipe) id: number,
    @Body('dates') dates: { date: string; price: number; status: number }[],
  ) {
    return this.adminService.setCalendar(id, dates);
  }
}
