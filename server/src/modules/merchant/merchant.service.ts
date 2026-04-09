import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminContext } from '../../common/types/admin-context';
import * as crypto from 'crypto';

@Injectable()
export class MerchantService {
  constructor(private prisma: PrismaService) {}

  /** C端：商家公开信息（店铺页） */
  async publicInfo(id: number) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id, status: 1 },
      select: { id: true, name: true, logo: true, description: true, address: true },
    });
    if (!merchant) throw new NotFoundException('商家不存在');
    return { ...merchant, id: Number(merchant.id) };
  }

  // ============ 平台超管：商家管理 ============

  async list(page = 1, pageSize = 10) {
    const [list, total] = await Promise.all([
      this.prisma.merchant.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { villas: true, orders: true } },
        },
      }),
      this.prisma.merchant.count(),
    ]);

    return {
      list: list.map((m) => this.format(m)),
      total, page, pageSize,
    };
  }

  async findById(id: number) {
    const m = await this.prisma.merchant.findUnique({
      where: { id },
      include: { _count: { select: { villas: true, orders: true } } },
    });
    if (!m) throw new NotFoundException('商家不存在');
    return this.format(m);
  }

  async create(data: {
    name: string;
    contactName: string;
    contactPhone: string;
    email?: string;
    address?: string;
    description?: string;
    bankName?: string;
    bankAccount?: string;
    accountHolder?: string;
    adminUsername: string;
    adminPassword: string;
  }) {
    // 检查用户名
    const existing = await this.prisma.admin.findUnique({ where: { username: data.adminUsername } });
    if (existing) throw new BadRequestException('管理员账号已存在');

    const { adminUsername, adminPassword, ...merchantData } = data;

    // 创建商家和对应的管理员账号
    const merchant = await this.prisma.merchant.create({ data: merchantData });

    await this.prisma.admin.create({
      data: {
        username: adminUsername,
        password: crypto.createHash('sha256').update(adminPassword).digest('hex'),
        nickname: merchantData.name,
        role: 'merchant',
        merchantId: merchant.id,
      },
    });

    return this.format(merchant);
  }

  async update(id: number, data: any) {
    const { adminUsername, adminPassword, ...rest } = data;
    return this.prisma.merchant.update({ where: { id }, data: rest });
  }

  async updateStatus(id: number, status: number) {
    return this.prisma.merchant.update({ where: { id }, data: { status } });
  }

  async delete(id: number) {
    // 先删关联的 admin
    await this.prisma.admin.deleteMany({ where: { merchantId: id } });
    await this.prisma.merchant.delete({ where: { id } });
    return { success: true };
  }

  // ============ 商家财务中心 ============

  /** 商家自己查看财务概览 */
  async finance(ctx: AdminContext) {
    const merchantId = ctx.role === 'platform' ? null : ctx.merchantId;
    if (!merchantId) throw new ForbiddenException('平台管理员请指定商家');

    const merchant = await this.prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) throw new NotFoundException('商家不存在');

    const [settled, pending, totalSettled] = await Promise.all([
      this.prisma.settlement.aggregate({
        _sum: { netAmount: true },
        where: { merchantId, status: 1 },
      }),
      this.prisma.settlement.aggregate({
        _sum: { netAmount: true },
        where: { merchantId, status: 0 },
      }),
      this.prisma.settlement.count({ where: { merchantId } }),
    ]);

    return {
      totalRevenue: Number(merchant.totalRevenue),
      settledAmount: Number(settled._sum.netAmount || 0),
      pendingAmount: Number(pending._sum.netAmount || 0),
      commissionRate: Number(merchant.commissionRate),
      settlementCount: totalSettled,
      bankName: merchant.bankName,
      bankAccount: merchant.bankAccount,
      accountHolder: merchant.accountHolder,
    };
  }

  /** 商家结算记录 */
  async settlements(ctx: AdminContext, page = 1, pageSize = 20) {
    const where: any = ctx.role === 'platform' ? {} : { merchantId: ctx.merchantId };

    const [list, total] = await Promise.all([
      this.prisma.settlement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          merchant: { select: { name: true } },
        },
      }),
      this.prisma.settlement.count({ where }),
    ]);

    return {
      list: list.map((s) => ({
        ...s,
        id: Number(s.id),
        merchantId: Number(s.merchantId),
        orderId: Number(s.orderId),
        amount: Number(s.amount),
        commission: Number(s.commission),
        netAmount: Number(s.netAmount),
      })),
      total, page, pageSize,
    };
  }

  /** 分账：订单支付成功时调用 */
  async createSettlement(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { merchant: true },
    });
    if (!order) return;

    // 检查是否已创建
    const existing = await this.prisma.settlement.findUnique({ where: { orderId } });
    if (existing) return existing;

    const commissionRate = Number(order.merchant.commissionRate);
    const amount = Number(order.totalAmount);
    const commission = amount * commissionRate;
    const netAmount = amount - commission;

    const settlement = await this.prisma.settlement.create({
      data: {
        merchantId: order.merchantId,
        orderId: order.id,
        orderNo: order.orderNo,
        amount,
        commission,
        netAmount,
        status: 0,
      },
    });

    // 更新商家累计数据
    await this.prisma.merchant.update({
      where: { id: order.merchantId },
      data: {
        totalRevenue: { increment: amount },
        pendingAmount: { increment: netAmount },
      },
    });

    return settlement;
  }

  /** 平台管理员标记结算完成 */
  async markSettled(settlementId: number) {
    const s = await this.prisma.settlement.findUnique({ where: { id: settlementId } });
    if (!s) throw new NotFoundException('结算记录不存在');
    if (s.status === 1) return s;

    await this.prisma.settlement.update({
      where: { id: settlementId },
      data: { status: 1, settledAt: new Date() },
    });

    await this.prisma.merchant.update({
      where: { id: s.merchantId },
      data: {
        settledAmount: { increment: s.netAmount },
        pendingAmount: { decrement: s.netAmount },
      },
    });

    return { success: true };
  }

  private format(m: any) {
    return {
      ...m,
      id: Number(m.id),
      commissionRate: Number(m.commissionRate),
      totalRevenue: Number(m.totalRevenue),
      settledAmount: Number(m.settledAmount),
      pendingAmount: Number(m.pendingAmount),
      villaCount: m._count?.villas || 0,
      orderCount: m._count?.orders || 0,
    };
  }
}
