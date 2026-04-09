import { Module } from '@nestjs/common';
import { ActivityPlanController } from './activity-plan.controller';
import { ActivityPlanService } from './activity-plan.service';
import { AdminActivityPlanController } from './admin-activity-plan.controller';

@Module({
  controllers: [ActivityPlanController, AdminActivityPlanController],
  providers: [ActivityPlanService],
  exports: [ActivityPlanService],
})
export class ActivityPlanModule {}
