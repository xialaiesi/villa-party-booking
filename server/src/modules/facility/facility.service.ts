import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminContext } from '../../common/types/admin-context';

@Injectable()
export class FacilityService {
  constructor(private prisma: PrismaService) {}

  async findAll(merchantId?: number) {
    const where: any = {};
    if (merchantId) where.merchantId = merchantId;
    const list = await this.prisma.facility.findMany({ where, orderBy: { id: 'asc' } });
    return list.map((f) => ({ ...f, id: Number(f.id), merchantId: Number(f.merchantId) }));
  }

  async adminList(ctx: AdminContext) {
    if (ctx.role === 'platform') return this.findAll();
    return this.findAll(ctx.merchantId!);
  }

  async create(ctx: AdminContext, data: any) {
    const merchantId = ctx.role === 'platform' ? data.merchantId || ctx.merchantId : ctx.merchantId;
    if (!merchantId) throw new ForbiddenException('缺少 merchantId');
    const f = await this.prisma.facility.create({ data: { ...data, merchantId } });
    return { ...f, id: Number(f.id), merchantId: Number(f.merchantId) };
  }

  async update(ctx: AdminContext, id: number, data: any) {
    await this.ensureAccess(ctx, id);
    const { merchantId, ...rest } = data;
    const f = await this.prisma.facility.update({ where: { id }, data: rest });
    return { ...f, id: Number(f.id), merchantId: Number(f.merchantId) };
  }

  async delete(ctx: AdminContext, id: number) {
    await this.ensureAccess(ctx, id);
    await this.prisma.facility.delete({ where: { id } });
    return { success: true };
  }

  private async ensureAccess(ctx: AdminContext, id: number) {
    if (ctx.role === 'platform') return;
    const f = await this.prisma.facility.findUnique({ where: { id } });
    if (!f || Number(f.merchantId) !== ctx.merchantId) {
      throw new NotFoundException('设施不存在或无权限');
    }
  }
}
