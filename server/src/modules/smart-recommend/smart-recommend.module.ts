import { Module } from '@nestjs/common';
import { SmartRecommendController } from './smart-recommend.controller';
import { SmartRecommendService } from './smart-recommend.service';

@Module({
  controllers: [SmartRecommendController],
  providers: [SmartRecommendService],
})
export class SmartRecommendModule {}
