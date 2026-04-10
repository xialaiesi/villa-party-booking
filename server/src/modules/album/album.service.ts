import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AlbumService {
  constructor(private prisma: PrismaService) {}

  /** 创建聚会相册 */
  async create(userId: number, data: { orderId: number; title?: string }) {
    const order = await this.prisma.order.findFirst({
      where: { id: data.orderId, userId, status: { in: [4, 5] } },
      include: { villa: { select: { name: true } } },
    });
    if (!order) throw new BadRequestException('仅已完成的订单可创建相册');

    // 检查是否已创建
    const existing = await this.prisma.album.findFirst({
      where: { orderId: data.orderId },
    });
    if (existing) return this.formatAlbum(existing);

    const inviteCode = crypto.randomBytes(5).toString('hex'); // 10位邀请码
    const expireAt = new Date();
    expireAt.setFullYear(expireAt.getFullYear() + 1); // 有效期1年

    const album = await this.prisma.album.create({
      data: {
        orderId: data.orderId,
        creatorId: userId,
        title: data.title || `${(order as any).villa?.name || ''}的聚会回忆`,
        inviteCode,
        expireAt,
      },
    });

    return this.formatAlbum(album);
  }

  /** 通过邀请码获取相册 */
  async findByInviteCode(code: string) {
    const album = await this.prisma.album.findUnique({
      where: { inviteCode: code },
      include: {
        order: {
          select: {
            villa: { select: { name: true, coverImage: true } },
            checkIn: true,
            checkOut: true,
          },
        },
        photos: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { nickname: true, avatar: true } } },
        },
      },
    });
    if (!album) throw new NotFoundException('相册不存在');
    if (album.status !== 1) throw new BadRequestException('相册已关闭');
    if (new Date() > album.expireAt) throw new BadRequestException('相册已过期');

    return this.formatAlbum(album);
  }

  /** 获取相册详情 */
  async findById(id: number) {
    const album = await this.prisma.album.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            villa: { select: { name: true, coverImage: true } },
            checkIn: true,
            checkOut: true,
          },
        },
        photos: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { nickname: true, avatar: true } } },
        },
      },
    });
    if (!album) throw new NotFoundException('相册不存在');
    return this.formatAlbum(album);
  }

  /** 上传照片 */
  async addPhoto(
    albumId: number,
    userId: number,
    data: { url: string; caption?: string },
  ) {
    const album = await this.prisma.album.findUnique({ where: { id: albumId } });
    if (!album || album.status !== 1) throw new BadRequestException('相册不可用');

    const photoCount = await this.prisma.albumPhoto.count({
      where: { albumId },
    });
    if (photoCount >= 200) throw new BadRequestException('相册照片已达上限(200张)');

    const photo = await this.prisma.albumPhoto.create({
      data: {
        albumId,
        userId,
        url: data.url,
        caption: data.caption,
      },
    });

    return { id: Number(photo.id), url: photo.url, caption: photo.caption };
  }

  /** 删除照片（仅上传者可删） */
  async removePhoto(photoId: number, userId: number) {
    const photo = await this.prisma.albumPhoto.findFirst({
      where: { id: photoId, userId },
    });
    if (!photo) throw new NotFoundException('照片不存在');

    await this.prisma.albumPhoto.delete({ where: { id: photoId } });
    return { success: true };
  }

  /** 获取用户的相册列表 */
  async findByUser(userId: number) {
    const albums = await this.prisma.album.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            villa: { select: { name: true, coverImage: true } },
            checkIn: true,
          },
        },
        _count: { select: { photos: true } },
      },
    });

    return albums.map((a) => ({
      ...this.formatAlbum(a),
      photoCount: (a as any)._count?.photos || 0,
    }));
  }

  /** 管理后台：获取商家下所有相册 */
  async findAll(merchantId?: number, page = 1, pageSize = 20) {
    const where: any = {};
    if (merchantId) {
      where.order = { villa: { merchantId } };
    }

    const [list, total] = await Promise.all([
      this.prisma.album.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          order: {
            select: {
              orderNo: true,
              villa: { select: { name: true, coverImage: true, merchantId: true } },
              checkIn: true,
              checkOut: true,
            },
          },
          creator: { select: { nickname: true, avatar: true } },
          _count: { select: { photos: true } },
        },
      }),
      this.prisma.album.count({ where }),
    ]);

    return {
      list: list.map((a: any) => ({
        ...this.formatAlbum(a),
        photoCount: a._count?.photos || 0,
        villaName: a.order?.villa?.name,
        coverImage: a.order?.villa?.coverImage,
        orderNo: a.order?.orderNo,
        creator: a.creator,
      })),
      total,
      page,
      pageSize,
    };
  }

  /** 管理后台：关闭/开启相册 */
  async updateStatus(id: number, status: number) {
    await this.prisma.album.update({
      where: { id },
      data: { status },
    });
    return { success: true };
  }

  private formatAlbum(album: any) {
    return {
      ...album,
      id: Number(album.id),
      orderId: Number(album.orderId),
      creatorId: Number(album.creatorId),
      photos: album.photos?.map((p: any) => ({
        ...p,
        id: Number(p.id),
        userId: Number(p.userId),
      })),
    };
  }
}
