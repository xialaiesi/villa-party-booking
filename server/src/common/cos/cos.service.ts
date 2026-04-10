import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import COS from 'cos-nodejs-sdk-v5';
import { extname } from 'path';

@Injectable()
export class CosService {
  private cos: any;
  private bucket: string;
  private region: string;
  private domain: string;
  private readonly logger = new Logger(CosService.name);

  constructor(private config: ConfigService) {
    const secretId = this.config.get<string>('COS_SECRET_ID');
    const secretKey = this.config.get<string>('COS_SECRET_KEY');
    this.bucket = this.config.get<string>('COS_BUCKET') || '';
    this.region = this.config.get<string>('COS_REGION') || 'ap-guangzhou';
    this.domain =
      this.config.get<string>('COS_DOMAIN') ||
      `https://${this.bucket}.cos.${this.region}.myqcloud.com`;

    if (secretId && secretKey) {
      this.cos = new (COS as any)({ SecretId: secretId, SecretKey: secretKey });
      this.logger.log(`COS 初始化完成: ${this.bucket} @ ${this.region}`);
    } else {
      this.logger.warn('COS 凭证未配置，上传功能不可用');
    }
  }

  /** 是否已配置 */
  isEnabled(): boolean {
    return !!this.cos && !!this.bucket;
  }

  /** 生成随机文件名 */
  private genFilename(originalName: string, prefix = 'img'): string {
    const ext = extname(originalName) || '.jpg';
    const random = Date.now() + '-' + Math.random().toString(36).slice(2, 10);
    return `${prefix}/${random}${ext.toLowerCase()}`;
  }

  /**
   * 上传 Buffer 到 COS
   * @returns 公开访问 URL
   */
  async uploadBuffer(
    buffer: Buffer,
    originalName: string,
    prefix = 'img',
  ): Promise<string> {
    if (!this.isEnabled()) {
      throw new Error('COS 未配置');
    }

    const key = this.genFilename(originalName, prefix);

    return new Promise((resolve, reject) => {
      this.cos.putObject(
        {
          Bucket: this.bucket,
          Region: this.region,
          Key: key,
          Body: buffer,
        },
        (err: any, data: any) => {
          if (err) {
            this.logger.error(`上传失败: ${err.message}`);
            reject(err);
            return;
          }
          // 返回完整的 URL
          resolve(`${this.domain}/${key}`);
        },
      );
    });
  }

  /** 上传 Express.Multer.File */
  async uploadFile(file: Express.Multer.File, prefix = 'img'): Promise<string> {
    return this.uploadBuffer(file.buffer, file.originalname, prefix);
  }

  /** 删除文件 */
  async deleteFile(url: string): Promise<void> {
    if (!this.isEnabled()) return;
    const key = this.urlToKey(url);
    if (!key) return;

    return new Promise((resolve, reject) => {
      this.cos.deleteObject(
        { Bucket: this.bucket, Region: this.region, Key: key },
        (err: any) => {
          if (err) reject(err);
          else resolve();
        },
      );
    });
  }

  /** 从完整 URL 提取 key */
  private urlToKey(url: string): string | null {
    if (!url) return null;
    if (url.startsWith(this.domain)) {
      return url.slice(this.domain.length + 1);
    }
    return null;
  }

  /** 获取 bucket 访问域名 */
  getDomain(): string {
    return this.domain;
  }
}
