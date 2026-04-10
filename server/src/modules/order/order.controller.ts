import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ORDER_STATUS_MAP } from '../../common/constants/order-status';

@Controller('api/orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  /** 订单状态字典（前台用） */
  @Public()
  @Get('status-dict')
  getStatusDict() {
    return ORDER_STATUS_MAP;
  }

  @Post()
  async create(
    @CurrentUser('sub') userId: number,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.create(userId, dto);
  }

  @Get()
  async list(
    @CurrentUser('sub') userId: number,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.orderService.findByUser(
      userId,
      status !== undefined ? parseInt(status) : undefined,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 10,
    );
  }

  @Get(':id')
  async detail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
  ) {
    return this.orderService.findById(id, userId);
  }

  /** Mock 支付定金（前端点击后调用，状态不变，等商家确认） */
  @Post(':id/pay-deposit')
  async payDeposit(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
  ) {
    return this.orderService.mockPayDeposit(id, userId);
  }

  /** Mock 支付尾款（前端点击后调用，状态不变，等商家确认） */
  @Post(':id/pay-final')
  async payFinal(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
  ) {
    return this.orderService.mockPayFinal(id, userId);
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
    @Body('reason') reason?: string,
  ) {
    return this.orderService.cancel(id, userId, reason);
  }
}
