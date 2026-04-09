import { Controller, Post, Body } from '@nestjs/common';
import { SmartRecommendService } from './smart-recommend.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/smart-recommend')
export class SmartRecommendController {
  constructor(private service: SmartRecommendService) {}

  @Public()
  @Post()
  async recommend(@Body('query') query: string) {
    return this.service.recommend(query);
  }
}
