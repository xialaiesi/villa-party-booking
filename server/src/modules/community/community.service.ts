import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  /** 信息流：分页获取帖子 */
  async feed(page = 1, pageSize = 10, villaId?: number) {
    const where: any = { status: 1 };
    if (villaId) where.villaId = villaId;

    const [list, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { nickname: true, avatar: true } },
          villa: { select: { name: true } },
          _count: { select: { comments: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      list: list.map((p) => ({
        ...p,
        id: Number(p.id),
        userId: Number(p.userId),
        images: p.images ? JSON.parse(p.images) : [],
        commentCount: (p as any)._count?.comments || 0,
      })),
      total, page, pageSize,
    };
  }

  /** 发布帖子（可从趴后回忆一键发布） */
  async createPost(userId: number, data: { content: string; images?: string[]; villaId?: number; albumId?: number; tags?: string }) {
    const post = await this.prisma.post.create({
      data: {
        userId,
        villaId: data.villaId,
        albumId: data.albumId,
        content: data.content,
        images: data.images ? JSON.stringify(data.images) : null,
        tags: data.tags,
      },
    });
    return { id: Number(post.id) };
  }

  /** 帖子详情 */
  async getPost(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id, status: 1 },
      include: {
        user: { select: { nickname: true, avatar: true } },
        villa: { select: { id: true, name: true, coverImage: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { nickname: true, avatar: true } } },
        },
      },
    });
    if (!post) throw new NotFoundException('帖子不存在');
    return {
      ...post,
      id: Number(post.id),
      images: post.images ? JSON.parse(post.images) : [],
      comments: post.comments.map((c) => ({ ...c, id: Number(c.id), userId: Number(c.userId) })),
    };
  }

  /** 评论 */
  async addComment(postId: number, userId: number, content: string) {
    const comment = await this.prisma.postComment.create({
      data: { postId, userId, content },
    });
    return { id: Number(comment.id) };
  }

  /** 点赞/取消 */
  async toggleLike(postId: number, userId: number) {
    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.postLike.delete({ where: { postId_userId: { postId, userId } } });
      await this.prisma.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } });
      return { liked: false };
    } else {
      await this.prisma.postLike.create({ data: { postId, userId } });
      await this.prisma.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } });
      return { liked: true };
    }
  }
}
