import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { AlbumService } from './album.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api')
export class AlbumController {
  constructor(private service: AlbumService) {}

  /** 管理后台：相册列表 */
  @Get('admin/albums')
  async adminList(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const merchantId = req.user?.role === 'merchant' ? req.user.merchantId : undefined;
    return this.service.findAll(merchantId, parseInt(page || '1'), parseInt(pageSize || '20'));
  }

  /** 管理后台：相册详情 */
  @Get('admin/albums/:id')
  async adminDetail(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  /** 管理后台：开启/关闭相册 */
  @Put('admin/albums/:id/status')
  async adminUpdateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: number,
  ) {
    return this.service.updateStatus(id, status);
  }

  /** 创建聚会相册 */
  @Post('albums')
  async create(
    @CurrentUser('sub') userId: number,
    @Body() data: { orderId: number; title?: string },
  ) {
    return this.service.create(userId, data);
  }

  /** 我的相册列表 */
  @Get('albums/mine')
  async myAlbums(@CurrentUser('sub') userId: number) {
    return this.service.findByUser(userId);
  }

  /** 通过邀请码查看相册（公开） */
  @Public()
  @Get('albums/invite/:code')
  async findByCode(@Param('code') code: string) {
    return this.service.findByInviteCode(code);
  }

  /** 相册详情 */
  @Get('albums/:id')
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  /** 上传照片 */
  @Post('albums/:id/photos')
  async addPhoto(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
    @Body() data: { url: string; caption?: string },
  ) {
    return this.service.addPhoto(id, userId, data);
  }

  /** 获取相册评论 */
  @Public()
  @Get('albums/:id/comments')
  async getComments(
    @Param('id', ParseIntPipe) id: number,
    @Query('photoId') photoId?: string,
  ) {
    return this.service.getComments(id, photoId ? parseInt(photoId) : undefined);
  }

  /** 发表评论 */
  @Post('albums/:id/comments')
  async addComment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
    @Body() data: { content: string; photoId?: number; parentId?: number },
  ) {
    return this.service.addComment(id, userId, data);
  }

  /** 删除评论 */
  @Delete('albums/comments/:commentId')
  async deleteComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @CurrentUser('sub') userId: number,
  ) {
    return this.service.deleteComment(commentId, userId);
  }

  /** 删除照片 */
  @Delete('albums/photos/:photoId')
  async removePhoto(
    @Param('photoId', ParseIntPipe) photoId: number,
    @CurrentUser('sub') userId: number,
  ) {
    return this.service.removePhoto(photoId, userId);
  }
}
