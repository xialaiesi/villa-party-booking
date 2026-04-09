import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { OrderShareService } from './order-share.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/shares')
export class OrderShareController {
  constructor(private service: OrderShareService) {}

  /** 发起费用分摊 */
  @Post()
  async create(
    @CurrentUser('sub') userId: number,
    @Body() data: any,
  ) {
    return this.service.create(userId, data);
  }

  /** 查看分摊详情（公开，参与者通过链接访问） */
  @Public()
  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.getDetail(id);
  }

  /** 加入分摊 */
  @Post(':id/join')
  async join(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
  ) {
    return this.service.join(id, userId);
  }

  /** 成员支付 */
  @Post('payments/:paymentId/pay')
  async pay(
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @CurrentUser('sub') userId: number,
  ) {
    return this.service.pay(paymentId, userId);
  }
}
