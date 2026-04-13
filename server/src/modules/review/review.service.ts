import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  /** 用户创建评价（订单状态=5 已完成） */
  async create(userId: number, data: { orderId: number; rating: number; content?: string; images?: string[]; videos?: string[] }) {
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      throw new BadRequestException('评分须为 1-5');
    }

    const order = await this.prisma.order.findFirst({
      where: { id: data.orderId, userId, status: 5 },
    });
    if (!order) throw new BadRequestException('仅已完成的订单可评价');

    // 检查是否已评价
    const existing = await this.prisma.review.findFirst({ where: { orderId: data.orderId } });
    if (existing) throw new BadRequestException('该订单已评价');

    // 视频需审核，默认待审核
    const hasVideo = data.videos && data.videos.length > 0;
    const videoStatus = hasVideo ? 0 : undefined;

    const review = await this.prisma.review.create({
      data: {
        orderId: data.orderId,
        userId,
        villaId: Number(order.villaId),
        rating: data.rating,
        content: data.content || '',
        images: data.images?.length ? JSON.stringify(data.images) : null,
        videos: data.videos?.length ? JSON.stringify(data.videos) : null,
        videoStatus,
      },
      include: { user: { select: { nickname: true, avatar: true } } },
    });

    return this.format(review);
  }

  /** 用户编辑评价（仅本人） */
  async update(reviewId: number, userId: number, data: { rating?: number; content?: string; images?: string[]; videos?: string[] }) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('评价不存在');
    if (Number(review.userId) !== userId) throw new ForbiddenException('无权编辑');

    return this.format(await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: data.rating ?? review.rating,
        content: data.content ?? review.content,
        images: data.images ? JSON.stringify(data.images) : review.images,
        videos: data.videos ? JSON.stringify(data.videos) : review.videos,
      },
      include: { user: { select: { nickname: true, avatar: true } } },
    }));
  }

  /** 删除评价（本人或平台超管） */
  async delete(reviewId: number, userId: number, isPlatform: boolean) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('评价不存在');
    if (Number(review.userId) !== userId && !isPlatform) {
      throw new ForbiddenException('无权删除');
    }
    await this.prisma.review.delete({ where: { id: reviewId } });
    return { success: true };
  }

  /** 商家回复评价 */
  async reply(reviewId: number, merchantId: number, replyContent: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { villa: { select: { merchantId: true } } },
    });
    if (!review) throw new NotFoundException('评价不存在');
    if (Number((review as any).villa.merchantId) !== merchantId) {
      throw new ForbiddenException('无权回复');
    }

    return this.format(await this.prisma.review.update({
      where: { id: reviewId },
      data: { reply: replyContent, repliedAt: new Date() },
      include: { user: { select: { nickname: true, avatar: true } } },
    }));
  }

  /** 管理后台删除评价（仅平台超管） */
  async adminDelete(reviewId: number) {
    await this.prisma.review.delete({ where: { id: reviewId } }).catch(() => {
      throw new NotFoundException('评价不存在');
    });
    return { success: true };
  }

  /** 审核视频（通过/拒绝） */
  async reviewVideo(reviewId: number, approved: boolean, reason?: string, coverUrl?: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('评价不存在');
    if (!review.videos) throw new BadRequestException('评价中无视频');

    const videoStatus = approved ? 1 : 2;
    // 更新视频封面
    let videos = review.videos ? JSON.parse(review.videos) : [];
    if (coverUrl && videos.length > 0) {
      videos[0].cover = coverUrl;
    }

    return this.format(await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        videoStatus,
        videos: JSON.stringify(videos),
      },
    }));
  }

  /** 更新视频封面 */
  async updateVideoCover(reviewId: number, coverUrl: string, videoIndex = 0) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('评价不存在');

    let videos = review.videos ? JSON.parse(review.videos) : [];
    if (videos[videoIndex]) {
      videos[videoIndex].cover = coverUrl;
    }

    await this.prisma.review.update({
      where: { id: reviewId },
      data: { videos: JSON.stringify(videos) },
    });

    return { success: true };
  }

  /** 获取所有评价列表（管理后台） */
  async getAdminReviews(page = 1, pageSize = 20, filters?: { videoStatus?: number }) {
    const where: any = {};
    if (filters?.videoStatus !== undefined && filters.videoStatus !== -1) {
      where.videoStatus = filters.videoStatus;
    }
    const [list, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { nickname: true, avatar: true } },
          villa: { select: { name: true } },
          order: { select: { orderNo: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      list: list.map(r => this.format(r)),
      total,
    };
  }

  /** 获取待审核的视频评价列表 */
  async getPendingVideoReviews(page = 1, pageSize = 20) {
    const where = { videos: { not: null }, videoStatus: 0 };
    const [list, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { nickname: true, avatar: true } },
          villa: { select: { name: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      list: list.map(r => this.format(r)),
      total,
    };
  }

  /** 检查订单是否已评价 */
  async hasReview(orderId: number) {
    const review = await this.prisma.review.findFirst({ where: { orderId } });
    return { hasReview: !!review, review: review ? this.format(review) : null };
  }

  private format(r: any) {
    return {
      ...r,
      id: Number(r.id),
      orderId: Number(r.orderId),
      userId: Number(r.userId),
      villaId: Number(r.villaId),
      images: r.images ? JSON.parse(r.images) : [],
      videos: r.videos ? JSON.parse(r.videos) : [],
      videoStatus: r.videoStatus ?? 0,
    };
  }
}
