import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminContext } from '../../common/types/admin-context';

@Injectable()
export class ActivityPlanService {
  constructor(private prisma: PrismaService) {}

  /** C端：按场景和人数推荐活动方案 */
  async recommend(query: { scene?: string; guests?: number }) {
    const where: any = { status: 1 };
    if (query.scene) where.scene = query.scene;
    if (query.guests) {
      where.minGuests = { lte: query.guests };
      where.maxGuests = { gte: query.guests };
    }

    const plans = await this.prisma.activityPlan.findMany({
      where,
      orderBy: { sortOrder: 'desc' },
      include: {
        steps: { orderBy: { sortOrder: 'asc' } },
        packages: { include: { package: true } },
      },
    });

    return plans.map((p) => this.format(p));
  }

  /** C端：方案详情 */
  async findById(id: number) {
    const plan = await this.prisma.activityPlan.findUnique({
      where: { id, status: 1 },
      include: {
        steps: { orderBy: { sortOrder: 'asc' } },
        packages: { include: { package: true } },
      },
    });
    if (!plan) throw new NotFoundException('活动方案不存在');
    return this.format(plan);
  }

  /** 管理后台：列表 */
  async findAll(ctx: AdminContext, page = 1, pageSize = 10) {
    const where: any = ctx.role === 'platform' ? {} : { merchantId: ctx.merchantId };
    const [list, total] = await Promise.all([
      this.prisma.activityPlan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          steps: { orderBy: { sortOrder: 'asc' } },
          packages: { include: { package: true } },
        },
      }),
      this.prisma.activityPlan.count({ where }),
    ]);
    return { list: list.map((p) => this.format(p)), total, page, pageSize };
  }

  private async ensureAccess(ctx: AdminContext, id: number) {
    if (ctx.role === 'platform') return;
    const p = await this.prisma.activityPlan.findUnique({ where: { id } });
    if (!p || Number(p.merchantId) !== ctx.merchantId) {
      throw new NotFoundException('方案不存在或无权限');
    }
  }

  /** 管理后台：创建方案 */
  async create(ctx: AdminContext, data: {
    name: string;
    description?: string;
    scene: string;
    minGuests?: number;
    maxGuests?: number;
    duration?: string;
    coverImage?: string;
    steps?: { time?: string; title: string; content?: string; tips?: string }[];
    packageIds?: { packageId: number; required?: boolean }[];
  }) {
    const { steps, packageIds, ...planData } = data;
    const merchantId = ctx.role === 'platform' ? (planData as any).merchantId || ctx.merchantId : ctx.merchantId;
    if (!merchantId) throw new ForbiddenException('缺少 merchantId');
    delete (planData as any).merchantId;

    return this.prisma.activityPlan.create({
      data: {
        ...planData,
        merchantId,
        steps: steps?.length
          ? {
              create: steps.map((s, i) => ({
                sortOrder: i,
                time: s.time,
                title: s.title,
                content: s.content,
                tips: s.tips,
              })),
            }
          : undefined,
        packages: packageIds?.length
          ? {
              create: packageIds.map((p) => ({
                packageId: p.packageId,
                required: p.required ? 1 : 0,
              })),
            }
          : undefined,
      },
      include: {
        steps: { orderBy: { sortOrder: 'asc' } },
        packages: { include: { package: true } },
      },
    });
  }

  /** 管理后台：更新方案 */
  async update(
    ctx: AdminContext,
    id: number,
    data: {
      name?: string;
      description?: string;
      scene?: string;
      minGuests?: number;
      maxGuests?: number;
      duration?: string;
      coverImage?: string;
      status?: number;
      steps?: { time?: string; title: string; content?: string; tips?: string }[];
      packageIds?: { packageId: number; required?: boolean }[];
    },
  ) {
    await this.ensureAccess(ctx, id);
    const { steps, packageIds, ...planData } = data;
    delete (planData as any).merchantId;

    // 更新步骤：先删后建
    if (steps) {
      await this.prisma.planStep.deleteMany({ where: { planId: id } });
      await this.prisma.planStep.createMany({
        data: steps.map((s, i) => ({
          planId: id,
          sortOrder: i,
          time: s.time,
          title: s.title,
          content: s.content,
          tips: s.tips,
        })),
      });
    }

    // 更新套餐关联
    if (packageIds) {
      await this.prisma.planPackage.deleteMany({ where: { planId: id } });
      await this.prisma.planPackage.createMany({
        data: packageIds.map((p) => ({
          planId: id,
          packageId: p.packageId,
          required: p.required ? 1 : 0,
        })),
      });
    }

    return this.prisma.activityPlan.update({
      where: { id },
      data: planData,
      include: {
        steps: { orderBy: { sortOrder: 'asc' } },
        packages: { include: { package: true } },
      },
    });
  }

  async delete(ctx: AdminContext, id: number) {
    await this.ensureAccess(ctx, id);
    await this.prisma.activityPlan.delete({ where: { id } });
    return { success: true };
  }

  private format(plan: any) {
    return {
      ...plan,
      id: Number(plan.id),
      packages: plan.packages?.map((pp: any) => ({
        id: Number(pp.package.id),
        name: pp.package.name,
        price: Number(pp.package.price),
        image: pp.package.image,
        required: pp.required === 1,
      })),
      steps: plan.steps?.map((s: any) => ({
        ...s,
        id: Number(s.id),
      })),
    };
  }
}
