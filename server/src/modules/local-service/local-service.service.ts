import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LocalServiceService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string) {
    const where: any = { status: 1 };
    if (category) where.category = category;
    const list = await this.prisma.localService.findMany({ where, orderBy: { sortOrder: 'desc' } });
    return list.map((s) => ({ ...s, id: Number(s.id), price: Number(s.price) }));
  }

  async findById(id: number) {
    const s = await this.prisma.localService.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('服务不存在');
    return { ...s, id: Number(s.id), price: Number(s.price) };
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

  // Admin
  async adminList(page = 1, pageSize = 10) {
    const [list, total] = await Promise.all([
      this.prisma.localService.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.localService.count(),
    ]);
    return { list: list.map((s) => ({ ...s, id: Number(s.id), price: Number(s.price) })), total, page, pageSize };
  }

  async create(data: any) { return this.prisma.localService.create({ data }); }
  async update(id: number, data: any) { return this.prisma.localService.update({ where: { id }, data }); }
  async delete(id: number) { await this.prisma.localService.delete({ where: { id } }); return { success: true }; }
}
