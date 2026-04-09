import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { PackageService } from './package.service';

@Controller('api/admin/packages')
export class AdminPackageController {
  constructor(private service: PackageService) {}

  @Get()
  async list(@Query('page') page?: string, @Query('pageSize') ps?: string) {
    return this.service.adminList(page ? parseInt(page) : 1, ps ? parseInt(ps) : 10);
  }

  @Post()
  async create(@Body() data: any) { return this.service.create(data); }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.update(id, data); }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) { return this.service.delete(id); }
}
