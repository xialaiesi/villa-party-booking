import { Controller, Get, Post, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { CommunityService } from './community.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/community')
export class CommunityController {
  constructor(private service: CommunityService) {}

  @Public()
  @Get('feed')
  async feed(@Query('page') page?: string, @Query('pageSize') ps?: string, @Query('villaId') villaId?: string) {
    return this.service.feed(page ? parseInt(page) : 1, ps ? parseInt(ps) : 10, villaId ? parseInt(villaId) : undefined);
  }

  @Post('posts')
  async createPost(@CurrentUser('sub') userId: number, @Body() data: any) {
    return this.service.createPost(userId, data);
  }

  @Public()
  @Get('posts/:id')
  async getPost(@Param('id', ParseIntPipe) id: number) { return this.service.getPost(id); }

  @Post('posts/:id/comment')
  async comment(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') userId: number, @Body('content') content: string) {
    return this.service.addComment(id, userId, content);
  }

  @Post('posts/:id/like')
  async like(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') userId: number) {
    return this.service.toggleLike(id, userId);
  }
}
