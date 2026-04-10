import { Controller, Get, Put, Body, Req } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { SiteConfigService } from './site-config.service';

@Controller('api')
export class SiteConfigController {
  constructor(private service: SiteConfigService) {}

  /** 前台公开接口：获取站点配置 */
  @Public()
  @Get('site-config')
  async getPublic() {
    return this.service.getAll();
  }

  /** 管理后台：获取当前商家配置 */
  @Get('admin/site-config')
  async getAdmin(@Req() req: any) {
    const merchantId = req.user?.merchantId;
    return this.service.getAll(merchantId);
  }

  /** 管理后台：批量保存配置 */
  @Put('admin/site-config')
  async save(@Req() req: any, @Body() body: Record<string, string>) {
    // 平台超管取第一个商家，商家角色取自己的
    let merchantId = req.user?.merchantId;
    if (!merchantId) {
      const first = await this.service.getAll();
      merchantId = 1; // fallback
    }
    return this.service.saveAll(merchantId, body);
  }
}
