import { Controller, Get, Post, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { GroupBuyService } from './group-buy.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/groups')
export class GroupBuyController {
  constructor(private service: GroupBuyService) {}

  @Post()
  async create(@CurrentUser('sub') userId: number, @Body() data: any) {
    return this.service.create(userId, data);
  }

  @Public()
  @Get()
  async listActive(@Query('villaId') villaId?: string) {
    return this.service.listActive(villaId ? parseInt(villaId) : undefined);
  }

  @Public()
  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Post(':id/join')
  async join(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') userId: number) {
    return this.service.join(id, userId);
  }
}
