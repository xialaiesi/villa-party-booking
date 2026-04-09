import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminContext } from '../../common/types/admin-context';

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

  async adminList(ctx: AdminContext, page = 1, pageSize = 10) {
    const where: any = ctx.role === 'platform' ? {} : { merchantId: ctx.merchantId };
    const [list, total] = await Promise.all([
      this.prisma.package.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.package.count({ where }),
    ]);
    return { list: list.map((p) => this.format(p)), total, page, pageSize };
  }

  async create(ctx: AdminContext, data: any) {
    const merchantId = ctx.role === 'platform' ? data.merchantId || ctx.merchantId : ctx.merchantId;
    if (!merchantId) throw new ForbiddenException('缺少 merchantId');
    return this.format(await this.prisma.package.create({ data: { ...data, merchantId } }));
  }

  async update(ctx: AdminContext, id: number, data: any) {
    await this.ensureAccess(ctx, id);
    const { merchantId, ...rest } = data;
    return this.format(await this.prisma.package.update({ where: { id }, data: rest }));
  }

  async delete(ctx: AdminContext, id: number) {
    await this.ensureAccess(ctx, id);
    await this.prisma.package.delete({ where: { id } });
    return { success: true };
  }

  private async ensureAccess(ctx: AdminContext, id: number) {
    if (ctx.role === 'platform') return;
    const pkg = await this.prisma.package.findUnique({ where: { id } });
    if (!pkg || Number(pkg.merchantId) !== ctx.merchantId) {
      throw new NotFoundException('套餐不存在或无权限');
    }
  }

  private format(p: any) {
    return {
      ...p,
      id: Number(p.id),
      merchantId: p.merchantId ? Number(p.merchantId) : null,
      price: Number(p.price),
      weekendPrice: p.weekendPrice ? Number(p.weekendPrice) : null,
      holidayPrice: p.holidayPrice ? Number(p.holidayPrice) : null,
    };
  }
}
