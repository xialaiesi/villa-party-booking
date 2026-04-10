import { Controller, Get, Post, Param, Query, Req, ParseIntPipe } from '@nestjs/common';
import { AdminMessageService } from './admin-message.service';

@Controller('api/admin/messages')
export class AdminMessageController {
  constructor(private service: AdminMessageService) {}

  @Get()
  async list(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const merchantId = req.user?.merchantId;
    return this.service.list(merchantId, req.user?.sub, parseInt(page || '1'), parseInt(pageSize || '20'));
  }

  @Get('unread-count')
  async unreadCount(@Req() req: any) {
    const count = await this.service.unreadCount(req.user?.merchantId);
    return { count };
  }

  @Post(':id/read')
  async markRead(@Param('id', ParseIntPipe) id: number) {
    await this.service.markRead(id);
    return { success: true };
  }

  @Post('read-all')
  async markAllRead(@Req() req: any) {
    await this.service.markAllRead(req.user?.merchantId);
    return { success: true };
  }
}
