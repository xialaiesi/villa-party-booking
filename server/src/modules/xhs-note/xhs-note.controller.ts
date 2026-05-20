import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { XhsNoteService } from './xhs-note.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminCtx } from '../../common/decorators/admin-context.decorator';
import type { AdminContext } from '../../common/types/admin-context';

@Controller('api')
export class XhsNoteController {
  constructor(private service: XhsNoteService) {}

  // ==================== C 端 ====================

  @Public()
  @Get('xhs-notes')
  async feed(
    @Query('page') page?: string,
    @Query('pageSize') ps?: string,
    @Query('villaId') villaId?: string,
    @Query('style') style?: string,
  ) {
    return this.service.feed(
      page ? parseInt(page) : 1,
      ps ? parseInt(ps) : 10,
      villaId ? parseInt(villaId) : undefined,
      style,
    );
  }

  @Public()
  @Get('xhs-notes/:id')
  async getNote(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId?: number,
  ) {
    return this.service.getNote(id, userId);
  }

  @Post('xhs-notes')
  async createNote(@CurrentUser('sub') userId: number, @Body() data: any) {
    return this.service.createNote(userId, data);
  }

  @Post('xhs-notes/:id/like')
  async like(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') userId: number) {
    return this.service.toggleLike(id, userId);
  }

  @Post('xhs-notes/:id/collect')
  async collect(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') userId: number) {
    return this.service.toggleCollect(id, userId);
  }

  @Post('xhs-notes/:id/comment')
  async comment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
    @Body() data: { content: string; parentId?: number },
  ) {
    return this.service.addComment(id, userId, data.content, data.parentId);
  }

  // ==================== 商家端 ====================

  @Get('admin/xhs-notes')
  async adminList(
    @AdminCtx() ctx: AdminContext,
    @Query('page') page?: string,
    @Query('pageSize') ps?: string,
    @Query('status') status?: string,
  ) {
    return this.service.adminList(
      ctx,
      page ? parseInt(page) : 1,
      ps ? parseInt(ps) : 10,
      status !== undefined ? parseInt(status) : undefined,
    );
  }

  @Post('admin/xhs-notes')
  async adminCreate(@AdminCtx() ctx: AdminContext, @Body() data: any) {
    return this.service.adminCreate(ctx, data);
  }

  @Put('admin/xhs-notes/:id')
  async adminUpdate(
    @AdminCtx() ctx: AdminContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.service.adminUpdate(ctx, id, data);
  }

  @Delete('admin/xhs-notes/:id')
  async adminDelete(
    @AdminCtx() ctx: AdminContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.adminDelete(ctx, id);
  }
}
