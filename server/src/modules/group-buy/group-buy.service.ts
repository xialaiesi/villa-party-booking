import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GroupBuyService {
  constructor(private prisma: PrismaService) {}

  /** 发起拼团 */
  async create(
    userId: number,
    data: {
      villaId: number;
      checkIn: string;
      checkOut: string;
      targetCount: number;
      discount: number;
      expireHours?: number;
    },
  ) {
    const villa = await this.prisma.villa.findUnique({
      where: { id: data.villaId, status: 1 },
    });
    if (!villa) throw new NotFoundException('别墅不存在');

    const expireAt = new Date(
      Date.now() + (data.expireHours || 48) * 3600 * 1000,
    );

    const group = await this.prisma.groupBuy.create({
      data: {
        villaId: data.villaId,
        initiatorId: userId,
        checkIn: new Date(data.checkIn),
        checkOut: new Date(data.checkOut),
        targetCount: data.targetCount,
        discount: data.discount,
        expireAt,
        members: {
          create: { userId, status: 0 },
        },
      },
      include: {
        villa: { select: { name: true, coverImage: true, basePrice: true } },
        members: { include: { user: { select: { nickname: true, avatar: true } } } },
      },
    });

    return this.format(group);
  }

  /** 拼团详情 */
  async findById(id: number) {
    const group = await this.prisma.groupBuy.findUnique({
      where: { id },
      include: {
        villa: { select: { name: true, coverImage: true, basePrice: true, weekendPrice: true } },
        members: {
          include: { user: { select: { nickname: true, avatar: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!group) throw new NotFoundException('拼团不存在');
    return this.format(group);
  }

  /** 加入拼团 */
  async join(groupId: number, userId: number) {
    const group = await this.prisma.groupBuy.findUnique({
      where: { id: groupId },
      include: { members: true },
    });
    if (!group) throw new NotFoundException('拼团不存在');
    if (group.status !== 0) throw new BadRequestException('拼团已结束');
    if (new Date() > group.expireAt) throw new BadRequestException('拼团已过期');

    // 检查是否已加入
    if (group.members.some((m) => Number(m.userId) === userId)) {
      return { message: '已加入' };
    }

    // 检查是否满员
    if (group.members.length >= group.targetCount) {
      throw new BadRequestException('拼团人数已满');
    }

    await this.prisma.groupMember.create({
      data: { groupId, userId, status: 0 },
    });

    // 检查是否成团
    const memberCount = group.members.length + 1;
    if (memberCount >= group.targetCount) {
      await this.prisma.groupBuy.update({
        where: { id: groupId },
        data: { status: 1 },
      });
      return { message: '拼团成功！', grouped: true };
    }

    return {
      message: '加入成功',
      current: memberCount,
      target: group.targetCount,
    };
  }

  /** 获取进行中的拼团列表（C端首页展示） */
  async listActive(villaId?: number) {
    const where: any = { status: 0, expireAt: { gt: new Date() } };
    if (villaId) where.villaId = villaId;

    const groups = await this.prisma.groupBuy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        villa: { select: { name: true, coverImage: true, basePrice: true } },
        members: {
          include: { user: { select: { nickname: true, avatar: true } } },
        },
      },
    });

    return groups.map((g) => this.format(g));
  }

  private format(group: any) {
    return {
      ...group,
      id: Number(group.id),
      villaId: Number(group.villaId),
      initiatorId: Number(group.initiatorId),
      discount: Number(group.discount),
      currentCount: group.members?.length || 0,
      villa: group.villa
        ? { ...group.villa, basePrice: Number(group.villa.basePrice) }
        : undefined,
      members: group.members?.map((m: any) => ({
        ...m,
        id: Number(m.id),
        userId: Number(m.userId),
      })),
    };
  }
}
