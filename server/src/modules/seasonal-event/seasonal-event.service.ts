import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminContext } from '../../common/types/admin-context';

@Injectable()
export class SeasonalEventService {
  constructor(private prisma: PrismaService) {}

  async listActive() {
    const now = new Date();
    const events = await this.prisma.seasonalEvent.findMany({
      where: { status: 1, startDate: { lte: now }, endDate: { gte: now } },
      orderBy: { startDate: 'asc' },
      include: {
        villa: { select: { name: true, coverImage: true, basePrice: true } },
        merchant: { select: { name: true } },
      },
    });
    return events.map((e) => this.format(e));
  }

  async findById(id: number) {
    const event = await this.prisma.seasonalEvent.findUnique({
      where: { id },
      include: {
        villa: { select: { name: true, coverImage: true, basePrice: true, address: true } },
        merchant: { select: { name: true } },
      },
    });
    if (!event) throw new NotFoundException('活动不存在');
    return this.format(event);
  }

  async participate(eventId: number) {
    const event = await this.prisma.seasonalEvent.findUnique({ where: { id: eventId } });
    if (!event || event.status !== 1) throw new BadRequestException('活动不可用');
    if (event.quota && event.soldCount >= event.quota) throw new BadRequestException('名额已满');

    await this.prisma.seasonalEvent.update({
      where: { id: eventId },
      data: { soldCount: { increment: 1 } },
    });
    return { success: true, remaining: event.quota ? event.quota - event.soldCount - 1 : null };
  }

  async adminList(ctx: AdminContext, page = 1, pageSize = 10) {
    const where: any = ctx.role === 'platform' ? {} : { merchantId: ctx.merchantId };
    const [list, total] = await Promise.all([
      this.prisma.seasonalEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { villa: { select: { name: true } }, merchant: { select: { name: true } } },
      }),
      this.prisma.seasonalEvent.count({ where }),
    ]);
    return { list: list.map((e) => this.format(e)), total, page, pageSize };
  }

  async create(ctx: AdminContext, data: any) {
    const merchantId = ctx.role === 'platform' ? data.merchantId || ctx.merchantId : ctx.merchantId;
    if (!merchantId) throw new ForbiddenException('缺少 merchantId');

    return this.prisma.seasonalEvent.create({
      data: {
        ...data,
        merchantId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });
  }

  async update(ctx: AdminContext, id: number, data: any) {
    await this.ensureAccess(ctx, id);
    const { merchantId, ...rest } = data;
    if (rest.startDate) rest.startDate = new Date(rest.startDate);
    if (rest.endDate) rest.endDate = new Date(rest.endDate);
    return this.prisma.seasonalEvent.update({ where: { id }, data: rest });
  }

  async delete(ctx: AdminContext, id: number) {
    await this.ensureAccess(ctx, id);
    await this.prisma.seasonalEvent.delete({ where: { id } });
    return { success: true };
  }

  private async ensureAccess(ctx: AdminContext, id: number) {
    if (ctx.role === 'platform') return;
    const e = await this.prisma.seasonalEvent.findUnique({ where: { id } });
    if (!e || Number(e.merchantId) !== ctx.merchantId) {
      throw new NotFoundException('活动不存在或无权限');
    }
  }

  private format(e: any) {
    return {
      ...e,
      id: Number(e.id),
      merchantId: e.merchantId ? Number(e.merchantId) : null,
      villaId: e.villaId ? Number(e.villaId) : null,
      discount: e.discount ? Number(e.discount) : null,
      remaining: e.quota ? e.quota - e.soldCount : null,
      villa: e.villa ? { ...e.villa, basePrice: e.villa.basePrice ? Number(e.villa.basePrice) : undefined } : undefined,
    };
  }
}
