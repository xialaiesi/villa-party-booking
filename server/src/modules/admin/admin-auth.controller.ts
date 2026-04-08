import { Controller, Post, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/admin/auth')
export class AdminAuthController {
  constructor(private adminService: AdminService) {}

  @Public()
  @Post('login')
  async login(
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.adminService.login(username, password);
  }
}
