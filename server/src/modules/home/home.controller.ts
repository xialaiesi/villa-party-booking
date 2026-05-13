import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/home')
export class HomeController {
  constructor(private prisma: PrismaService) {}

  /** 首页综合数据：Banner + 推荐别墅 + 正在拼团 + 精选帖子 */
  @Public()
  @Get()
  async getHomeData() {
    const now = new Date();

    const [banners, villas, groupBuys, posts, themePacks, activityPlans, localServices] = await Promise.all([
      // 限定活动（含即将开始的）
      this.prisma.seasonalEvent.findMany({
        where: { status: 1, endDate: { gte: now } },
        orderBy: { startDate: 'asc' },
        take: 8,
        select: {
          id: true,
          name: true,
          coverImage: true,
          description: true,
          discount: true,
          villaId: true,
        },
      }),
      // 推荐别墅
      this.prisma.villa.findMany({
        where: { status: 1 },
        orderBy: { sortOrder: 'desc' },
        take: 10,
        include: {
          images: { take: 1, orderBy: { sortOrder: 'asc' } },
          facilities: { include: { facility: true }, take: 5 },
          merchant: { select: { name: true } },
        },
      }),
      // 正在拼团（仅 2 条）
      this.prisma.groupBuy.findMany({
        where: { status: 0, expireAt: { gt: now } },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          villa: { select: { name: true, coverImage: true, basePrice: true } },
          _count: { select: { members: true } },
        },
      }),
      // 趴友圈精选
      this.prisma.post.findMany({
        where: { status: 1 },
        orderBy: [{ likeCount: 'desc' }, { createdAt: 'desc' }],
        take: 6,
        include: {
          user: { select: { nickname: true, avatar: true } },
          villa: { select: { name: true } },
        },
      }),
      // 精选氛围包
      this.prisma.themePack.findMany({
        where: { status: 1 },
        orderBy: { sortOrder: 'desc' },
        take: 6,
      }),
      // 活动方案
      this.prisma.activityPlan.findMany({
        where: { status: 1 },
        orderBy: { sortOrder: 'desc' },
        take: 6,
      }),
      // 周边服务
      this.prisma.localService.findMany({
        where: { status: 1 },
        orderBy: { sortOrder: 'desc' },
        take: 8,
      }),
    ]);

