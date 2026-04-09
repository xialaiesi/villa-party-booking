import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PackageService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const list = await this.prisma.package.findMany({
      where: { status: 1 },
      orderBy: { id: 'asc' },
    });
    return list.map((p) => this.format(p));
  }

  async adminList(page = 1, pageSize = 10) {
    const [list, total] = await Promise.all([
      this.prisma.package.findMany({
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.package.count(),
    ]);
    return { list: list.map((p) => this.format(p)), total, page, pageSize };
  }

  async create(data: any) {
    return this.format(await this.prisma.package.create({ data }));
  }

  async update(id: number, data: any) {
    return this.format(await this.prisma.package.update({ where: { id }, data }));
  }

  async delete(id: number) {
    await this.prisma.package.delete({ where: { id } });
    return { success: true };
  }

  private format(p: any) {
    return {
      ...p,
      id: Number(p.id),
      price: Number(p.price),
      weekendPrice: p.weekendPrice ? Number(p.weekendPrice) : null,
      holidayPrice: p.holidayPrice ? Number(p.holidayPrice) : null,
    };
  }
}
