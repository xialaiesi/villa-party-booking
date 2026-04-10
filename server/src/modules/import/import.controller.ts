import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ImportService } from './import.service';

const fileFilter = (_req: any, file: any, cb: any) => {
  if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname)) {
    return cb(new BadRequestException('只支持图片格式'), false);
  }
  cb(null, true);
};

@Controller('api/admin/import')
export class ImportController {
  constructor(private service: ImportService) {}

  /** 从文案文本导入别墅信息 */
  @Post('text')
  async importFromText(@Body('text') text: string) {
    return this.service.importFromText(text);
  }

  /** 从 URL 导入别墅信息 */
  @Post('url')
  async importFromUrl(
    @Body('url') url: string,
    @Body('useAi') useAi?: boolean,
  ) {
    return this.service.importFromUrl(url, useAi !== false);
  }

  /**
   * 批量上传图片 → AI 分析 → 生成别墅信息
   *
   * 请求：multipart/form-data，字段名 images，最多 30 张
   * 返回：{ images[], coverImage, villa: {...}, stats }
   */
  @Post('images')
  @UseInterceptors(
    FilesInterceptor('images', 30, {
      storage: memoryStorage(),
      fileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async importFromImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) throw new BadRequestException('请上传至少一张图片');
    return this.service.importFromImages(files);
  }
}
