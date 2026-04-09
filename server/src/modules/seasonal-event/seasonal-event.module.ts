import { Module } from '@nestjs/common';
import { SeasonalEventController } from './seasonal-event.controller';
import { AdminSeasonalEventController } from './admin-seasonal-event.controller';
import { SeasonalEventService } from './seasonal-event.service';

@Module({
  controllers: [SeasonalEventController, AdminSeasonalEventController],
  providers: [SeasonalEventService],
})
export class SeasonalEventModule {}
