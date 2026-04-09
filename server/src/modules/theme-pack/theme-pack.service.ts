import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ThemePackService {
  constructor(private prisma: PrismaService) {}

  /** C端：按主题浏览 */
  async findAll(theme?: string) {
    const where: any = { status: 1 };
    if (theme) where.theme = theme;

    const packs = await this.prisma.themePack.findMany({
      where,
      orderBy: { sortOrder: 'desc' },
    });
    return packs.map((p) => this.format(p));
  }

  async findById(id: number) {
    const pack = await this.prisma.themePack.findUnique({ where: { id } });
    if (!pack) throw new NotFoundException('氛围包不存在');
    return this.format(pack);
  }

  /** 管理后台 */
  async adminList(page = 1, pageSize = 10) {
    const [list, total] = await Promise.all([
      this.prisma.themePack.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.themePack.count(),
    ]);
    return { list: list.map((p) => this.format(p)), total, page, pageSize };
  }

  async create(data: any) {
    if (data.items && typeof data.items !== 'string') {
      data.items = JSON.stringify(data.items);
    }
    return this.prisma.themePack.create({ data });
  }

  async update(id: number, data: any) {
    if (data.items && typeof data.items !== 'string') {
      data.items = JSON.stringify(data.items);
    }
    return this.prisma.themePack.update({ where: { id }, data });
  }

  async delete(id: number) {
    await this.prisma.themePack.delete({ where: { id } });
    return { success: true };
  }

  private format(pack: any) {
    return {
      ...pack,
      id: Number(pack.id),
      price: Number(pack.price),
      originalPrice: pack.originalPrice ? Number(pack.originalPrice) : null,
      items: pack.items ? JSON.parse(pack.items) : [],
    };
  }
}
