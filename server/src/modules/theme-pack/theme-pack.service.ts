import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminContext } from '../../common/types/admin-context';

@Injectable()
export class ThemePackService {
  constructor(private prisma: PrismaService) {}

  async findAll(theme?: string) {
    const where: any = { status: 1 };
    if (theme) where.theme = theme;
    const packs = await this.prisma.themePack.findMany({ where, orderBy: { sortOrder: 'desc' } });
    return packs.map((p) => this.format(p));
  }

  async findById(id: number) {
    const pack = await this.prisma.themePack.findUnique({ where: { id } });
    if (!pack) throw new NotFoundException('氛围包不存在');
    return this.format(pack);
  }

  async adminList(ctx: AdminContext, page = 1, pageSize = 10) {
    const where: any = ctx.role === 'platform' ? {} : { merchantId: ctx.merchantId };
    const [list, total] = await Promise.all([
      this.prisma.themePack.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.themePack.count({ where }),
    ]);
    return { list: list.map((p) => this.format(p)), total, page, pageSize };
  }

  async create(ctx: AdminContext, data: any) {
    const merchantId = ctx.role === 'platform' ? data.merchantId || ctx.merchantId : ctx.merchantId;
    if (!merchantId) throw new ForbiddenException('缺少 merchantId');
    if (data.items && typeof data.items !== 'string') data.items = JSON.stringify(data.items);
    return this.format(await this.prisma.themePack.create({ data: { ...data, merchantId } }));
  }

  async update(ctx: AdminContext, id: number, data: any) {
    await this.ensureAccess(ctx, id);
    const { merchantId, ...rest } = data;
    if (rest.items && typeof rest.items !== 'string') rest.items = JSON.stringify(rest.items);
    return this.format(await this.prisma.themePack.update({ where: { id }, data: rest }));
  }

  async delete(ctx: AdminContext, id: number) {
    await this.ensureAccess(ctx, id);
    await this.prisma.themePack.delete({ where: { id } });
    return { success: true };
  }

  private async ensureAccess(ctx: AdminContext, id: number) {
    if (ctx.role === 'platform') return;
    const p = await this.prisma.themePack.findUnique({ where: { id } });
    if (!p || Number(p.merchantId) !== ctx.merchantId) {
      throw new NotFoundException('氛围包不存在或无权限');
    }
  }

  private format(pack: any) {
    return {
      ...pack,
      id: Number(pack.id),
      merchantId: pack.merchantId ? Number(pack.merchantId) : null,
      price: Number(pack.price),
      originalPrice: pack.originalPrice ? Number(pack.originalPrice) : null,
      items: pack.items ? JSON.parse(pack.items) : [],
    };
  }
}
