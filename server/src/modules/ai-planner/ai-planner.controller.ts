import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { AiPlannerService } from './ai-planner.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/ai-planner')
export class AiPlannerController {
  constructor(private service: AiPlannerService) {}

  /** 创建新对话 */
  @Post('sessions')
  async createSession(@CurrentUser('sub') userId: number) {
    return this.service.createSession(userId);
  }

  /** 我的对话列表 */
  @Get('sessions')
  async sessions(@CurrentUser('sub') userId: number) {
    return this.service.getSessions(userId);
  }

  /** 对话历史 */
  @Get('sessions/:id/messages')
  async messages(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') userId: number) {
    return this.service.getMessages(id, userId);
  }

  /** 发送消息 */
  @Post('sessions/:id/chat')
  async chat(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
    @Body('message') message: string,
  ) {
    return this.service.chat(id, userId, message);
  }
}
