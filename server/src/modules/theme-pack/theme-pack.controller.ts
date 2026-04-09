import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ThemePackService } from './theme-pack.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/theme-packs')
export class ThemePackController {
  constructor(private service: ThemePackService) {}

  @Public()
  @Get()
  async list(@Query('theme') theme?: string) {
    return this.service.findAll(theme);
  }

  @Public()
  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }
}
