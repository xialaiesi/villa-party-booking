import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  /** 进入/创建订单会话 */
  @Get('order/:orderId')
  async getChat(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser('sub') userId: number,
  ) {
    return this.chatService.getOrCreateByOrder(userId, orderId);
  }

  /** 拉取消息 */
  @Get('order/:orderId/messages')
  async getMessages(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser('sub') userId: number,
  ) {
    return this.chatService.getMessages(userId, orderId);
  }

  /** 未读数 */
  @Get('order/:orderId/unread')
  async unread(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser('sub') userId: number,
  ) {
    return this.chatService.userUnreadCount(userId, orderId);
  }

  /** 发送消息 */
  @Post('order/:orderId/messages')
  async send(
    @Param('orderId', ParseIntPipe) orderId: number,
    @CurrentUser('sub') userId: number,
    @Body('content') content: string,
    @Body('type') type?: string,
  ) {
    return this.chatService.sendByUser(userId, orderId, content, type || 'text');
  }
}
