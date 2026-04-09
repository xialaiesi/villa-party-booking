import { Controller, Post, Body } from '@nestjs/common';
import { ImportService } from './import.service';

@Controller('api/admin/import')
export class ImportController {
  constructor(private service: ImportService) {}

  /** 从 URL 导入别墅信息 */
  @Post('url')
  async importFromUrl(
    @Body('url') url: string,
    @Body('useAi') useAi?: boolean,
  ) {
    return this.service.importFromUrl(url, useAi !== false);
  }
}
