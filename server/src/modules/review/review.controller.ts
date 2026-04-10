import { Controller, Post, Put, Delete, Get, Param, Body, Req, Query, ParseIntPipe } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api')
export class ReviewController {
  constructor(private service: ReviewService) {}

  /** 用户创建评价 */
  @Post('reviews')
  async create(
    @CurrentUser('sub') userId: number,
    @Body() data: { orderId: number; rating: number; content?: string; images?: string[] },
  ) {
    return this.service.create(userId, data);
  }

  /** 用户编辑评价 */
  @Put('reviews/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
    @Body() data: { rating?: number; content?: string; images?: string[] },
  ) {
    return this.service.update(id, userId, data);
  }

  /** 用户删除评价 */
  @Delete('reviews/:id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
  ) {
    return this.service.delete(id, userId, false);
  }

  /** 检查订单是否已评价 */
  @Get('orders/:orderId/review')
  async check(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.service.hasReview(orderId);
  }

  // ===== 管理后台 =====

  /** 商家回复评价 */
  @Post('admin/reviews/:id/reply')
  async reply(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body('reply') reply: string,
  ) {
    const merchantId = req.user?.merchantId;
    return this.service.reply(id, merchantId, reply);
  }

  /** 超管删除评价 */
  @Delete('admin/reviews/:id')
  async adminDelete(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    if (req.user?.role !== 'platform') {
      return this.service.delete(id, req.user?.sub, false);
    }
    return this.service.adminDelete(id);
  }
}
