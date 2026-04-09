import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { SeasonalEventService } from './seasonal-event.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/seasonal-events')
export class SeasonalEventController {
  constructor(private service: SeasonalEventService) {}

  @Public()
  @Get()
  async list() { return this.service.listActive(); }

  @Public()
  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number) { return this.service.findById(id); }

  @Post(':id/participate')
  async participate(@Param('id', ParseIntPipe) id: number) { return this.service.participate(id); }
}
