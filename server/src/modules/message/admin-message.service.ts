import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ORDER_STATUS_MAP } from '../../common/constants/order-status';

@Injectable()
export class AdminMessageService {
  constructor(private prisma: PrismaService) {}

  /** 发送消息给商家的所有管理员 */
  async send(data: {
    merchantId: number;
    type: string;
    title: string;
    content: string;
    link?: string;
  }) {
    await this.prisma.adminMessage.create({
      data: {
        merchantId: data.merchantId,
        type: data.type,
        title: data.title,
        content: data.content,
        link: data.link,
      },
    });
  }

  /** 订单状态变更时自动发消息 */
  async notifyOrderStatusChange(order: any, newStatus: number) {
    const statusInfo = ORDER_STATUS_MAP[newStatus];
    if (!statusInfo) return;

    const merchantId = Number(order.merchantId);
    const orderNo = order.orderNo;

    const messageMap: Record<number, { title: string; content: string }> = {
      0: { title: '🆕 新订单', content: `收到新订单 ${orderNo}，请等待客户支付定金` },
      1: { title: '💰 定金已付', content: `订单 ${orderNo} 客户已支付定金，请尽快确认` },
      3: { title: '🏠 客人已入住', content: `订单 ${orderNo} 已标记入住，等待客户支付尾款` },
      4: { title: '💳 尾款已付', content: `订单 ${orderNo} 客户已支付尾款，费用已结清` },
      5: { title: '✅ 订单完成', content: `订单 ${orderNo} 已完成` },
      6: { title: '❌ 订单取消', content: `订单 ${orderNo} 已被客户取消` },
    };

    const msg = messageMap[newStatus];
    if (!msg) return;

    await this.send({
      merchantId,
      type: 'order',
      title: msg.title,
      content: msg.content,
      link: `/order?id=${Number(order.id)}`,
    });
  }

  /** 获取管理员消息列表 */
  async list(merchantId?: number, adminId?: number, page = 1, pageSize = 20) {
    const where: any = {};
    if (merchantId) {
      where.OR = [{ merchantId }, { merchantId: 0 }];
    }

    const [list, total] = await Promise.all([
      this.prisma.adminMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.adminMessage.count({ where }),
    ]);

    return {
      list: list.map((m) => ({
        id: Number(m.id),
        type: m.type,
        title: m.title,
        content: m.content,
        link: m.link,
        read: !!m.readAt,
        createdAt: m.createdAt,
      })),
      total,
    };
  }

  /** 未读消息数 */
  async unreadCount(merchantId?: number) {
    const where: any = { readAt: null };
    if (merchantId) {
      where.OR = [{ merchantId }, { merchantId: 0 }];
    }
    return this.prisma.adminMessage.count({ where });
  }

  /** 标记已读 */
  async markRead(id: number) {
    await this.prisma.adminMessage.update({
      where: { id: BigInt(id) },
      data: { readAt: new Date() },
    });
  }

  /** 全部已读 */
  async markAllRead(merchantId?: number) {
    const where: any = { readAt: null };
    if (merchantId) {
      where.OR = [{ merchantId }, { merchantId: 0 }];
    }
    await this.prisma.adminMessage.updateMany({ where, data: { readAt: new Date() } });
  }
}
