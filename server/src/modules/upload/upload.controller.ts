import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Public } from '../../common/decorators/public.decorator';
import { CosService } from '../../common/cos/cos.service';

const imageFilter = (_req: any, file: any, cb: any) => {
  if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname)) {
    return cb(new BadRequestException('只支持图片格式'), false);
  }
  cb(null, true);
};

const videoFilter = (_req: any, file: any, cb: any) => {
  if (!/\.(mp4|mov|avi)$/i.test(file.originalname)) {
    return cb(new BadRequestException('只支持视频格式 mp4/mov/avi'), false);
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
    FileInterceptor('file', { storage, fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } }),
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
      fileFilter: imageFilter,
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

  /** 上传视频 */
  @Public()
  @Post('video')
  @UseInterceptors(
    FileInterceptor('file', { storage, fileFilter: videoFilter, limits: { fileSize: 100 * 1024 * 1024 } }),
  )
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('未上传文件');
    const url = await this.cosService.uploadFile(file, 'video');
    // 返回视频 URL 和时长（由前端获取后回调更新）
    return { url, filename: file.originalname, size: file.size };
  }

  /** 生成视频封面 */
  @Public()
  @Post('video/cover')
  async generateCover(@Body() body: { videoUrl: string }) {
    if (!body.videoUrl) throw new BadRequestException('缺少视频地址');
    // 封面生成依赖腾讯云数据万象或本地 FFmpeg，这里返回占位
    // 实际实现：使用 COS 智能处理 / 手动 FFmpeg 截图
    return { cover: null, message: '封面将在审核后自动生成' };
  }
}
