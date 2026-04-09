import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrderShareService {
  constructor(private prisma: PrismaService) {}

  /** 发起人创建费用分摊 */
  async create(
    userId: number,
    data: {
      orderId: number;
      memberCount: number;
      shareMode: number; // 1-平均 2-自定义
      customAmounts?: { userId?: number; amount: number }[];
      expireHours?: number;
    },
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: data.orderId, userId },
    });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== 0 && order.status !== 1) {
      throw new BadRequestException('当前订单状态不支持分摊');
    }

    const totalAmount = Number(order.totalAmount);
    const expireAt = data.expireHours
      ? new Date(Date.now() + data.expireHours * 3600 * 1000)
      : new Date(Date.now() + 24 * 3600 * 1000); // 默认24小时

    const share = await this.prisma.orderShare.create({
      data: {
        orderId: data.orderId,
        initiatorId: userId,
        shareMode: data.shareMode,
        totalAmount,
        memberCount: data.memberCount,
        expireAt,
      },
    });

    // 平均模式：预创建每人支付记录（发起人自己也要付）
    if (data.shareMode === 1) {
      const perAmount = Math.floor((totalAmount / data.memberCount) * 100) / 100;
      // 发起人自己的那份
      await this.prisma.sharePayment.create({
        data: {
          shareId: share.id,
          userId,
          amount: perAmount,
          status: 0,
        },
      });
    }

    return this.formatShare(share);
  }

  /** 获取分摊详情（含支付进度） */
  async getDetail(shareId: number) {
    const share = await this.prisma.orderShare.findUnique({
      where: { id: shareId },
      include: {
        order: {
          select: {
            orderNo: true,
            villa: { select: { name: true, coverImage: true } },
            checkIn: true,
            checkOut: true,
            totalAmount: true,
          },
        },
        payments: {
          include: { user: { select: { nickname: true, avatar: true } } },
        },
      },
    });
    if (!share) throw new NotFoundException('分摊不存在');
    return this.formatShare(share);
  }

  /** 参与者加入分摊 */
  async join(shareId: number, userId: number) {
    const share = await this.prisma.orderShare.findUnique({
      where: { id: shareId },
      include: { payments: true },
    });
    if (!share) throw new NotFoundException('分摊不存在');
    if (share.status !== 0) throw new BadRequestException('分摊已结束');
    if (share.expireAt && new Date() > share.expireAt) {
      throw new BadRequestException('分摊已过期');
    }

    // 检查是否已加入
    const existing = share.payments.find((p) => Number(p.userId) === userId);
    if (existing) return { message: '已加入', paymentId: Number(existing.id) };

    // 检查人数是否已满
    if (share.payments.length >= share.memberCount) {
      throw new BadRequestException('分摊人数已满');
    }

    const perAmount =
      Math.floor((Number(share.totalAmount) / share.memberCount) * 100) / 100;

    const payment = await this.prisma.sharePayment.create({
      data: {
        shareId,
        userId,
        amount: perAmount,
        status: 0,
      },
    });

    return { message: '已加入', paymentId: Number(payment.id) };
  }

  /** 成员完成支付 */
  async pay(paymentId: number, userId: number) {
    const payment = await this.prisma.sharePayment.findFirst({
      where: { id: paymentId, userId },
      include: { share: { include: { payments: true } } },
    });
    if (!payment) throw new NotFoundException('支付记录不存在');
    if (payment.status === 1) return { message: '已支付' };

    // TODO: 实际调用微信支付，这里模拟成功
    await this.prisma.sharePayment.update({
      where: { id: paymentId },
      data: { status: 1, paidAt: new Date() },
    });

    // 检查是否全员已付
    const allPayments = await this.prisma.sharePayment.findMany({
      where: { shareId: payment.shareId },
    });
    const allPaid =
      allPayments.length >= payment.share.memberCount &&
      allPayments.every((p) => Number(p.id) === Number(paymentId) || p.status === 1);

    if (allPaid) {
      await this.prisma.orderShare.update({
        where: { id: payment.shareId },
        data: { status: 1 },
      });
      // 更新订单状态为已支付
      await this.prisma.order.update({
        where: { id: payment.share.orderId },
        data: { status: 1, paidAt: new Date() },
      });
    }

    return { message: '支付成功', allPaid };
  }

  private formatShare(share: any) {
    return {
      ...share,
      id: Number(share.id),
      orderId: Number(share.orderId),
      initiatorId: Number(share.initiatorId),
      totalAmount: Number(share.totalAmount),
      payments: share.payments?.map((p: any) => ({
        ...p,
        id: Number(p.id),
        userId: Number(p.userId),
        amount: Number(p.amount),
      })),
    };
  }
}
