import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { MerchantService } from '../merchant/merchant.service';
import { AdminMessageService } from '../message/admin-message.service';
import { MembershipService } from '../membership/membership.service';
import type { AdminContext } from '../../common/types/admin-context';
import * as crypto from 'crypto';

export type { AdminContext };

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private merchantService: MerchantService,
    private adminMessage: AdminMessageService,
    private membership: MembershipService,
  ) {}

  // ==================== 认证 ====================

  async login(username: string, password: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { username },
      include: { merchant: { select: { name: true, logo: true } } },
    });
    if (!admin || admin.status !== 1) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (admin.password !== this.hashPassword(password)) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const token = this.jwtService.sign({
      sub: Number(admin.id),
      username: admin.username,
      type: 'admin',
      role: admin.role,
      merchantId: admin.merchantId ? Number(admin.merchantId) : null,
    });

    return {
      token,
      admin: {
        id: Number(admin.id),
        username: admin.username,
        nickname: admin.nickname,
        role: admin.role,
        merchantId: admin.merchantId ? Number(admin.merchantId) : null,
        merchantName: (admin as any).merchant?.name || null,
      },
    };
  }

  /** 根据登录上下文返回 where 条件 */
  private scopeWhere(ctx: AdminContext): any {
    if (ctx.role === 'platform') return {};
    return { merchantId: ctx.merchantId };
  }

  // ==================== 别墅管理 ====================

  async getVillas(ctx: AdminContext, page = 1, pageSize = 10, status?: number) {
    const where: any = this.scopeWhere(ctx);
    if (status !== undefined) where.status = status;

    const [list, total] = await Promise.all([
      this.prisma.villa.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          facilities: { include: { facility: true } },
          merchant: { select: { name: true } },
        },
      }),
      this.prisma.villa.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  async createVilla(ctx: AdminContext, data: any) {
    // 商家角色强制归属自己；平台超管未指定时回退到第一个商家
    let merchantId: number | null =
      ctx.role === 'platform'
        ? data.merchantId || ctx.merchantId
        : ctx.merchantId;

    if (!merchantId && ctx.role === 'platform') {
      const firstMerchant = await this.prisma.merchant.findFirst({
        where: { status: 1 },
        orderBy: { id: 'asc' },
      });
      if (firstMerchant) merchantId = Number(firstMerchant.id);
    }

    if (!merchantId) throw new BadRequestException('请先创建商家');

    // 白名单过滤
    const allowedFields = [
      'name', 'description', 'address', 'latitude', 'longitude',
      'maxGuests', 'bedrooms', 'area', 'basePrice', 'weekendPrice',
      'deposit', 'discount3d', 'discount5d', 'discount7d',
      'coverImage', 'tags', 'status', 'sortOrder',
    ];
    const villaData: any = { merchantId };
    for (const key of allowedFields) {
      if (data[key] !== undefined) villaData[key] = data[key];
    }

    // 处理设施（ID 数组或对象数组）
    const facilityIds: number[] = Array.isArray(data.facilities)
      ? data.facilities
          .map((f: any) => (typeof f === 'number' ? f : f?.id || f?.facilityId))
          .filter((v: any) => v)
      : [];

    return this.prisma.villa.create({
      data: {
        ...villaData,
        facilities: facilityIds.length
          ? { create: facilityIds.map((fId) => ({ facilityId: fId })) }
          : undefined,
        images: data.images?.length
          ? {
              create: data.images.map((img: any, i: number) => {
                if (typeof img === 'string') return { url: img, sortOrder: i };
                return { url: img.url, caption: img.caption || null, sortOrder: i };
              }),
            }
          : undefined,
      },
      include: { images: true, facilities: { include: { facility: true } } },
    });
  }

  async updateVilla(ctx: AdminContext, id: number, data: any) {
    await this.ensureVillaAccess(ctx, id);

    // 白名单过滤可更新字段
    const allowedFields = [
      'name', 'description', 'address', 'latitude', 'longitude',
      'maxGuests', 'bedrooms', 'area', 'basePrice', 'weekendPrice',
      'deposit', 'discount3d', 'discount5d', 'discount7d',
      'coverImage', 'tags', 'status', 'sortOrder',
    ];
    const villaData: any = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) villaData[key] = data[key];
    }

    // 更新设施关联（facilities 可能是 ID 数组或对象数组）
    if (Array.isArray(data.facilities)) {
      await this.prisma.villaFacility.deleteMany({ where: { villaId: id } });
      const facilityIds = data.facilities
        .map((f: any) => (typeof f === 'number' ? f : f?.id || f?.facilityId))
        .filter((v: any) => v);
      if (facilityIds.length) {
        await this.prisma.villaFacility.createMany({
          data: facilityIds.map((fId: number) => ({ villaId: id, facilityId: fId })),
        });
      }
    }

    // 更新图片
    if (Array.isArray(data.images)) {
      await this.prisma.villaImage.deleteMany({ where: { villaId: id } });
      if (data.images.length) {
        await this.prisma.villaImage.createMany({
          data: data.images.map((img: any, i: number) => {
            if (typeof img === 'string') return { villaId: id, url: img, sortOrder: i };
            return { villaId: id, url: img.url, caption: img.caption || null, sortOrder: i };
          }),
        });
      }
    }

    return this.prisma.villa.update({
      where: { id },
      data: villaData,
      include: { images: true, facilities: { include: { facility: true } } },
    });
  }

  async updateVillaStatus(ctx: AdminContext, id: number, status: number) {
    await this.ensureVillaAccess(ctx, id);
    return this.prisma.villa.update({ where: { id }, data: { status } });
  }

  async setCalendar(
    ctx: AdminContext,
    villaId: number,
    dates: { date: string; price: number; status: number }[],
  ) {
    await this.ensureVillaAccess(ctx, villaId);

    for (const item of dates) {
      await this.prisma.villaCalendar.upsert({
        where: { villaId_date: { villaId, date: new Date(item.date) } },
        create: { villaId, date: new Date(item.date), price: item.price, status: item.status },
        update: { price: item.price, status: item.status },
      });
    }
    return { success: true };
  }

  // ==================== 售卖时段档 ====================

  async getVillaSlots(ctx: AdminContext, villaId: number) {
    await this.ensureVillaAccess(ctx, villaId);
    const slots = await this.prisma.villaTimeSlot.findMany({
      where: { villaId },
      orderBy: { sortOrder: 'asc' },
    });
    return slots.map((s) => ({
      id: Number(s.id),
      type: s.type,
      name: s.name,
      startMinute: s.startMinute,
      endMinute: s.endMinute,
      price: Number(s.price),
      weekendPrice: s.weekendPrice != null ? Number(s.weekendPrice) : null,
      status: s.status,
      sortOrder: s.sortOrder,
    }));
  }

  /** 整体替换某别墅的时段档配置 */
  async setVillaSlots(
    ctx: AdminContext,
    villaId: number,
    slots: {
      type?: string;
      name: string;
      startMinute: number;
      endMinute: number;
      price: number;
      weekendPrice?: number | null;
      status?: number;
      sortOrder?: number;
    }[],
  ) {
    await this.ensureVillaAccess(ctx, villaId);

    for (const s of slots) {
      if (
        s.startMinute < 0 ||
        s.endMinute > 1440 ||
        s.startMinute >= s.endMinute
      ) {
        throw new BadRequestException(`时段「${s.name}」时间范围不合法`);
      }
    }

    await this.prisma.villaTimeSlot.deleteMany({ where: { villaId } });
    if (slots.length) {
      await this.prisma.villaTimeSlot.createMany({
        data: slots.map((s, i) => ({
          villaId,
          type: s.type || 'half_day',
          name: s.name,
          startMinute: s.startMinute,
          endMinute: s.endMinute,
          price: s.price,
          weekendPrice: s.weekendPrice ?? null,
          status: s.status ?? 1,
          sortOrder: s.sortOrder ?? i,
        })),
      });
    }
    return { success: true };
  }

  private async ensureVillaAccess(ctx: AdminContext, villaId: number) {
    if (ctx.role === 'platform') return;
    const villa = await this.prisma.villa.findUnique({ where: { id: villaId } });
    if (!villa || Number(villa.merchantId) !== ctx.merchantId) {
      throw new NotFoundException('别墅不存在或无权限');
    }
  }

  // ==================== 订单管理 ====================

  async getOrders(ctx: AdminContext, page = 1, pageSize = 10, status?: number) {
    const where: any = this.scopeWhere(ctx);
    if (status !== undefined) where.status = status;

    const [list, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { nickname: true, phone: true } },
          villa: { select: { name: true } },
          merchant: { select: { name: true } },
          orderPackages: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  /** 商家确认订单（状态 1→2） */
  async confirmOrder(ctx: AdminContext, id: number) {
    const order = await this.ensureOrderAccess(ctx, id);
    if (order.status !== 1) throw new BadRequestException('仅已付定金的订单可确认');

    // 锁定日历（仅整天档；时段档不整天锁，时段占用以订单为准）
    if (order.slotId == null) {
      for (let i = 0; i < order.days; i++) {
        const d = new Date(order.checkIn);
        d.setDate(d.getDate() + i);
        await this.prisma.villaCalendar.upsert({
          where: { villaId_date: { villaId: order.villaId, date: d } },
          create: { villaId: order.villaId, date: d, price: 0, status: 2 },
          update: { status: 2 },
        });
      }
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: 2, confirmedAt: new Date() },
    });

    await this.merchantService.createSettlement(id);
    return updated;
  }

  /** 商家拒绝订单（状态 1→7） */
  async rejectOrder(ctx: AdminContext, id: number, reason?: string) {
    const order = await this.ensureOrderAccess(ctx, id);
    if (order.status !== 1) throw new BadRequestException('仅已付定金的订单可拒绝');
    return this.prisma.order.update({
      where: { id },
      data: { status: 7, cancelReason: reason },
    });
  }

  /** 商家确认定金到账（mock 支付，状态 0→1） */
  async confirmDepositPaid(ctx: AdminContext, id: number) {
    const order = await this.ensureOrderAccess(ctx, id);
    if (order.status !== 0) throw new BadRequestException('仅待付定金的订单可确认');
    return this.prisma.order.update({
      where: { id },
      data: { status: 1 },
    });
  }

  /** 商家确认尾款到账（状态 2→3），同时生成到店核销码 */
  async confirmFinalPayment(ctx: AdminContext, id: number) {
    const order = await this.ensureOrderAccess(ctx, id);
    if (order.status !== 2) throw new BadRequestException('仅待付尾款的订单可确认');
    return this.prisma.order.update({
      where: { id },
      data: { status: 3, checkInCode: this.generateCheckInCode() },
    });
  }

  /** 商家凭核销码标记已入住（状态 3→4，电子入住核销） */
  async markCheckedIn(ctx: AdminContext, id: number, code: string) {
    const order = await this.ensureOrderAccess(ctx, id);
    if (order.status !== 3) throw new BadRequestException('仅已付全款的订单可标记入住');
    if (!code || !order.checkInCode || code.trim() !== order.checkInCode) {
      throw new BadRequestException('核销码不正确');
    }
    return this.prisma.order.update({
      where: { id },
      data: { status: 4 },
    });
  }

  private generateCheckInCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /** 手动标记完成（状态 4→5） */
  async markCompleted(ctx: AdminContext, id: number) {
    const order = await this.ensureOrderAccess(ctx, id);
    if (order.status !== 4) throw new BadRequestException('仅已入住的订单可完成');
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: 5 },
    });
    // 订单完成发放成长值（1 元 = 1 成长值）
    await this.membership.addGrowth(
      Number(order.userId),
      Math.round(Number(order.totalAmount)),
      'order',
      `订单 ${order.orderNo} 完成`,
      Number(order.id),
    );
    return updated;
  }

  private async ensureOrderAccess(ctx: AdminContext, id: number) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('订单不存在');
    if (ctx.role === 'merchant' && Number(order.merchantId) !== ctx.merchantId) {
      throw new NotFoundException('订单不存在');
    }
    return order;
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}
