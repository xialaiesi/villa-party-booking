import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SeasonalEventService {
  constructor(private prisma: PrismaService) {}

  /** C端：当前进行中的限定活动 */
  async listActive() {
    const now = new Date();
    const events = await this.prisma.seasonalEvent.findMany({
      where: { status: 1, startDate: { lte: now }, endDate: { gte: now } },
      orderBy: { startDate: 'asc' },
      include: { villa: { select: { name: true, coverImage: true, basePrice: true } } },
    });
    return events.map((e) => this.format(e));
  }

  /** C端：活动详情 */
  async findById(id: number) {
    const event = await this.prisma.seasonalEvent.findUnique({
      where: { id },
      include: { villa: { select: { name: true, coverImage: true, basePrice: true, address: true } } },
    });
    if (!event) throw new NotFoundException('活动不存在');
    return this.format(event);
  }

  /** 参与活动（增加 soldCount） */
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

  // Admin
  async adminList(page = 1, pageSize = 10) {
    const [list, total] = await Promise.all([
      this.prisma.seasonalEvent.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { villa: { select: { name: true } } },
      }),
      this.prisma.seasonalEvent.count(),
    ]);
    return { list: list.map((e) => this.format(e)), total, page, pageSize };
  }

  async create(data: any) {
    return this.prisma.seasonalEvent.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });
  }

  async update(id: number, data: any) {
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    return this.prisma.seasonalEvent.update({ where: { id }, data });
  }

  async delete(id: number) {
    await this.prisma.seasonalEvent.delete({ where: { id } });
    return { success: true };
  }

  private format(e: any) {
    return {
      ...e,
      id: Number(e.id),
      villaId: e.villaId ? Number(e.villaId) : null,
      discount: e.discount ? Number(e.discount) : null,
      remaining: e.quota ? e.quota - e.soldCount : null,
      villa: e.villa ? { ...e.villa, basePrice: e.villa.basePrice ? Number(e.villa.basePrice) : undefined } : undefined,
    };
  }
}
