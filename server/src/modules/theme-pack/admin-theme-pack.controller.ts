import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ThemePackService } from './theme-pack.service';

@Controller('api/admin/theme-packs')
export class AdminThemePackController {
  constructor(private service: ThemePackService) {}

  @Get()
  async list(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.service.adminList(page ? parseInt(page) : 1, pageSize ? parseInt(pageSize) : 10);
  }

  @Post()
  async create(@Body() data: any) { return this.service.create(data); }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.update(id, data); }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) { return this.service.delete(id); }
}
