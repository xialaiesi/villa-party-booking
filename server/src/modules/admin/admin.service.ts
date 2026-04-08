import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ==================== 认证 ====================

  async login(username: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { username } });
    if (!admin || admin.status !== 1) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const hashedPassword = this.hashPassword(password);
    if (admin.password !== hashedPassword) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const token = this.jwtService.sign({
      sub: Number(admin.id),
      username: admin.username,
      type: 'admin',
    });

    return { token, admin: { id: Number(admin.id), username: admin.username, nickname: admin.nickname } };
  }

  // ==================== 别墅管理 ====================

  async getVillas(page = 1, pageSize = 10, status?: number) {
    const where: any = {};
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
        },
      }),
      this.prisma.villa.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  async createVilla(data: any) {
    const { facilities, images, ...villaData } = data;

    const villa = await this.prisma.villa.create({
      data: {
        ...villaData,
        facilities: facilities?.length
          ? { create: facilities.map((fId: number) => ({ facilityId: fId })) }
          : undefined,
        images: images?.length
          ? {
              create: images.map((url: string, i: number) => ({
                url,
                sortOrder: i,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
        facilities: { include: { facility: true } },
      },
    });

    return villa;
  }

  async updateVilla(id: number, data: any) {
    const { facilities, images, ...villaData } = data;

    // 更新设施关联
    if (facilities) {
      await this.prisma.villaFacility.deleteMany({ where: { villaId: id } });
      await this.prisma.villaFacility.createMany({
        data: facilities.map((fId: number) => ({
          villaId: id,
          facilityId: fId,
        })),
      });
    }

    // 更新图片
    if (images) {
      await this.prisma.villaImage.deleteMany({ where: { villaId: id } });
      await this.prisma.villaImage.createMany({
        data: images.map((url: string, i: number) => ({
          villaId: id,
          url,
          sortOrder: i,
        })),
      });
    }

    return this.prisma.villa.update({
      where: { id },
      data: villaData,
      include: {
        images: true,
        facilities: { include: { facility: true } },
      },
    });
  }

  async updateVillaStatus(id: number, status: number) {
    return this.prisma.villa.update({
      where: { id },
      data: { status },
    });
  }

  async setCalendar(
    villaId: number,
    dates: { date: string; price: number; status: number }[],
  ) {
    for (const item of dates) {
      await this.prisma.villaCalendar.upsert({
        where: {
          villaId_date: { villaId, date: new Date(item.date) },
        },
        create: {
          villaId,
          date: new Date(item.date),
          price: item.price,
          status: item.status,
        },
        update: {
          price: item.price,
          status: item.status,
        },
      });
    }
    return { success: true };
  }

  // ==================== 订单管理 ====================

  async getOrders(page = 1, pageSize = 10, status?: number) {
    const where: any = {};
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
          orderPackages: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  async confirmOrder(id: number) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== 1) throw new BadRequestException('订单状态不可确认');

    // 更新日历为已预订
    for (let i = 0; i < order.days; i++) {
      const d = new Date(order.checkIn);
      d.setDate(d.getDate() + i);
      await this.prisma.villaCalendar.upsert({
        where: {
          villaId_date: { villaId: order.villaId, date: d },
        },
        create: {
          villaId: order.villaId,
          date: d,
          price: 0,
          status: 2,
        },
        update: { status: 2 },
      });
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: 2, confirmedAt: new Date() },
    });
  }

  async rejectOrder(id: number, reason?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== 1) throw new BadRequestException('订单状态不可拒绝');

    // TODO: 触发微信退款

    return this.prisma.order.update({
      where: { id },
      data: { status: 7, cancelReason: reason },
    });
  }

  async refundDeposit(id: number, amount: number) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== 4) throw new BadRequestException('订单状态不可退押金');

    const depositStatus = amount >= Number(order.depositAmount) ? 2 : 3;

    // TODO: 触发微信退款（仅退押金部分）

    return this.prisma.order.update({
      where: { id },
      data: { status: 5, depositStatus },
    });
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}
