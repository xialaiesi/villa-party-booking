import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('api/admin/ai')
export class AiController {
  constructor(private aiService: AiService) {}

  /**
   * 分析图片：自动分类、排序、选封面
   */
  @Post('analyze-images')
  async analyzeImages(@Body('imageUrls') imageUrls: string[]) {
    return this.aiService.analyzeImages(imageUrls);
  }

  /**
   * 生成别墅描述
   */
  @Post('generate-description')
  async generateDescription(
    @Body()
    body: {
      name: string;
      address?: string;
      maxGuests: number;
      bedrooms: number;
      area?: number;
      facilities?: string[];
    },
  ) {
    const description = await this.aiService.generateDescription(body);
    return { description };
  }

  /**
   * 一键处理：分析图片 + 排版 + 生成描述
   */
  @Post('process-villa')
  async processVilla(
    @Body()
    body: {
      name: string;
      address?: string;
      maxGuests: number;
      bedrooms: number;
      area?: number;
      facilities?: string[];
      imageUrls: string[];
    },
  ) {
    return this.aiService.processVilla(body);
  }
}
