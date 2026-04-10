/**
 * 把 server/uploads/ 下的图片批量上传到腾讯云 COS
 * 并更新数据库里的 URL 引用
 *
 * 运行: npx ts-node --skip-project scripts/migrate-uploads-to-cos.ts
 */
import 'dotenv/config';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import COS from 'cos-nodejs-sdk-v5';

const UPLOAD_DIR = 'uploads';

async function main() {
  // 1. 初始化 COS
  const secretId = process.env.COS_SECRET_ID;
  const secretKey = process.env.COS_SECRET_KEY;
  const bucket = process.env.COS_BUCKET;
  const region = process.env.COS_REGION || 'ap-guangzhou';
  const domain =
    process.env.COS_DOMAIN ||
    `https://${bucket}.cos.${region}.myqcloud.com`;

  if (!secretId || !secretKey || !bucket) {
    console.error('❌ 请先在 .env 配置 COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET');
    process.exit(1);
  }

  const cos = new (COS as any)({ SecretId: secretId, SecretKey: secretKey });

  // 2. 初始化 Prisma
  const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter } as any);

  // 3. 读取本地 uploads 目录
  if (!existsSync(UPLOAD_DIR)) {
    console.log('ℹ️  uploads 目录不存在，无需迁移');
    return;
  }

  const files = readdirSync(UPLOAD_DIR).filter((f) =>
    /\.(jpg|jpeg|png|webp|gif)$/i.test(f),
  );

  if (files.length === 0) {
    console.log('ℹ️  uploads 目录为空，无需迁移');
    return;
  }

  console.log(`📦 发现 ${files.length} 个图片文件，开始迁移...\n`);

  // 4. URL 映射表：/uploads/xxx.webp → https://cos.../villa/xxx.webp
  const urlMap: Record<string, string> = {};
  let uploadedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const localPath = `/uploads/${file}`;
    const filepath = join(UPLOAD_DIR, file);
    const buffer = readFileSync(filepath);
    const ext = extname(file) || '.jpg';
    const key = `villa/${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext.toLowerCase()}`;

    try {
      await new Promise<void>((resolve, reject) => {
        cos.putObject(
          {
            Bucket: bucket,
            Region: region,
            Key: key,
            Body: buffer,
          },
          (err: any) => {
            if (err) reject(err);
            else resolve();
          },
        );
      });

      const cosUrl = `${domain}/${key}`;
      urlMap[localPath] = cosUrl;
      uploadedCount++;
      process.stdout.write(`\r✅ 已上传 ${uploadedCount}/${files.length}`);
    } catch (e: any) {
      console.error(`\n❌ ${file} 上传失败: ${e.message}`);
      skippedCount++;
    }
  }

  console.log(`\n\n📤 上传完成：成功 ${uploadedCount}，失败 ${skippedCount}\n`);
  console.log('🔄 开始更新数据库...\n');

  // 5. 更新数据库里的 URL 引用
  let updatedRows = 0;

  // 5.1 villa.coverImage
  for (const [localUrl, cosUrl] of Object.entries(urlMap)) {
    const r = await prisma.villa.updateMany({
      where: { coverImage: localUrl },
      data: { coverImage: cosUrl },
    });
    updatedRows += r.count;
  }
  console.log(`villa.coverImage 更新完成`);

  // 5.2 villa_image.url
  for (const [localUrl, cosUrl] of Object.entries(urlMap)) {
    const r = await prisma.villaImage.updateMany({
      where: { url: localUrl },
      data: { url: cosUrl },
    });
    updatedRows += r.count;
  }
  console.log(`villa_image.url 更新完成`);

  // 5.3 activity_plan.coverImage
  for (const [localUrl, cosUrl] of Object.entries(urlMap)) {
    const r = await prisma.activityPlan.updateMany({
      where: { coverImage: localUrl },
      data: { coverImage: cosUrl },
    });
    updatedRows += r.count;
  }

  // 5.4 theme_pack.coverImage
  for (const [localUrl, cosUrl] of Object.entries(urlMap)) {
    const r = await prisma.themePack.updateMany({
      where: { coverImage: localUrl },
      data: { coverImage: cosUrl },
    });
    updatedRows += r.count;
  }

  // 5.5 local_service.coverImage
  for (const [localUrl, cosUrl] of Object.entries(urlMap)) {
    const r = await prisma.localService.updateMany({
      where: { coverImage: localUrl },
      data: { coverImage: cosUrl },
    });
    updatedRows += r.count;
  }

  // 5.6 seasonal_event.coverImage
  for (const [localUrl, cosUrl] of Object.entries(urlMap)) {
    const r = await prisma.seasonalEvent.updateMany({
      where: { coverImage: localUrl },
      data: { coverImage: cosUrl },
    });
    updatedRows += r.count;
  }

  // 5.7 merchant.logo
  for (const [localUrl, cosUrl] of Object.entries(urlMap)) {
    const r = await prisma.merchant.updateMany({
      where: { logo: localUrl },
      data: { logo: cosUrl },
    });
    updatedRows += r.count;
  }

  // 5.8 album_photo.url
  for (const [localUrl, cosUrl] of Object.entries(urlMap)) {
    const r = await prisma.albumPhoto.updateMany({
      where: { url: localUrl },
      data: { url: cosUrl },
    });
    updatedRows += r.count;
  }

  // 5.9 user.avatar
  for (const [localUrl, cosUrl] of Object.entries(urlMap)) {
    const r = await prisma.user.updateMany({
      where: { avatar: localUrl },
      data: { avatar: cosUrl },
    });
    updatedRows += r.count;
  }

  console.log(`\n✨ 迁移完成！`);
  console.log(`   图片上传: ${uploadedCount}`);
  console.log(`   数据库更新: ${updatedRows} 条记录`);
  console.log(`\n💡 建议检查小程序/管理后台显示正常后，删除 server/uploads/ 下的本地文件释放空间。`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('迁移失败:', e);
  process.exit(1);
});
