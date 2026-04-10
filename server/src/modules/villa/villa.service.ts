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
    facilities?: number[];
    minPrice?: number;
    maxPrice?: number;
    tag?: string;
    sort?: string;
  }) {
    const { page = 1, pageSize = 10 } = query;
    const where: Prisma.VillaWhereInput = { status: 1 };

    if (query.guests) {
      where.maxGuests = { gte: query.guests };
    }
    if (query.minPrice || query.maxPrice) {
      where.basePrice = {};
      if (query.minPrice) where.basePrice.gte = query.minPrice;
      if (query.maxPrice) where.basePrice.lte = query.maxPrice;
    }
    if (query.tag) {
      // 模糊匹配：拆词搜索，如 "生日派对" 能匹配 tags 含 "生日" 的
      const keywords = query.tag.replace(/[,，/\s]+/g, ' ').trim().split(' ').filter(Boolean);
      if (keywords.length === 1) {
        where.tags = { contains: keywords[0] };
      } else {
        where.OR = keywords.map((kw) => ({ tags: { contains: kw } }));
      }
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

  async getReviews(villaId: number, page = 1, pageSize = 10) {
    const [list, total, stats] = await Promise.all([
      this.prisma.review.findMany({
        where: { villaId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { nickname: true, avatar: true } },
        },
      }),
      this.prisma.review.count({ where: { villaId } }),
      this.prisma.review.aggregate({
        _avg: { rating: true },
        where: { villaId },
      }),
    ]);

    return {
      list: list.map((r: any) => ({
        id: Number(r.id),
        userId: Number(r.userId),
        rating: r.rating,
        content: r.content,
        images: r.images ? JSON.parse(r.images) : [],
        reply: r.reply,
        repliedAt: r.repliedAt,
        createdAt: r.createdAt,
        user: r.user,
      })),
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
    };
  }
}
