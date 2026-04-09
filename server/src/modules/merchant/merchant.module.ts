import { Module } from '@nestjs/common';
import { MerchantController } from './merchant.controller';
import { AdminMerchantController } from './admin-merchant.controller';
import { MerchantService } from './merchant.service';

@Module({
  controllers: [MerchantController, AdminMerchantController],
  providers: [MerchantService],
  exports: [MerchantService],
})
export class MerchantModule {}
