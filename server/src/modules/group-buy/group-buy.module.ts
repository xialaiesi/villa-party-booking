import { Module } from '@nestjs/common';
import { GroupBuyController } from './group-buy.controller';
import { GroupBuyService } from './group-buy.service';

@Module({
  controllers: [GroupBuyController],
  providers: [GroupBuyService],
})
export class GroupBuyModule {}
