import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminContext } from '../../common/types/admin-context';

@Injectable()
export class LocalServiceService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string) {
    const where: any = { status: 1 };
    if (category) where.category = category;
    const list = await this.prisma.localService.findMany({ where, orderBy: { sortOrder: 'desc' } });
    return list.map((s) => this.format(s));
  }

  async findById(id: number) {
    const s = await this.prisma.localService.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('服务不存在');
    return this.format(s);
  }

  async book(userId: number, data: { orderId: number; serviceId: number; serviceDate: string; remark?: string }) {
    const service = await this.prisma.localService.findUnique({ where: { id: data.serviceId, status: 1 } });
    if (!service) throw new NotFoundException('服务不存在');

    const so = await this.prisma.serviceOrder.create({
      data: {
        orderId: data.orderId,
        serviceId: data.serviceId,
        userId,
        serviceName: service.name,
        price: service.price,
        serviceDate: new Date(data.serviceDate),
        remark: data.remark,
      },
    });
    return { ...so, id: Number(so.id), price: Number(so.price) };
  }

  async getMyServiceOrders(userId: number) {
    const list = await this.prisma.serviceOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { service: { select: { name: true, category: true, coverImage: true } } },
    });
    return list.map((s) => ({ ...s, id: Number(s.id), price: Number(s.price) }));
  }

  async adminList(ctx: AdminContext, page = 1, pageSize = 10) {
    const where: any = ctx.role === 'platform' ? {} : { merchantId: ctx.merchantId };
    const [list, total] = await Promise.all([
      this.prisma.localService.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.localService.count({ where }),
    ]);
    return { list: list.map((s) => this.format(s)), total, page, pageSize };
  }

  async create(ctx: AdminContext, data: any) {
    const merchantId = ctx.role === 'platform' ? data.merchantId || ctx.merchantId : ctx.merchantId;
    if (!merchantId) throw new ForbiddenException('缺少 merchantId');
    return this.format(await this.prisma.localService.create({ data: { ...data, merchantId } }));
  }

  async update(ctx: AdminContext, id: number, data: any) {
    await this.ensureAccess(ctx, id);
    const { merchantId, ...rest } = data;
    return this.format(await this.prisma.localService.update({ where: { id }, data: rest }));
  }

  async delete(ctx: AdminContext, id: number) {
    await this.ensureAccess(ctx, id);
    await this.prisma.localService.delete({ where: { id } });
    return { success: true };
  }

  private async ensureAccess(ctx: AdminContext, id: number) {
    if (ctx.role === 'platform') return;
    const s = await this.prisma.localService.findUnique({ where: { id } });
    if (!s || Number(s.merchantId) !== ctx.merchantId) {
      throw new NotFoundException('服务不存在或无权限');
    }
  }

  private format(s: any) {
    return { ...s, id: Number(s.id), merchantId: s.merchantId ? Number(s.merchantId) : null, price: Number(s.price) };
  }
}
