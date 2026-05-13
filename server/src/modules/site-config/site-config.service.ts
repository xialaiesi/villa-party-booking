import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** 默认站点配置 */
const DEFAULTS: Record<string, string> = {
  hero_title: '找到你的完美别墅趴场地',
  hero_subtitle: '团建 · 生日 · 聚会 · 亲子 · 一站式解决',
  hero_bg: 'linear-gradient(135deg, #ff6b35, #ff8f65)',
  hero_image: '',
  hero_video: '',
  banners: '[]',
  scene_tags: '["团建聚会","生日派对","朋友聚会","亲子活动","毕业趴","闺蜜趴"]',
  footer_text: '',
  // 落地页配置
  landing_hero_video: '',
  landing_hero_image: '',
  landing_hero_title: '周末，来一场忘不了的别墅趴',
  landing_hero_subtitle: '',
  landing_city: '深圳',
  landing_wechat_qr: '',
  landing_wechat_id: 'villa_service',
  landing_phone: '400-888-8888',
};

@Injectable()
export class SiteConfigService {
  constructor(private prisma: PrismaService) {}

  /** 获取某商家的全部站点配置（合并默认值）*/
  async getAll(merchantId?: number) {
    // 取第一个商家（单商家模式）或指定商家
    const mid = merchantId
      ? BigInt(merchantId)
      : (await this.prisma.merchant.findFirst({ where: { status: 1 }, orderBy: { id: 'asc' } }))?.id;

    if (!mid) return { ...DEFAULTS };

    const rows = await this.prisma.siteConfig.findMany({
      where: { merchantId: mid },
    });

    const result = { ...DEFAULTS };
    for (const row of rows) {
      result[row.configKey] = row.configVal;
    }
    return result;
  }

  /** 获取单个配置 */
  async get(merchantId: number, key: string): Promise<string> {
    const row = await this.prisma.siteConfig.findUnique({
      where: { merchantId_configKey: { merchantId: BigInt(merchantId), configKey: key } },
    });
    return row?.configVal ?? DEFAULTS[key] ?? '';
  }

  /** 批量保存配置 */
  async saveAll(merchantId: number, configs: Record<string, string>) {
    const mid = BigInt(merchantId);
    const ops = Object.entries(configs).map(([key, val]) =>
      this.prisma.siteConfig.upsert({
        where: { merchantId_configKey: { merchantId: mid, configKey: key } },
        create: { merchantId: mid, configKey: key, configVal: val },
        update: { configVal: val },
      }),
    );
    await this.prisma.$transaction(ops);
    return this.getAll(merchantId);
  }
}
