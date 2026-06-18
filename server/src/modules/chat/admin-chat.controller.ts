import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AdminCtx } from '../../common/decorators/admin-context.decorator';

@Controller('api/admin/chat')
export class AdminChatController {
  constructor(private chatService: ChatService) {}

  /** 会话列表 */
  @Get()
  async list(@AdminCtx() ctx: any) {
    return this.chatService.listForAdmin(ctx);
  }

  /** 未读会话数 */
  @Get('unread-count')
  async unreadCount(@AdminCtx() ctx: any) {
    return this.chatService.adminUnreadCount(ctx);
  }

  /** 快捷回复话术 */
  @Get('faq')
  async faq() {
    return this.chatService.faq();
  }

  /** 拉取消息 */
  @Get(':chatId/messages')
  async messages(
    @AdminCtx() ctx: any,
    @Param('chatId', ParseIntPipe) chatId: number,
  ) {
    return this.chatService.getMessagesAdmin(ctx, chatId);
  }

  /** 发送消息 */
  @Post(':chatId/messages')
  async send(
    @AdminCtx() ctx: any,
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body('content') content: string,
    @Body('type') type?: string,
  ) {
    return this.chatService.sendByMerchant(ctx, chatId, content, type || 'text');
  }
}
