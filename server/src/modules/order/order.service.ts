import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async create(userId: number, dto: CreateOrderDto) {
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);
    const days = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (days < 1) throw new BadRequestException('退房日期必须晚于入住日期');

    const villa = await this.prisma.villa.findUnique({
      where: { id: dto.villaId, status: 1 },
    });
    if (!villa) throw new NotFoundException('别墅不存在或已下架');

    // 锁定日期（Redis 分布式锁，TTL 30 分钟）
    const lockKeys: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(checkIn);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const lockKey = `villa:${dto.villaId}:date:${dateStr}`;
      const locked = await this.redis.lock(lockKey, 1800);
      if (!locked) {
        // 释放已锁定的日期
        for (const k of lockKeys) await this.redis.unlock(k);
        throw new ConflictException(`${dateStr} 已被预订`);
      }
      lockKeys.push(lockKey);
    }

    // 计算别墅费用
    let villaAmount = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(checkIn);
      d.setDate(d.getDate() + i);
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

      // 查自定义价格
      const cal = await this.prisma.villaCalendar.findUnique({
        where: {
          villaId_date: { villaId: dto.villaId, date: d },
        },
      });

      if (cal) {
        villaAmount += Number(cal.price);
      } else {
        villaAmount += isWeekend
          ? Number(villa.weekendPrice)
          : Number(villa.basePrice);
      }
    }

    // 连续折扣
    let discountRate = 1.0;
    if (days >= 7 && villa.discount7d)
      discountRate = Number(villa.discount7d);
    else if (days >= 5 && villa.discount5d)
      discountRate = Number(villa.discount5d);
    else if (days >= 3 && villa.discount3d)
      discountRate = Number(villa.discount3d);

    const discountAmount = villaAmount * (1 - discountRate);
    const discountedVillaAmount = villaAmount * discountRate;

    // 计算套餐费用
    let packageAmount = 0;
    const orderPackages: any[] = [];
    if (dto.packages?.length) {
      for (const item of dto.packages) {
        const pkg = await this.prisma.package.findUnique({
          where: { id: item.packageId, status: 1 },
        });
        if (!pkg) continue;
        const pkgPrice = Number(pkg.price); // TODO: 按日期区分价格
        const amount = pkgPrice * item.quantity;
        packageAmount += amount;
        orderPackages.push({
          packageId: item.packageId,
          packageName: pkg.name,
          price: pkgPrice,
          quantity: item.quantity,
        });
      }
    }

    const totalAmount = discountedVillaAmount + packageAmount;
    const depositAmount = Number(villa.deposit);
    const orderNo = this.generateOrderNo();

    const order = await this.prisma.order.create({
      data: {
        orderNo,
        userId,
        villaId: dto.villaId,
        checkIn,
        checkOut,
        days,
        guests: dto.guests,
        villaAmount,
        packageAmount,
        discountRate,
        discountAmount,
        totalAmount,
        depositAmount,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        remark: dto.remark,
        status: 0,
        orderPackages: {
          create: orderPackages,
        },
      },
      include: { orderPackages: true },
    });

    return this.formatOrder(order);
  }

  async findByUser(userId: number, status?: number, page = 1, pageSize = 10) {
    const where: any = { userId };
    if (status !== undefined) where.status = status;

    const [list, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          villa: { select: { name: true, coverImage: true } },
          orderPackages: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      list: list.map((o) => this.formatOrder(o)),
      total,
      page,
      pageSize,
    };
  }

  async findById(id: number, userId?: number) {
    const where: any = { id };
    if (userId) where.userId = userId;

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        villa: true,
        orderPackages: true,
        payments: true,
      },
    });
    if (!order) throw new NotFoundException('订单不存在');
    return this.formatOrder(order);
  }

  async cancel(id: number, userId: number, reason?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
    });
    if (!order) throw new NotFoundException('订单不存在');
    if (![0, 1, 2].includes(order.status)) {
      throw new BadRequestException('当前订单状态不可取消');
    }

    // 释放日期锁
    await this.releaseDateLocks(
      Number(order.villaId),
      order.checkIn,
      order.days,
    );

    await this.prisma.order.update({
      where: { id },
      data: { status: 6, cancelReason: reason },
    });

    return { success: true };
  }

  private async releaseDateLocks(
    villaId: number,
    checkIn: Date,
    days: number,
  ) {
    for (let i = 0; i < days; i++) {
      const d = new Date(checkIn);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      await this.redis.unlock(`villa:${villaId}:date:${dateStr}`);
    }

    // 更新日历状态
    for (let i = 0; i < days; i++) {
      const d = new Date(checkIn);
      d.setDate(d.getDate() + i);
      await this.prisma.villaCalendar.updateMany({
        where: { villaId, date: d, status: 2 },
        data: { status: 1 },
      });
    }
  }

  private generateOrderNo(): string {
    const now = new Date();
    const date = now.toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');
    return `VP${date}${random}`;
  }

  private formatOrder(order: any) {
    return {
      ...order,
      id: Number(order.id),
      userId: Number(order.userId),
      villaId: Number(order.villaId),
      villaAmount: Number(order.villaAmount),
      packageAmount: Number(order.packageAmount),
      discountRate: Number(order.discountRate),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      depositAmount: Number(order.depositAmount),
    };
  }
}
