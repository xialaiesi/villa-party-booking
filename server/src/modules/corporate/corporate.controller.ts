import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { CorporateService } from './corporate.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/corporate')
export class CorporateController {
  constructor(private service: CorporateService) {}

  @Post()
  async create(@CurrentUser('sub') userId: number, @Body() data: any) {
    return this.service.create(userId, data);
  }

  @Get(':orderId')
  async detail(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.service.getDetail(orderId);
  }

  @Post(':orderId/generate-plan')
  async generatePlan(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.service.generatePlan(orderId);
  }

  @Post(':orderId/generate-report')
  async generateReport(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.service.generateReport(orderId);
  }
}
