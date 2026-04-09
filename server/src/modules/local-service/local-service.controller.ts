import { Controller, Get, Post, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { LocalServiceService } from './local-service.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/local-services')
export class LocalServiceController {
  constructor(private service: LocalServiceService) {}

  @Public()
  @Get()
  async list(@Query('category') category?: string) { return this.service.findAll(category); }

  @Public()
  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number) { return this.service.findById(id); }

  @Post('book')
  async book(@CurrentUser('sub') userId: number, @Body() data: any) { return this.service.book(userId, data); }

  @Get('my/orders')
  async myOrders(@CurrentUser('sub') userId: number) { return this.service.getMyServiceOrders(userId); }
}
