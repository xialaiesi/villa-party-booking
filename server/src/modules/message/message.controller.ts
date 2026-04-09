import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/messages')
export class MessageController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser('sub') userId: number) {
    const messages = await this.prisma.userMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return messages.map((m) => ({
      id: Number(m.id),
      type: m.type,
      title: m.title,
      content: m.content,
      link: m.link,
      read: !!m.readAt,
      createdAt: m.createdAt,
    }));
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser('sub') userId: number) {
    const count = await this.prisma.userMessage.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  @Post(':id/read')
  async read(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.prisma.userMessage.updateMany({
      where: { id, userId },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  @Post('read-all')
  async readAll(@CurrentUser('sub') userId: number) {
    await this.prisma.userMessage.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }
}
