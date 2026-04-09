import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Public } from '../../common/decorators/public.decorator';

const UPLOAD_DIR = 'uploads';

// 确保目录存在
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const randomName = Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    cb(null, randomName + extname(file.originalname));
  },
});

const fileFilter = (_req: any, file: any, cb: any) => {
  if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname)) {
    return cb(new BadRequestException('只支持图片格式'), false);
  }
  cb(null, true);
};

@Controller('api/upload')
export class UploadController {
  /** 上传单张图片 */
  @Public()
  @Post()
  @UseInterceptors(
    FileInterceptor('file', { storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('未上传文件');
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size,
    };
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
    return files.map((f) => ({
      url: `/uploads/${f.filename}`,
      filename: f.filename,
      size: f.size,
    }));
  }
}
