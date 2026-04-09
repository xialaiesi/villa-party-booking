import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { FacilityService } from './facility.service';

@Controller('api/admin/facilities')
export class AdminFacilityController {
  constructor(private service: FacilityService) {}

  @Get()
  async list() { return this.service.adminList(); }

  @Post()
  async create(@Body() data: any) { return this.service.create(data); }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.update(id, data); }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) { return this.service.delete(id); }
}
