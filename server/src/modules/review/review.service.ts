import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  /** 用户创建评价（订单状态=5 已完成） */
  async create(userId: number, data: { orderId: number; rating: number; content?: string; images?: string[] }) {
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

    const review = await this.prisma.review.create({
      data: {
        orderId: data.orderId,
        userId,
        villaId: Number(order.villaId),
        rating: data.rating,
        content: data.content || '',
        images: data.images?.length ? JSON.stringify(data.images) : null,
      },
      include: { user: { select: { nickname: true, avatar: true } } },
    });

    return this.format(review);
  }

  /** 用户编辑评价（仅本人） */
  async update(reviewId: number, userId: number, data: { rating?: number; content?: string; images?: string[] }) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('评价不存在');
    if (Number(review.userId) !== userId) throw new ForbiddenException('无权编辑');

    return this.format(await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: data.rating ?? review.rating,
        content: data.content ?? review.content,
        images: data.images ? JSON.stringify(data.images) : review.images,
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
    };
  }
}
