import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class VillaService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    pageSize?: number;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    bedrooms?: number;
    facilities?: number[];
    minPrice?: number;
    maxPrice?: number;
    keyword?: string;
    tag?: string;
    sort?: string;
  }) {
    const { page = 1, pageSize = 10 } = query;
    const where: Prisma.VillaWhereInput = { status: 1 };

    // 使用 AND 数组来安全组合多个 OR 条件
    const andConditions: Prisma.VillaWhereInput[] = [];
    if (query.keyword) {
      andConditions.push({
        OR: [
          { name: { contains: query.keyword } },
          { address: { contains: query.keyword } },
        ],
      });
    }
    if (query.guests) {
      where.maxGuests = { gte: query.guests };
    }
    if (query.bedrooms) {
      where.bedrooms = { gte: query.bedrooms };
    }
    if (query.minPrice || query.maxPrice) {
      where.basePrice = {};
      if (query.minPrice) where.basePrice.gte = query.minPrice;
      if (query.maxPrice) where.basePrice.lte = query.maxPrice;
    }
    if (query.tag) {
      // 直接用 contains 模糊匹配，如 tag="团建" 能匹配 tags 含 "团建" 的别墅
      where.tags = { contains: query.tag };
    }
    if (andConditions.length) {
      where.AND = andConditions;
    }
    if (query.facilities?.length) {
      where.facilities = {
        some: { facilityId: { in: query.facilities } },
      };
    }

    let orderBy: Prisma.VillaOrderByWithRelationInput = { sortOrder: 'desc' };
    if (query.sort === 'price_asc') orderBy = { basePrice: 'asc' };
    if (query.sort === 'price_desc') orderBy = { basePrice: 'desc' };

    const [list, total] = await Promise.all([
      this.prisma.villa.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          facilities: { include: { facility: true } },
        },
      }),
      this.prisma.villa.count({ where }),
    ]);

    // 为每个别墅加上评分统计
    const villaIds = list.map((v) => Number(v.id));
    const ratingStats = await this.prisma.review.groupBy({
      by: ['villaId'],
      where: { villaId: { in: villaIds } },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const ratingMap = new Map(ratingStats.map((r: any) => [
      Number(r.villaId),
      { avg: Number(r._avg.rating || 0), count: r._count.rating },
    ]));

    const formatted = list.map((v) => {
      const stat = ratingMap.get(Number(v.id));
      return {
        ...this.formatVilla(v),
        ratingAvg: stat && stat.count >= 10 ? parseFloat(stat.avg.toFixed(1)) : null,
        ratingCount: stat?.count || 0,
      };
    });

    // 如果按评分排序
    if (query.sort === 'rating') {
      formatted.sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0));
    }

    return {
      list: formatted,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: number) {
    const villa = await this.prisma.villa.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        facilities: { include: { facility: true } },
        merchant: { select: { id: true, name: true, logo: true } },
        timeSlots: {
          where: { status: 1 },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!villa) throw new NotFoundException('别墅不存在');
    const stats = await this.prisma.review.aggregate({
      where: { villaId: id },
      _avg: { rating: true },
      _count: { rating: true },
    });
    return {
      ...this.formatVilla(villa),
      ratingAvg: stats._count.rating >= 10 ? parseFloat(Number(stats._avg.rating || 0).toFixed(1)) : null,
      ratingCount: stats._count.rating,
    };
  }

  async getCalendar(villaId: number, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const villa = await this.prisma.villa.findUnique({
      where: { id: villaId },
      select: { basePrice: true, weekendPrice: true },
    });
    if (!villa) throw new NotFoundException('别墅不存在');

    const calendars = await this.prisma.villaCalendar.findMany({
      where: {
        villaId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    // 生成完整月份日历
    const days: any[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const cal = calendars.find(
        (c) => c.date.toISOString().split('T')[0] === dateStr,
      );
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

      days.push({
        date: dateStr,
        price: cal
          ? Number(cal.price)
          : isWeekend
            ? Number(villa.weekendPrice)
            : Number(villa.basePrice),
        status: cal?.status ?? 1,
      });
    }

    return days;
  }

  async getReviews(villaId: number, page = 1, pageSize = 10, sort?: string) {
    const where: any = { villaId };
    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'rating_desc') orderBy = { rating: 'desc' };
    if (sort === 'rating_asc') orderBy = { rating: 'asc' };
    const [list, total, stats] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { nickname: true, avatar: true } },
        },
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({
        _avg: { rating: true },
        where: { villaId },
      }),
    ]);

    return {
      list: list.map((r: any) => {
        // 过滤待审核的视频（videoStatus=0 不展示）
        let videos = r.videos ? JSON.parse(r.videos) : [];
        if (r.videoStatus === 0) {
          videos = [];
        }
        return {
          id: Number(r.id),
          userId: Number(r.userId),
          rating: r.rating,
          content: r.content,
          images: r.images ? JSON.parse(r.images) : [],
          videos,
          reply: r.reply,
          repliedAt: r.repliedAt,
          createdAt: r.createdAt,
          user: r.user,
        };
      }),
      total,
      page,
      pageSize,
      avgRating: Number(stats._avg.rating || 0).toFixed(1),
    };
  }

  private formatVilla(villa: any) {
    return {
      ...villa,
      id: Number(villa.id),
      basePrice: Number(villa.basePrice),
      weekendPrice: Number(villa.weekendPrice),
      deposit: Number(villa.deposit),
      area: villa.area ? Number(villa.area) : null,
      facilities: villa.facilities?.map((vf: any) => ({
        id: Number(vf.facility.id),
        name: vf.facility.name,
        icon: vf.facility.icon,
        category: vf.facility.category,
      })),
      images: villa.images?.map((img: any) => ({
        id: Number(img.id),
        url: img.url,
        caption: img.caption,
      })),
      timeSlots: villa.timeSlots?.map((s: any) => ({
        id: Number(s.id),
        type: s.type,
        name: s.name,
        startMinute: s.startMinute,
        endMinute: s.endMinute,
        price: Number(s.price),
        weekendPrice: s.weekendPrice != null ? Number(s.weekendPrice) : null,
      })),
    };
  }

  /**
   * 查询某别墅某天各时段是否可订。
   * 占用以 Redis 锁（待支付保留）+ 已确认订单（日历锁定）为准。
   */
  async getSlotAvailability(villaId: number, date: string) {
    const slots = await this.prisma.villaTimeSlot.findMany({
      where: { villaId, status: 1 },
      orderBy: { sortOrder: 'asc' },
    });
    if (!slots.length) return [];

    const day = new Date(date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    // 当天未取消/未拒绝/未关闭的订单（含整天与各时段）
    const activeOrders = await this.prisma.order.findMany({
      where: {
        villaId,
        checkIn: { lte: day },
        checkOut: { gte: day },
        status: { notIn: [6, 7, 8] },
      },
      select: { slotStart: true, slotEnd: true },
    });

    const overlaps = (
      a: { start: number; end: number },
      b: { start: number; end: number },
    ) => a.start < b.end && b.start < a.end;

    const busyWindows = activeOrders.map((o) => ({
      start: o.slotStart ?? 0,
      end: o.slotEnd ?? 1440,
    }));

    return slots.map((s) => {
      const win = { start: s.startMinute, end: s.endMinute };
      const dayOfWeek = day.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
      const available = !busyWindows.some((b) => overlaps(win, b));
      return {
        id: Number(s.id),
        type: s.type,
        name: s.name,
        startMinute: s.startMinute,
        endMinute: s.endMinute,
        price:
          isWeekend && s.weekendPrice != null
            ? Number(s.weekendPrice)
            : Number(s.price),
        available,
      };
    });
  }
}
