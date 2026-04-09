import { Module } from '@nestjs/common';
import { FacilityController } from './facility.controller';
import { AdminFacilityController } from './admin-facility.controller';
import { FacilityService } from './facility.service';

@Module({
  controllers: [FacilityController, AdminFacilityController],
  providers: [FacilityService],
})
export class FacilityModule {}
