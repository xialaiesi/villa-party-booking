import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

/** 会员等级配置：阈值（成长值下限）+ 权益 */
export const MEMBER_LEVELS = [
  {
    level: 1,
    name: '普通会员',
    threshold: 0,
    icon: '🥉',
    benefits: ['在线预订别墅', '专属客服咨询'],
  },
  {
    level: 2,
    name: '银卡会员',
    threshold: 1000,
    icon: '🥈',
    benefits: ['客服优先响应', '生日月专属问候', '老客复购提醒'],
  },
  {
    level: 3,
    name: '金卡会员',
    threshold: 5000,
    icon: '🥇',
    benefits: ['生日当月免押金', '老客优先房态', '延迟退房 1 小时'],
  },
  {
    level: 4,
    name: '黑卡会员',
    threshold: 20000,
    icon: '💎',
    benefits: ['专属管家服务', '免费房型升级', '生日免押金', '老客优先房态'],
  },
];

@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name);

  constructor(private prisma: PrismaService) {}

  /** 根据成长值算等级 */
  private levelOf(growth: number): number {
    let level = 1;
    for (const l of MEMBER_LEVELS) {
      if (growth >= l.threshold) level = l.level;
    }
    return level;
  }

  /** 加成长值并写流水，重算等级 */
  async addGrowth(
    userId: number,
    points: number,
    source: string,
    description: string,
    refId?: number,
  ) {
    if (!points) return;
    const user = await this.prisma.user.findUnique({ where: { id: BigInt(userId) } });
    if (!user) return;

    const newGrowth = Math.max(0, user.growth + points);
    const newLevel = this.levelOf(newGrowth);

    await this.prisma.$transaction([
      this.prisma.growthLog.create({
        data: {
          userId: BigInt(userId),
          points,
          source,
          refId: refId != null ? BigInt(refId) : null,
          description,
        },
      }),
      this.prisma.user.update({
        where: { id: BigInt(userId) },
        data: { growth: newGrowth, level: newLevel },
      }),
    ]);

    // 升级时给用户发条消息
    if (newLevel > user.level) {
      const info = MEMBER_LEVELS.find((l) => l.level === newLevel);
      await this.prisma.userMessage.create({
        data: {
          userId: BigInt(userId),
          type: 'activity',
          title: `🎉 升级为${info?.name}`,
          content: `恭喜您升级为${info?.name}，已解锁更多专属权益，快来看看吧～`,
          link: '/pages/member/index',
        },
      });
    }
  }

  /** 我的会员中心 */
  async getMine(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: BigInt(userId) } });
    if (!user) return null;

    const level = this.levelOf(user.growth);
    const current = MEMBER_LEVELS.find((l) => l.level === level)!;
    const next = MEMBER_LEVELS.find((l) => l.level === level + 1);

    const orderCount = await this.prisma.order.count({
      where: { userId: BigInt(userId), status: 5 },
    });

    return {
      growth: user.growth,
      level,
      levelName: current.name,
      icon: current.icon,
      benefits: current.benefits,
      orderCount,
      birthday: user.birthday,
      nextLevel: next
        ? {
            name: next.name,
            threshold: next.threshold,
            gap: Math.max(0, next.threshold - user.growth),
            progress: Math.min(
              100,
              Math.round(
                ((user.growth - current.threshold) /
                  (next.threshold - current.threshold)) *
                  100,
              ),
            ),
          }
        : null,
      levels: MEMBER_LEVELS,
    };
  }

  /** 成长值流水 */
  async getGrowthLogs(userId: number, page = 1, pageSize = 20) {
    const where = { userId: BigInt(userId) };
    const [list, total] = await Promise.all([
      this.prisma.growthLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.growthLog.count({ where }),
    ]);
    return {
      list: list.map((l) => ({
        id: Number(l.id),
        points: l.points,
        source: l.source,
        description: l.description,
        createdAt: l.createdAt,
      })),
      total,
    };
  }

  /** 设置生日 */
  async setBirthday(userId: number, birthday: string) {
    await this.prisma.user.update({
      where: { id: BigInt(userId) },
      data: { birthday: new Date(birthday) },
    });
    return { success: true };
  }

  /**
   * 复购智能提醒：每天 09:00 扫描"上次相聚"临近周年（350-365 天）的老客，
   * 60 天内未提醒过则发站内信唤回。
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async repurchaseReminderCron() {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const from = new Date(now - 365 * day);
    const to = new Date(now - 350 * day);

    const orders = await this.prisma.order.findMany({
      where: { status: 5, createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: 'desc' },
      include: { villa: { select: { name: true } } },
    });

    const seen = new Set<string>();
    let sent = 0;
    for (const order of orders) {
      const uid = order.userId.toString();
      if (seen.has(uid)) continue;
      seen.add(uid);

      const user = await this.prisma.user.findUnique({ where: { id: order.userId } });
      if (!user) continue;
      // 60 天内提醒过则跳过
      if (user.lastRemindAt && now - user.lastRemindAt.getTime() < 60 * day) continue;

      await this.prisma.userMessage.create({
        data: {
          userId: order.userId,
          type: 'activity',
          title: '🎈 又到相聚的好时节',
          content: `距您上次在「${order.villa?.name || '别墅'}」的欢聚已快一年啦，新一年的聚会安排上了吗？老客专属房态为您预留～`,
          link: '/pages/index/index',
        },
      });
      await this.prisma.user.update({
        where: { id: order.userId },
        data: { lastRemindAt: new Date() },
      });
      sent++;
    }
    if (sent > 0) this.logger.log(`复购提醒已发送 ${sent} 条`);
  }
}
