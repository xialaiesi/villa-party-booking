import { Controller, Post, Get, Put, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('wx-login')
  async wxLogin(@Body('code') code: string) {
    return this.authService.wxLogin(code);
  }

  @Get('profile')
  async getProfile(@CurrentUser('sub') userId: number) {
    return this.authService.getProfile(userId);
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser('sub') userId: number,
    @Body() data: { nickname?: string; avatar?: string; phone?: string },
  ) {
    return this.authService.updateProfile(userId, data);
  }
}
