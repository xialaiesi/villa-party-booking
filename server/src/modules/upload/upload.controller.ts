import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Public } from '../../common/decorators/public.decorator';
import { CosService } from '../../common/cos/cos.service';

const fileFilter = (_req: any, file: any, cb: any) => {
  if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname)) {
    return cb(new BadRequestException('只支持图片格式'), false);
  }
  cb(null, true);
};

// 使用内存存储，再上传到 COS
const storage = memoryStorage();

@Controller('api/upload')
export class UploadController {
  constructor(private readonly cosService: CosService) {}

  /** 上传单张图片 */
  @Public()
  @Post()
  @UseInterceptors(
    FileInterceptor('file', { storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('未上传文件');
    const url = await this.cosService.uploadFile(file);
    return { url, filename: file.originalname, size: file.size };
  }

  /** 批量上传图片 */
  @Public()
  @Post('batch')
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage,
      fileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadBatch(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) throw new BadRequestException('未上传文件');
    const urls = await Promise.all(
      files.map((f) => this.cosService.uploadFile(f)),
    );
    return urls.map((url, i) => ({
      url,
      filename: files[i].originalname,
      size: files[i].size,
    }));
  }
}
