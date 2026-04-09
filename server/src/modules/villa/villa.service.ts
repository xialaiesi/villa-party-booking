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
      where.tags = { contains: query.tag };
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

    return {
      list: list.map((v) => this.formatVilla(v)),
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
    return this.formatVilla(villa);
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
