import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/merchants')
export class MerchantController {
  constructor(private service: MerchantService) {}

  /** 商家公开页面 */
  @Public()
  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.publicInfo(id);
  }
}
