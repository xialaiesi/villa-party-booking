import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface AdminContext {
  id?: number;
  role?: string;
  merchantId?: number;
}

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  private formatMessage(m: any) {
    return {
      id: Number(m.id),
      senderType: m.senderType,
      senderId: Number(m.senderId),
      type: m.type,
      content: m.content,
      createdAt: m.createdAt,
    };
  }

  /** 根据订单获取或创建会话（C 端） */
  async getOrCreateByOrder(userId: number, orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: BigInt(orderId) },
      include: { villa: { select: { name: true } } },
    });
    if (!order) throw new NotFoundException('订单不存在');
    if (Number(order.userId) !== userId) throw new ForbiddenException('无权访问');

    let chat = await this.prisma.serviceChat.findUnique({
      where: { orderId: BigInt(orderId) },
    });
    if (!chat) {
      chat = await this.prisma.serviceChat.create({
        data: {
          orderId: order.id,
          merchantId: order.merchantId,
          userId: order.userId,
        },
      });
    }
    return {
      id: Number(chat.id),
      orderId: Number(order.id),
      orderNo: order.orderNo,
      villaName: order.villa?.name,
    };
  }

  /** 拉取消息（C 端），并把商家发来的标记已读 */
  async getMessages(userId: number, orderId: number) {
    const chat = await this.prisma.serviceChat.findUnique({
      where: { orderId: BigInt(orderId) },
    });
    if (!chat) return { list: [] };
    if (Number(chat.userId) !== userId) throw new ForbiddenException('无权访问');

    const list = await this.prisma.serviceChatMessage.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: 'asc' },
    });

    if (chat.userUnread > 0) {
      await this.prisma.serviceChat.update({
        where: { id: chat.id },
        data: { userUnread: 0 },
      });
    }

    return { list: list.map((m) => this.formatMessage(m)) };
  }

  /** C 端发送消息 */
  async sendByUser(
    userId: number,
    orderId: number,
    content: string,
    type = 'text',
  ) {
    const chatInfo = await this.getOrCreateByOrder(userId, orderId);
    const chatId = BigInt(chatInfo.id);

    const msg = await this.prisma.serviceChatMessage.create({
      data: {
        chatId,
        senderType: 'user',
        senderId: BigInt(userId),
        type,
        content,
      },
    });
    await this.prisma.serviceChat.update({
      where: { id: chatId },
      data: {
        lastMessage: content.slice(0, 200),
        lastMessageAt: new Date(),
        merchantUnread: { increment: 1 },
      },
    });
    return this.formatMessage(msg);
  }

  /** C 端未读数（商家发来的） */
  async userUnreadCount(userId: number, orderId: number) {
    const chat = await this.prisma.serviceChat.findUnique({
      where: { orderId: BigInt(orderId) },
    });
    if (!chat || Number(chat.userId) !== userId) return { count: 0 };
    return { count: chat.userUnread };
  }

  // ==================== 商家端 ====================

  private scopeMerchant(ctx: AdminContext): number | undefined {
    return ctx.role === 'platform' ? undefined : ctx.merchantId;
  }

  /** 商家会话列表 */
  async listForAdmin(ctx: AdminContext) {
    const merchantId = this.scopeMerchant(ctx);
    const where: any = {};
    if (merchantId) where.merchantId = BigInt(merchantId);

    const chats = await this.prisma.serviceChat.findMany({
      where,
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        order: { select: { orderNo: true, villa: { select: { name: true } } } },
        user: { select: { nickname: true, avatar: true } },
      },
    });

    return {
      list: chats.map((c) => ({
        id: Number(c.id),
        orderId: Number(c.orderId),
        orderNo: c.order?.orderNo,
        villaName: c.order?.villa?.name,
        userNickname: c.user?.nickname,
        userAvatar: c.user?.avatar,
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        unread: c.merchantUnread,
      })),
    };
  }

  /** 商家未读会话总数 */
  async adminUnreadCount(ctx: AdminContext) {
    const merchantId = this.scopeMerchant(ctx);
    const where: any = { merchantUnread: { gt: 0 } };
    if (merchantId) where.merchantId = BigInt(merchantId);
    const count = await this.prisma.serviceChat.count({ where });
    return { count };
  }

  private async findAdminChat(ctx: AdminContext, chatId: number) {
    const chat = await this.prisma.serviceChat.findUnique({
      where: { id: BigInt(chatId) },
    });
    if (!chat) throw new NotFoundException('会话不存在');
    const merchantId = this.scopeMerchant(ctx);
    if (merchantId && Number(chat.merchantId) !== merchantId) {
      throw new ForbiddenException('无权访问');
    }
    return chat;
  }

  /** 商家拉取消息，并把客户发来的标记已读 */
  async getMessagesAdmin(ctx: AdminContext, chatId: number) {
    const chat = await this.findAdminChat(ctx, chatId);
    const list = await this.prisma.serviceChatMessage.findMany({
      where: { chatId: chat.id },
      orderBy: { createdAt: 'asc' },
    });
    if (chat.merchantUnread > 0) {
      await this.prisma.serviceChat.update({
        where: { id: chat.id },
        data: { merchantUnread: 0 },
      });
    }
    return { list: list.map((m) => this.formatMessage(m)) };
  }

  /** 商家发送消息 */
  async sendByMerchant(
    ctx: AdminContext,
    chatId: number,
    content: string,
    type = 'text',
  ) {
    const chat = await this.findAdminChat(ctx, chatId);
    const msg = await this.prisma.serviceChatMessage.create({
      data: {
        chatId: chat.id,
        senderType: 'merchant',
        senderId: BigInt(ctx.id || 0),
        type,
        content,
      },
    });
    await this.prisma.serviceChat.update({
      where: { id: chat.id },
      data: {
        lastMessage: content.slice(0, 200),
        lastMessageAt: new Date(),
        userUnread: { increment: 1 },
      },
    });
    return this.formatMessage(msg);
  }

  /** 常用话术（快捷回复） */
  faq() {
    return {
      list: [
        '您好，我是您的专属管家，有任何问题随时联系我～',
        '别墅地址和导航会在入住前一天通过短信发送给您。',
        '入住时间为当天 14:00 之后，退房时间为次日 12:00 前。',
        '别墅已备好基础餐厨用具，烧烤食材可代采购，需要请告诉我。',
        '泳池/KTV/麻将等设施均可正常使用，使用前请阅读安全须知。',
        '押金将在退房验收无损坏后 1-3 个工作日内原路退还。',
        '停车位充足，可免费停放，大型车辆请提前告知。',
      ],
    };
  }
}
