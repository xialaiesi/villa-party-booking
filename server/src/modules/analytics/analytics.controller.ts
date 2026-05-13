import { Controller, Post, Get, Body, Req, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('api/analytics')
export class AnalyticsController {
  constructor(private prisma: PrismaService) {}

  /** 记录页面访问（前端埋点上报） */
  @Public()
  @Post('pageview')
  async trackPageView(
    @Body()
    body: {
      url: string;
      referrer?: string;
      utmSource?: string;
      utmCampaign?: string;
      utmMedium?: string;
      sessionId: string;
    },
    @Req() req: any,
  ) {
    const userId = req.user?.sub || null;
    await this.prisma.pageView.create({
      data: {
        url: body.url,
        referrer: body.referrer || null,
        utmSource: body.utmSource || null,
        utmCampaign: body.utmCampaign || null,
        utmMedium: body.utmMedium || null,
        userId: userId ? BigInt(userId) : null,
        sessionId: body.sessionId,
        userAgent: req.headers['user-agent'] || null,
        ip: req.ip || null,
      },
    });
    return { ok: true };
  }

  /** 记录用户行为事件（前端埋点上报） */
  @Public()
  @Post('event')
  async trackEvent(
    @Body()
    body: {
      eventType: string;
      targetId?: number;
      targetType?: string;
      utmSource?: string;
      utmCampaign?: string;
      sessionId: string;
      metadata?: any;
    },
    @Req() req: any,
  ) {
    const userId = req.user?.sub || null;
    await this.prisma.eventLog.create({
      data: {
        eventType: body.eventType,
        targetId: body.targetId ? BigInt(body.targetId) : null,
        targetType: body.targetType || null,
        utmSource: body.utmSource || null,
        utmCampaign: body.utmCampaign || null,
        userId: userId ? BigInt(userId) : null,
        sessionId: body.sessionId,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      },
    });
    return { ok: true };
  }

  /** 管理后台：获取渠道统计概览 */
  @Get('admin/overview')
  async getOverview(@Query('days') days?: string) {
    const d = parseInt(days || '30', 10);
    const since = new Date();
    since.setDate(since.getDate() - d);

    const [pvBySource, eventsByType, topVillas, dailyPv] = await Promise.all([
      // 按来源分组PV
      this.prisma.pageView.groupBy({
        by: ['utmSource'],
        where: { createdAt: { gte: since } },
        _count: true,
        orderBy: { _count: { utmSource: 'desc' } },
      }),
      // 按事件类型分组
      this.prisma.eventLog.groupBy({
        by: ['eventType'],
        where: { createdAt: { gte: since } },
        _count: true,
      }),
      // 热门别墅（按浏览量）
      this.prisma.eventLog.groupBy({
        by: ['targetId'],
        where: {
          eventType: 'villa_view',
          createdAt: { gte: since },
          targetId: { not: null },
        },
        _count: true,
        orderBy: { _count: { targetId: 'desc' } },
        take: 10,
      }),
      // 每日PV趋势
      this.prisma.$queryRawUnsafe<any[]>(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM page_view
         WHERE created_at >= ?
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        since,
      ),
    ]);

    // 转化漏斗
    const funnel: Record<string, number> = {};
    for (const e of eventsByType) {
      funnel[e.eventType] = e._count;
    }

    // 获取热门别墅名称
    const villaIds = topVillas
      .filter((t) => t.targetId)
      .map((t) => t.targetId!);
    const villaNames =
      villaIds.length > 0
        ? await this.prisma.villa.findMany({
            where: { id: { in: villaIds } },
            select: { id: true, name: true },
          })
        : [];
    const nameMap = new Map(villaNames.map((v) => [Number(v.id), v.name]));

    return {
      channelDistribution: pvBySource.map((p) => ({
        source: p.utmSource || '直接访问',
        count: p._count,
      })),
      funnel: {
        pageView: funnel['page_view'] || 0,
        villaView: funnel['villa_view'] || 0,
        bookingOpen: funnel['booking_open'] || 0,
        wechatClick: funnel['wechat_click'] || 0,
        orderCreate: funnel['order_create'] || 0,
      },
      topVillas: topVillas.map((t) => ({
        villaId: Number(t.targetId),
        villaName: nameMap.get(Number(t.targetId)) || `别墅#${t.targetId}`,
        views: t._count,
      })),
      dailyPv: dailyPv.map((d: any) => ({
        date: d.date,
        count: Number(d.count),
      })),
    };
  }
}
