import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminCtx } from '../../common/decorators/admin-context.decorator';
import type { AdminContext } from './admin.service';

@Controller('api/admin/dashboard')
export class DashboardController {
  constructor(private prisma: PrismaService) {}

  /** 根据角色返回 where 过滤条件 */
  private scope(ctx: AdminContext): any {
    if (ctx.role === 'platform') return {};
    return { merchantId: ctx.merchantId };
  }

  @Get('stats')
  async stats(@AdminCtx() ctx: AdminContext) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const orderWhere = this.scope(ctx);
    const villaWhere = this.scope(ctx);

    const [
      todayOrders, todayRevenue, pendingOrders, totalVillas, activeVillas,
      totalUsers, monthOrders, monthRevenue, totalOrders, completedOrders,
    ] = await Promise.all([
      this.prisma.order.count({ where: { ...orderWhere, createdAt: { gte: today, lt: tomorrow } } }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { ...orderWhere, paidAt: { gte: today, lt: tomorrow }, status: { gte: 1 } },
      }),
      this.prisma.order.count({ where: { ...orderWhere, status: 1 } }),
      this.prisma.villa.count({ where: villaWhere }),
      this.prisma.villa.count({ where: { ...villaWhere, status: 1 } }),
      ctx.role === 'platform' ? this.prisma.user.count() : 0,
      this.prisma.order.count({ where: { ...orderWhere, createdAt: { gte: monthStart } } }),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { ...orderWhere, paidAt: { gte: monthStart }, status: { gte: 1 } },
      }),
      this.prisma.order.count({ where: orderWhere }),
      this.prisma.order.count({ where: { ...orderWhere, status: 5 } }),
    ]);

    return {
      today: { orders: todayOrders, revenue: Number(todayRevenue._sum.totalAmount || 0) },
      month: { orders: monthOrders, revenue: Number(monthRevenue._sum.totalAmount || 0) },
      pendingOrders,
      villas: { total: totalVillas, active: activeVillas },
      users: totalUsers,
      totalOrders,
      completedOrders,
      completionRate: totalOrders ? Math.round((completedOrders / totalOrders) * 100) : 0,
    };
  }

  @Get('trend')
  async trend(@AdminCtx() ctx: AdminContext) {
    const days = 30;
    const result: { date: string; orders: number; revenue: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scope = this.scope(ctx);

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      const [orders, revenue] = await Promise.all([
        this.prisma.order.count({ where: { ...scope, createdAt: { gte: d, lt: next } } }),
        this.prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { ...scope, paidAt: { gte: d, lt: next }, status: { gte: 1 } },
        }),
      ]);

      result.push({
        date: d.toISOString().split('T')[0],
        orders,
        revenue: Number(revenue._sum.totalAmount || 0),
      });
    }
    return result;
  }

  @Get('order-status')
  async orderStatus(@AdminCtx() ctx: AdminContext) {
    const statuses = await this.prisma.order.groupBy({
      by: ['status'],
      _count: true,
      where: this.scope(ctx),
    });

    const labels: Record<number, string> = {
      0: '待支付', 1: '待确认', 2: '待入住', 3: '已入住',
      4: '待退押金', 5: '已完成', 6: '已取消', 7: '已拒绝', 8: '已关闭',
    };

    return statuses.map((s) => ({ status: s.status, label: labels[s.status] || '未知', count: s._count }));
  }

  @Get('hot-villas')
  async hotVillas(@AdminCtx() ctx: AdminContext) {
    const villas = await this.prisma.order.groupBy({
      by: ['villaId'],
      _count: true,
      where: this.scope(ctx),
      orderBy: { _count: { villaId: 'desc' } },
      take: 5,
    });

    const result: any[] = [];
    for (const v of villas) {
      const villa = await this.prisma.villa.findUnique({
        where: { id: v.villaId },
        select: { id: true, name: true, coverImage: true, basePrice: true },
      });
      if (villa) {
        result.push({
          id: Number(villa.id),
          name: villa.name,
          coverImage: villa.coverImage,
          basePrice: Number(villa.basePrice),
          orderCount: v._count,
        });
      }
    }
    return result;
  }

  @Get('recent-orders')
  async recentOrders(@AdminCtx() ctx: AdminContext) {
    const orders = await this.prisma.order.findMany({
      where: this.scope(ctx),
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { nickname: true } },
        villa: { select: { name: true } },
      },
    });
    return orders.map((o) => ({
      id: Number(o.id),
      orderNo: o.orderNo,
      userName: o.user?.nickname,
      villaName: o.villa?.name,
      totalAmount: Number(o.totalAmount),
      status: o.status,
      createdAt: o.createdAt,
    }));
  }
}
