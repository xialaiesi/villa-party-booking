import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AdminMessageService } from '../message/admin-message.service';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private adminMessage: AdminMessageService,
  ) {}

  async create(userId: number, dto: CreateOrderDto) {
    const villa = await this.prisma.villa.findUnique({
      where: { id: dto.villaId, status: 1 },
    });
    if (!villa) throw new NotFoundException('别墅不存在或已下架');

    // 加载该别墅的所有可售时段，用于冲突判定
    const slots = await this.prisma.villaTimeSlot.findMany({
      where: { villaId: dto.villaId, status: 1 },
    });

    const isSlotBooking = dto.slotId != null;
    let slot: (typeof slots)[number] | undefined;
    if (isSlotBooking) {
      slot = slots.find((s) => Number(s.id) === Number(dto.slotId));
      if (!slot) throw new NotFoundException('所选时段不存在或已下架');
    }

    const checkIn = new Date(dto.checkIn);
    // 时段预订为单日，整天预订按日期区间
    const checkOut = isSlotBooking ? new Date(dto.checkIn) : new Date(dto.checkOut);
    const days = isSlotBooking
      ? 1
      : Math.ceil(
          (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
        );
    if (days < 1) throw new BadRequestException('退房日期必须晚于入住日期');

    // 请求占用的时间窗 + 占锁后缀
    const win = slot
      ? { start: slot.startMinute, end: slot.endMinute }
      : { start: 0, end: 1440 };
    const occupySuffix = slot ? `slot:${Number(slot.id)}` : 'full';

    // 锁定日期（Redis 分布式锁，TTL 30 分钟，按时段粒度，整天与任意时段互斥）
    const lockKeys: string[] = [];
    try {
      for (let i = 0; i < days; i++) {
        const d = new Date(checkIn);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        await this.acquireDateSlot(
          Number(dto.villaId),
          dateStr,
          win,
          occupySuffix,
          slots,
          lockKeys,
        );
      }
    } catch (e) {
      for (const k of lockKeys) await this.redis.unlock(k);
      throw e;
    }

    // 计算别墅费用
    const { villaAmount, discountRate, discountAmount, discountedVillaAmount } =
      await this.computeVillaPricing(villa, slot, checkIn, days);

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
        merchantId: villa.merchantId,
        userId,
        villaId: dto.villaId,
        checkIn,
        checkOut,
        days,
        slotId: slot ? Number(slot.id) : null,
        slotName: slot ? slot.name : null,
        slotStart: slot ? slot.startMinute : null,
        slotEnd: slot ? slot.endMinute : null,
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

    // 通知商家有新订单
    this.adminMessage.notifyOrderStatusChange(order, 0).catch(() => {});

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

  /** 入住登记 + 签署派对公约 */
  async signPact(
    id: number,
    userId: number,
    data: {
      leaderName: string;
      leaderPhone: string;
      leaderIdTail?: string;
      partySize?: number;
    },
  ) {
    const order = await this.prisma.order.findFirst({ where: { id, userId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (![1, 2, 3].includes(order.status)) {
      throw new BadRequestException('当前订单状态无需登记');
    }
    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        leaderName: data.leaderName,
        leaderPhone: data.leaderPhone,
        leaderIdTail: data.leaderIdTail || null,
        partySize: data.partySize ?? null,
        pactSignedAt: new Date(),
      },
    });
    return this.formatOrder(updated);
  }

  /**
   * 取消违约金试算（不改库）。
   * 规则：入住前 ≥3 天免费取消；不足 3 天收订单金额 50%；未付款（状态0）不收违约金。
   * 退款 = 已付金额 - 违约金（不为负）。当前 mock 支付下，已付金额=定金（状态1/2）。
   */
  calcCancelPolicy(order: {
    status: number;
    checkIn: Date;
    totalAmount: any;
    depositAmount: any;
  }) {
    const total = Number(order.totalAmount);
    const paidAmount = order.status >= 1 ? Number(order.depositAmount) : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(order.checkIn);
    checkIn.setHours(0, 0, 0, 0);
    const daysUntilCheckIn = Math.ceil(
      (checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    const freeCancellable = order.status === 0 || daysUntilCheckIn >= 3;
    const penaltyRate = freeCancellable ? 0 : 0.5;
    const penaltyAmount = Math.round(total * penaltyRate * 100) / 100;
    const refundAmount = Math.max(0, paidAmount - penaltyAmount);

    return {
      daysUntilCheckIn,
      freeCancellable,
      penaltyRate,
      penaltyAmount,
      paidAmount,
      refundAmount,
    };
  }

  /** 取消前预览违约金与退款明细 */
  async cancelPreview(id: number, userId: number) {
    const order = await this.prisma.order.findFirst({ where: { id, userId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (![0, 1, 2].includes(order.status)) {
      throw new BadRequestException('当前订单状态不可取消');
    }
    return this.calcCancelPolicy(order);
  }

  async cancel(id: number, userId: number, reason?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
    });
    if (!order) throw new NotFoundException('订单不存在');
    if (![0, 1, 2].includes(order.status)) {
      throw new BadRequestException('当前订单状态不可取消');
    }

    const policy = this.calcCancelPolicy(order);

    // 释放日期锁（按时段粒度）
    await this.releaseDateLocks(
      Number(order.villaId),
      order.checkIn,
      order.days,
      order.slotId != null ? `slot:${Number(order.slotId)}` : 'full',
    );

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: 6,
        cancelReason: reason,
        penaltyAmount: policy.penaltyAmount,
      },
    });
    this.adminMessage.notifyOrderStatusChange(updated, 6).catch(() => {});

    return {
      success: true,
      penaltyAmount: policy.penaltyAmount,
      refundAmount: policy.refundAmount,
    };
  }

  /**
   * 改期 / 延住（状态 1-3 可改）。
   * 校验新日期/档期房态可订 → 释放原锁、占新锁 → 按差价补退。
   * 仅整天档支持改为多日；时段档改期仍为单日。
   */
  async reschedule(
    id: number,
    userId: number,
    dto: { checkIn: string; checkOut?: string; slotId?: number },
  ) {
    const order = await this.prisma.order.findFirst({ where: { id, userId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (![1, 2, 3].includes(order.status)) {
      throw new BadRequestException('当前订单状态不可改期');
    }

    const villa = await this.prisma.villa.findUnique({
      where: { id: Number(order.villaId), status: 1 },
    });
    if (!villa) throw new NotFoundException('别墅不存在或已下架');

    const slots = await this.prisma.villaTimeSlot.findMany({
      where: { villaId: Number(order.villaId), status: 1 },
    });

    const isSlotBooking = dto.slotId != null;
    let slot: (typeof slots)[number] | undefined;
    if (isSlotBooking) {
      slot = slots.find((s) => Number(s.id) === Number(dto.slotId));
      if (!slot) throw new NotFoundException('所选时段不存在或已下架');
    }

    const checkIn = new Date(dto.checkIn);
    const checkOut = isSlotBooking
      ? new Date(dto.checkIn)
      : new Date(dto.checkOut as string);
    const days = isSlotBooking
      ? 1
      : Math.ceil(
          (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
        );
    if (days < 1) throw new BadRequestException('退房日期必须晚于入住日期');

    const win = slot
      ? { start: slot.startMinute, end: slot.endMinute }
      : { start: 0, end: 1440 };
    const occupySuffix = slot ? `slot:${Number(slot.id)}` : 'full';
    const oldSuffix =
      order.slotId != null ? `slot:${Number(order.slotId)}` : 'full';

    // 本订单当前占用的锁 key 集合：改期时跳过自身，避免与自己冲突（支持延住/保持起始日）
    const oldKeys = new Set<string>();
    for (let i = 0; i < order.days; i++) {
      const d = new Date(order.checkIn);
      d.setDate(d.getDate() + i);
      oldKeys.add(
        this.slotKey(Number(order.villaId), d.toISOString().split('T')[0], oldSuffix),
      );
    }

    // 占新档期锁（跳过本订单已持有的同 key）。失败时仅回滚新占的锁，原锁不动、订单保持原状
    const acquired: string[] = [];
    const newKeys = new Set<string>();
    try {
      for (let i = 0; i < days; i++) {
        const d = new Date(checkIn);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const key = this.slotKey(Number(order.villaId), dateStr, occupySuffix);
        newKeys.add(key);
        if (oldKeys.has(key)) continue; // 本订单已持有，无需重复占用
        await this.acquireDateSlot(
          Number(order.villaId),
          dateStr,
          win,
          occupySuffix,
          slots,
          acquired,
        );
      }
    } catch (e) {
      for (const k of acquired) await this.redis.unlock(k);
      throw e;
    }

    // 释放不再使用的原锁 + 复位对应日历占用
    for (let i = 0; i < order.days; i++) {
      const d = new Date(order.checkIn);
      d.setDate(d.getDate() + i);
      const key = this.slotKey(
        Number(order.villaId),
        d.toISOString().split('T')[0],
        oldSuffix,
      );
      if (newKeys.has(key)) continue; // 仍在使用
      await this.redis.unlock(key);
      await this.prisma.villaCalendar.updateMany({
        where: { villaId: Number(order.villaId), date: d, status: 2 },
        data: { status: 1 },
      });
    }

    // 重算别墅费用（套餐不变）
    const { villaAmount, discountRate, discountAmount, discountedVillaAmount } =
      await this.computeVillaPricing(villa, slot, checkIn, days);
    const packageAmount = Number(order.packageAmount);
    const newTotal = discountedVillaAmount + packageAmount;
    const priceDiff = Math.round((newTotal - Number(order.totalAmount)) * 100) / 100;

    // 已确认订单（状态≥2，整天档）锁定新日历
    if (order.status >= 2 && !slot) {
      for (let i = 0; i < days; i++) {
        const d = new Date(checkIn);
        d.setDate(d.getDate() + i);
        await this.prisma.villaCalendar.upsert({
          where: { villaId_date: { villaId: Number(order.villaId), date: d } },
          create: { villaId: Number(order.villaId), date: d, price: 0, status: 2 },
          update: { status: 2 },
        });
      }
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        checkIn,
        checkOut,
        days,
        slotId: slot ? Number(slot.id) : null,
        slotName: slot ? slot.name : null,
        slotStart: slot ? slot.startMinute : null,
        slotEnd: slot ? slot.endMinute : null,
        villaAmount,
        discountRate,
        discountAmount,
        totalAmount: newTotal,
      },
    });

    return { ...this.formatOrder(updated), priceDiff };
  }

  /**
   * 别墅费用计算（整天档按日历自定义价 + 连住折扣；时段档按时段平/周末价）。
   * create 与 reschedule 共用，保证定价口径一致。
   */
  private async computeVillaPricing(
    villa: any,
    slot: { startMinute: number; endMinute: number; price: any; weekendPrice: any } | undefined,
    checkIn: Date,
    days: number,
  ) {
    let villaAmount = 0;
    let discountRate = 1.0;
    if (slot) {
      const dayOfWeek = checkIn.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
      villaAmount =
        isWeekend && slot.weekendPrice != null
          ? Number(slot.weekendPrice)
          : Number(slot.price);
    } else {
      for (let i = 0; i < days; i++) {
        const d = new Date(checkIn);
        d.setDate(d.getDate() + i);
        const dayOfWeek = d.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

        const cal = await this.prisma.villaCalendar.findUnique({
          where: { villaId_date: { villaId: Number(villa.id), date: d } },
        });

        if (cal) {
          villaAmount += Number(cal.price);
        } else {
          villaAmount += isWeekend
            ? Number(villa.weekendPrice)
            : Number(villa.basePrice);
        }
      }

      if (days >= 7 && villa.discount7d)
        discountRate = Number(villa.discount7d);
      else if (days >= 5 && villa.discount5d)
        discountRate = Number(villa.discount5d);
      else if (days >= 3 && villa.discount3d)
        discountRate = Number(villa.discount3d);
    }

    const discountAmount = villaAmount * (1 - discountRate);
    const discountedVillaAmount = villaAmount * discountRate;
    return { villaAmount, discountRate, discountAmount, discountedVillaAmount };
  }

  private slotKey(villaId: number, dateStr: string, suffix: string): string {
    return `villa:${villaId}:date:${dateStr}:${suffix}`;
  }

  /** 两个时间窗是否重叠（半开区间） */
  private overlaps(
    a: { start: number; end: number },
    b: { start: number; end: number },
  ): boolean {
    return a.start < b.end && b.start < a.end;
  }

  /**
   * 锁定某日某时段（含冲突校验）。
   * 整天窗 [0,1440) 与任意时段重叠；时段之间仅当窗口重叠才冲突。
   * 用短 gate 锁串行化"检查冲突→占锁"避免竞态。
   */
  private async acquireDateSlot(
    villaId: number,
    dateStr: string,
    win: { start: number; end: number },
    occupySuffix: string,
    slots: { id: bigint; startMinute: number; endMinute: number }[],
    acquired: string[],
  ) {
    const gate = `villa:${villaId}:date:${dateStr}:gate`;
    const gotGate = await this.redis.lock(gate, 15);
    if (!gotGate) throw new ConflictException(`${dateStr} 预订繁忙，请重试`);
    try {
      // 与请求窗口冲突的占锁后缀集合：整天 + 重叠时段
      const conflictSuffixes = [
        'full',
        ...slots
          .filter((s) =>
            this.overlaps(win, { start: s.startMinute, end: s.endMinute }),
          )
          .map((s) => `slot:${Number(s.id)}`),
      ];
      for (const suf of conflictSuffixes) {
        if (suf === occupySuffix) continue;
        if (await this.redis.get(this.slotKey(villaId, dateStr, suf))) {
          throw new ConflictException(`${dateStr} 该时段已被预订`);
        }
      }
      const ok = await this.redis.lock(
        this.slotKey(villaId, dateStr, occupySuffix),
        1800,
      );
      if (!ok) throw new ConflictException(`${dateStr} 该时段已被预订`);
      acquired.push(this.slotKey(villaId, dateStr, occupySuffix));
    } finally {
      await this.redis.unlock(gate);
    }
  }

  private async releaseDateLocks(
    villaId: number,
    checkIn: Date,
    days: number,
    occupySuffix: string,
  ) {
    for (let i = 0; i < days; i++) {
      const d = new Date(checkIn);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      await this.redis.unlock(this.slotKey(villaId, dateStr, occupySuffix));
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

  /** Mock 支付定金：记录支付意向，等商家确认 */
  async mockPayDeposit(id: number, userId: number) {
    const order = await this.prisma.order.findFirst({ where: { id, userId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== 0) throw new BadRequestException('当前状态无法支付定金');
    // Mock：不真正收款，返回"等待确认"
    return { success: true, message: '定金支付请求已提交，等待商家确认到账' };
  }

  /** Mock 支付尾款：记录支付意向，等商家确认 */
  async mockPayFinal(id: number, userId: number) {
    const order = await this.prisma.order.findFirst({ where: { id, userId } });
    if (!order) throw new NotFoundException('订单不存在');
    if (order.status !== 2) throw new BadRequestException('当前状态无法支付尾款');
    return { success: true, message: '尾款支付请求已提交，等待商家确认到账' };
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
      penaltyAmount: order.penaltyAmount != null ? Number(order.penaltyAmount) : 0,
    };
  }
}
