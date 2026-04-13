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
    @Body() data: { orderId: number; rating: number; content?: string; images?: string[]; videos?: string[] },
  ) {
    return this.service.create(userId, data);
  }

  /** 用户编辑评价 */
  @Put('reviews/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
    @Body() data: { rating?: number; content?: string; images?: string[]; videos?: string[] },
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

  /** 审核视频（通过/拒绝） */
  @Post('admin/reviews/:id/video-review')
  async reviewVideo(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { approved: boolean; reason?: string },
  ) {
    return this.service.reviewVideo(id, body.approved, body.reason);
  }

  /** 获取所有评价列表（管理后台） */
  @Get('admin/reviews')
  async getAdminReviews(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('videoStatus') videoStatus?: string,
  ) {
    const filters: any = {};
    if (videoStatus !== undefined && videoStatus !== '') {
      filters.videoStatus = Number(videoStatus);
    }
    return this.service.getAdminReviews(Number(page), Number(pageSize), filters);
  }

  /** 获取待审核视频列表 */
  @Get('admin/reviews/pending-videos')
  async getPendingVideos(
    @Query('page', ParseIntPipe) page = 1,
    @Query('pageSize', ParseIntPipe) pageSize = 20,
  ) {
    return this.service.getPendingVideoReviews(page, pageSize);
  }
}
