import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/membership')
export class MembershipController {
  constructor(private membershipService: MembershipService) {}

  /** 会员中心 */
  @Get('me')
  async me(@CurrentUser('sub') userId: number) {
    return this.membershipService.getMine(userId);
  }

  /** 成长值流水 */
  @Get('growth-logs')
  async logs(
    @CurrentUser('sub') userId: number,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.membershipService.getGrowthLogs(
      userId,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 20,
    );
  }

  /** 设置生日 */
  @Post('birthday')
  async birthday(
    @CurrentUser('sub') userId: number,
    @Body('birthday') birthday: string,
  ) {
    return this.membershipService.setBirthday(userId, birthday);
  }
}
