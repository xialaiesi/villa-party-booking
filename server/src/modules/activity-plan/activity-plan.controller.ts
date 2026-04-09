import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ActivityPlanService } from './activity-plan.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/activity-plans')
export class ActivityPlanController {
  constructor(private service: ActivityPlanService) {}

  @Public()
  @Get()
  async recommend(
    @Query('scene') scene?: string,
    @Query('guests') guests?: string,
  ) {
    return this.service.recommend({
      scene,
      guests: guests ? parseInt(guests) : undefined,
    });
  }

  @Public()
  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }
}