    return {
      banners: banners.map((b) => ({
        id: Number(b.id),
        name: b.name,
        coverImage: b.coverImage,
        description: b.description,
        discount: b.discount ? Number(b.discount) : null,
        villaId: b.villaId ? Number(b.villaId) : null,
      })),
      villas: villas.map((v: any) => ({
        id: Number(v.id),
        name: v.name,
        coverImage: v.coverImage || v.images?.[0]?.url,
        basePrice: Number(v.basePrice),
        weekendPrice: Number(v.weekendPrice),
        maxGuests: v.maxGuests,
        tags: v.tags,
        address: v.address,
        merchantName: v.merchant?.name,
        facilities: v.facilities?.map((f: any) => f.facility.name),
      })),
      groupBuys: groupBuys.map((g: any) => ({
        id: Number(g.id),
        villaName: g.villa?.name,
        coverImage: g.villa?.coverImage,
        basePrice: Number(g.villa?.basePrice || 0),
        discount: Number(g.discount),
        targetCount: g.targetCount,
        currentCount: g._count?.members || 0,
        expireAt: g.expireAt,
      })),
      posts: posts.map((p: any) => ({
        id: Number(p.id),
        content: p.content,
        images: p.images ? JSON.parse(p.images) : [],
        likeCount: p.likeCount,
        user: p.user,
        villaName: p.villa?.name,
      })),
      themePacks: themePacks.map((t) => ({
        id: Number(t.id),
        name: t.name,
        theme: t.theme,
        description: (t as any).description,
        price: Number(t.price),
        originalPrice: t.originalPrice ? Number(t.originalPrice) : null,
        coverImage: t.coverImage,
        items: t.items,
      })),
      activityPlans: activityPlans.map((p) => ({
        id: Number(p.id),
        name: p.name,
        description: p.description,
        scene: p.scene,
        minGuests: p.minGuests,
        maxGuests: p.maxGuests,
        duration: p.duration,
        coverImage: p.coverImage,
      })),
      localServices: localServices.map((s: any) => ({
        id: Number(s.id),
        name: s.name,
        category: s.category,
        description: s.description,
        price: Number(s.price),
        unit: s.unit,
        coverImage: s.coverImage,
        provider: s.provider,
      })),
    };
  }

  /** 平台公开统计数据（落地页/首页信任条） */
  @Public()
  @Get('stats')
  async getStats() {
    const [villaCount, orderCount, reviewCount, reviewAvg] = await Promise.all([
      this.prisma.villa.count({ where: { status: 1 } }),
      this.prisma.order.count({ where: { status: { in: [3, 4, 5] } } }),
      this.prisma.review.count(),
      this.prisma.review.aggregate({ _avg: { rating: true } }),
    ]);
    return {
      villaCount,
      orderCount,
      reviewCount,
      avgRating: reviewAvg._avg.rating ? Number(reviewAvg._avg.rating.toFixed(1)) : 0,
    };
  }

  /** 落地页数据：精选案例(高分评价含视频) + 精选别墅 + 统计 */
  @Public()
  @Get('landing')
  async getLandingData() {
    const now = new Date();

    const [featuredReviews, villas, stats] = await Promise.all([
      // 精选案例：高分+有视频+审核通过
      this.prisma.review.findMany({
        where: {
          rating: { gte: 4 },
          videoStatus: 1,
          videos: { not: null },
        },
        orderBy: { rating: 'desc' },
        take: 6,
        include: {
          user: { select: { nickname: true, avatar: true } },
          villa: { select: { name: true, coverImage: true, maxGuests: true, tags: true } },
          order: { select: { guests: true, checkIn: true } },
        },
      }),
      // 精选别墅
      this.prisma.villa.findMany({
        where: { status: 1 },
        orderBy: { sortOrder: 'desc' },
        take: 6,
        include: {
          images: { take: 1, orderBy: { sortOrder: 'asc' } },
          facilities: { include: { facility: true }, take: 5 },
          merchant: { select: { name: true } },
          reviews: { where: { rating: { gte: 4 } }, select: { rating: true }, take: 100 },
        },
      }),
      // 统计
      Promise.all([
        this.prisma.villa.count({ where: { status: 1 } }),
        this.prisma.order.count({ where: { status: { in: [3, 4, 5] } } }),
        this.prisma.review.count(),
      ]),
    ]);

    return {
      cases: featuredReviews.map((r: any) => ({
        id: Number(r.id),
        rating: r.rating,
        content: r.content,
        videos: r.videos ? JSON.parse(r.videos) : [],
        images: r.images ? JSON.parse(r.images) : [],
        user: { nickname: r.user?.nickname, avatar: r.user?.avatar },
        villa: {
          name: r.villa?.name,
          coverImage: r.villa?.coverImage,
          maxGuests: r.villa?.maxGuests,
          tags: r.villa?.tags,
        },
        guests: r.order?.guests,
        checkIn: r.order?.checkIn,
      })),
      villas: villas.map((v: any) => {
        const ratings = v.reviews || [];
        const avg = ratings.length ? (ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length) : 0;
        return {
          id: Number(v.id),
          name: v.name,
          coverImage: v.coverImage || v.images?.[0]?.url,
          basePrice: Number(v.basePrice),
          maxGuests: v.maxGuests,
          tags: v.tags,
          address: v.address,
          merchantName: v.merchant?.name,
          facilities: v.facilities?.map((f: any) => f.facility.name),
          ratingAvg: avg ? Number(avg.toFixed(1)) : null,
          ratingCount: ratings.length,
        };
      }),
      stats: { villaCount: stats[0], orderCount: stats[1], reviewCount: stats[2] },
    };
  }

  /** 我的页面统计数据 */
  @Get('mine/stats')
  async getMineStats(@CurrentUser('sub') userId: number) {
    const [orderTotal, pendingPay, ongoing, completed, albumCount, postCount] = await Promise.all([
      this.prisma.order.count({ where: { userId } }),
      this.prisma.order.count({ where: { userId, status: 0 } }),
      this.prisma.order.count({ where: { userId, status: { in: [1, 2, 3, 4] } } }),
      this.prisma.order.count({ where: { userId, status: 5 } }),
      this.prisma.album.count({ where: { creatorId: userId } }),
      this.prisma.post.count({ where: { userId } }),
    ]);

    return {
      orderTotal,
      pendingPay,
      ongoing,
      completed,
      albumCount,
      postCount,
    };
  }
}
