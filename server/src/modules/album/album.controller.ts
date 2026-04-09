import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { AlbumService } from './album.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/albums')
export class AlbumController {
  constructor(private service: AlbumService) {}

  /** 创建聚会相册 */
  @Post()
  async create(
    @CurrentUser('sub') userId: number,
    @Body() data: { orderId: number; title?: string },
  ) {
    return this.service.create(userId, data);
  }

  /** 我的相册列表 */
  @Get('mine')
  async myAlbums(@CurrentUser('sub') userId: number) {
    return this.service.findByUser(userId);
  }

  /** 通过邀请码查看相册（公开） */
  @Public()
  @Get('invite/:code')
  async findByCode(@Param('code') code: string) {
    return this.service.findByInviteCode(code);
  }

  /** 相册详情 */
  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  /** 上传照片 */
  @Post(':id/photos')
  async addPhoto(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('sub') userId: number,
    @Body() data: { url: string; caption?: string },
  ) {
    return this.service.addPhoto(id, userId, data);
  }

  /** 删除照片 */
  @Delete('photos/:photoId')
  async removePhoto(
    @Param('photoId', ParseIntPipe) photoId: number,
    @CurrentUser('sub') userId: number,
  ) {
    return this.service.removePhoto(photoId, userId);
  }
}
