import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AdminContext } from '../../common/types/admin-context';

@Injectable()
export class XhsNoteService {
  constructor(private prisma: PrismaService) {}

  // ==================== C 端 ====================

  /** 种草笔记 Feed（瀑布流） */
  async feed(page = 1, pageSize = 10, villaId?: number, style?: string) {
    const where: any = { status: 1 };
    if (villaId) where.villaId = villaId;
    if (style) where.style = style;

    const [list, total] = await Promise.all([
      this.prisma.xhsNote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { nickname: true, avatar: true } },
          villa: { select: { id: true, name: true, coverImage: true, basePrice: true, address: true } },
        },
      }),
      this.prisma.xhsNote.count({ where }),
    ]);

    return {
      list: list.map((n) => this.format(n)),
      total,
      page,
      pageSize,
    };
  }

  /** 笔记详情 */
  async getNote(id: number, userId?: number) {
    const note = await this.prisma.xhsNote.findUnique({
      where: { id },
      include: {
        user: { select: { nickname: true, avatar: true } },
        villa: { select: { id: true, name: true, coverImage: true, basePrice: true, address: true, status: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { nickname: true, avatar: true } },
            replies: {
              include: { user: { select: { nickname: true, avatar: true } } },
            },
          },
          where: { parentId: null },
        },
      },
    });
    if (!note || note.status === 2) throw new NotFoundException('笔记不存在');

    // 增加浏览量
    await this.prisma.xhsNote.update({ where: { id }, data: { viewCount: { increment: 1 } } });

    // 查询用户互动状态
    let liked = false;
    let collected = false;
    if (userId) {
      const interactions = await this.prisma.xhsNoteInteraction.findMany({
        where: { noteId: id, userId },
      });
      liked = interactions.some((i) => i.type === 'like');
      collected = interactions.some((i) => i.type === 'collect');
    }

    return {
      ...this.format(note),
      comments: note.comments.map((c) => ({
        ...c,
        id: Number(c.id),
        userId: Number(c.userId),
        replies: (c as any).replies?.map((r: any) => ({
          ...r,
          id: Number(r.id),
          userId: Number(r.userId),
        })) || [],
      })),
      liked,
      collected,
    };
  }

  /** 点赞/取消 */
  async toggleLike(noteId: number, userId: number) {
    return this.toggleInteraction(noteId, userId, 'like');
  }

  /** 收藏/取消 */
  async toggleCollect(noteId: number, userId: number) {
    return this.toggleInteraction(noteId, userId, 'collect');
  }

  /** 评论 */
  async addComment(noteId: number, userId: number, content: string, parentId?: number) {
    const note = await this.prisma.xhsNote.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException('笔记不存在');

    const comment = await this.prisma.xhsNoteComment.create({
      data: { noteId, userId, content, parentId: parentId || null },
    });

    await this.prisma.xhsNote.update({
      where: { id: noteId },
      data: { commentCount: { increment: 1 } },
    });

    return { id: Number(comment.id) };
  }

  /** 用户发布笔记 */
  async createNote(userId: number, data: {
    title: string;
    content: string;
    coverImage: string;
    images?: string[];
    tags?: string[];
    villaId?: number;
    style?: string;
    source?: string;
  }) {
    const note = await this.prisma.xhsNote.create({
      data: {
        userId,
        title: data.title,
        content: data.content,
        coverImage: data.coverImage,
        images: data.images ? JSON.stringify(data.images) : null,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        villaId: data.villaId || null,
        style: data.style || 'plant',
        source: data.source || 'original',
      },
    });
    return { id: Number(note.id) };
  }

  // ==================== 商家端 ====================

  /** 商家笔记列表 */
  async adminList(ctx: AdminContext, page = 1, pageSize = 10, status?: number) {
    const where: any = {};
    if (ctx.role === 'merchant') {
      where.merchantId = ctx.merchantId;
    }
    if (status !== undefined) where.status = status;

    const [list, total] = await Promise.all([
      this.prisma.xhsNote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          villa: { select: { id: true, name: true } },
          user: { select: { nickname: true } },
        },
      }),
      this.prisma.xhsNote.count({ where }),
    ]);

    return {
      list: list.map((n) => this.format(n)),
      total,
      page,
      pageSize,
    };
  }

  /** 商家发布笔记 */
  async adminCreate(ctx: AdminContext, data: {
    title: string;
    content: string;
    coverImage: string;
    images?: string[];
    tags?: string[];
    villaId?: number;
    style?: string;
    source?: string;
    status?: number;
  }) {
    const note = await this.prisma.xhsNote.create({
      data: {
        merchantId: ctx.merchantId,
        title: data.title,
        content: data.content,
        coverImage: data.coverImage,
        images: data.images ? JSON.stringify(data.images) : null,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        villaId: data.villaId || null,
        style: data.style || 'plant',
        source: data.source || 'original',
        status: data.status ?? 1,
      },
    });
    return { id: Number(note.id) };
  }

  /** 商家编辑笔记 */
  async adminUpdate(ctx: AdminContext, id: number, data: any) {
    await this.ensureAccess(ctx, id);
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.images !== undefined) updateData.images = JSON.stringify(data.images);
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);
    if (data.villaId !== undefined) updateData.villaId = data.villaId || null;
    if (data.style !== undefined) updateData.style = data.style;
    if (data.status !== undefined) updateData.status = data.status;

    await this.prisma.xhsNote.update({ where: { id }, data: updateData });
    return { success: true };
  }

  /** 商家删除笔记 */
  async adminDelete(ctx: AdminContext, id: number) {
    await this.ensureAccess(ctx, id);
    await this.prisma.xhsNote.delete({ where: { id } });
    return { success: true };
  }

  // ==================== 私有方法 ====================

  private async toggleInteraction(noteId: number, userId: number, type: string) {
    const existing = await this.prisma.xhsNoteInteraction.findUnique({
      where: { noteId_userId_type: { noteId, userId, type } },
    });

    const countField = type === 'like' ? 'likeCount' : 'collectCount';

    if (existing) {
      await this.prisma.xhsNoteInteraction.delete({
        where: { noteId_userId_type: { noteId, userId, type } },
      });
      await this.prisma.xhsNote.update({
        where: { id: noteId },
        data: { [countField]: { decrement: 1 } },
      });
      return { [type + 'd']: false };
    } else {
      await this.prisma.xhsNoteInteraction.create({
        data: { noteId, userId, type },
      });
      await this.prisma.xhsNote.update({
        where: { id: noteId },
        data: { [countField]: { increment: 1 } },
      });
      return { [type + 'd']: true };
    }
  }

  private async ensureAccess(ctx: AdminContext, noteId: number) {
    const note = await this.prisma.xhsNote.findUnique({ where: { id: noteId } });
    if (!note) throw new NotFoundException('笔记不存在');
    if (ctx.role === 'merchant' && Number(note.merchantId) !== ctx.merchantId) {
      throw new ForbiddenException('无权操作');
    }
  }

  private format(note: any) {
    return {
      ...note,
      id: Number(note.id),
      userId: note.userId ? Number(note.userId) : null,
      merchantId: note.merchantId ? Number(note.merchantId) : null,
      villaId: note.villaId ? Number(note.villaId) : null,
      images: note.images ? JSON.parse(note.images) : [],
      tags: note.tags ? JSON.parse(note.tags) : [],
      villa: note.villa ? { ...note.villa, id: Number(note.villa.id) } : null,
    };
  }
}
