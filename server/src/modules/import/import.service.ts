import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';

export interface ImportedData {
  title: string;
  description: string;
  rawText: string;
  images: string[];
  /** AI 提取的结构化字段 */
  structured?: {
    name?: string;
    address?: string;
    maxGuests?: number;
    bedrooms?: number;
    area?: number;
    basePrice?: number;
    weekendPrice?: number;
    deposit?: number;
    tags?: string;
    facilities?: string[];
    summary?: string;
  };
}

@Injectable()
export class ImportService {
  private client: OpenAI;
  private textModel: string;
  private readonly logger = new Logger(ImportService.name);

  constructor(config: ConfigService) {
    this.client = new OpenAI({
      baseURL: config.get('AI_BASE_URL'),
      apiKey: config.get('AI_API_KEY'),
    });
    this.textModel = config.get('AI_TEXT_MODEL', 'Qwen/Qwen3-8B');
  }

  /**
   * 从 URL 抓取页面内容并解析
   * 支持：简篇(jianpian.cn)、美篇、普通网页
   */
  async importFromUrl(url: string, useAi = true): Promise<ImportedData> {
    if (!url || !/^https?:\/\//.test(url)) {
      throw new BadRequestException('无效的 URL');
    }

    let html: string;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      if (!res.ok) throw new BadRequestException(`抓取失败: HTTP ${res.status}`);
      html = await res.text();
    } catch (e: any) {
      this.logger.error(`抓取失败: ${e.message}`);
      throw new BadRequestException(`抓取页面失败: ${e.message}`);
    }

    const parsed = this.parseHtml(html);

    // 使用 AI 提取结构化数据
    let aiSuccess = false;
    if (useAi && parsed.rawText) {
      try {
        parsed.structured = await this.extractStructured(parsed.title, parsed.rawText);
        if (parsed.structured && Object.keys(parsed.structured).length > 0) {
          aiSuccess = true;
        }
      } catch (e: any) {
        this.logger.warn(`AI 提取失败: ${e.message}`);
      }
    }

    // AI 失败则使用简单规则提取
    if (!aiSuccess) {
      parsed.structured = this.simpleExtract(parsed.title, parsed.rawText);
    }

    return parsed;
  }

  /** 通用 HTML 解析：提取标题、描述、正文、图片 */
  private parseHtml(html: string): ImportedData {
    const $ = cheerio.load(html);

    // 标题
    const title =
      $('title').text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      $('h1').first().text().trim() ||
      '';

    // 描述（meta description）
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '';

    // 提取正文文本（去除脚本、样式）
    $('script, style, noscript').remove();
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

    // 提取图片
    const images = new Set<string>();

    // 1. 常规 img 标签
    $('img').each((_, el) => {
      const src =
        $(el).attr('src') ||
        $(el).attr('data-src') ||
        $(el).attr('data-original');
      if (src && this.isValidImage(src)) {
        images.add(this.resolveUrl(src));
      }
    });

    // 2. 样式中的 background-image（兼容转义）
    const styleMatches = html.matchAll(
      /background-image:\s*url\(&quot;?["']?(https?:\/\/[^"'&)\s]+)/gi,
    );
    for (const m of styleMatches) {
      if (this.isValidImage(m[1])) images.add(m[1]);
    }

    // 3. 兜底：所有出现的图片 URL
    const urlMatches = html.matchAll(
      /https?:\/\/[^\s"'<>()]+?\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>)]*)?/gi,
    );
    for (const m of urlMatches) {
      if (this.isValidImage(m[0])) images.add(m[0]);
    }

    // 4. og:image
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage && this.isValidImage(ogImage)) images.add(ogImage);

    // 过滤掉图标/头像等小图
    const filteredImages = Array.from(images).filter((url) => {
      const lower = url.toLowerCase();
      return (
        !lower.includes('icon') &&
        !lower.includes('avatar') &&
        !lower.includes('placeholder') &&
        !lower.includes('logo')
      );
    });

    return {
      title: title.slice(0, 100),
      description: description.slice(0, 500),
      rawText: bodyText.slice(0, 3000),
      images: filteredImages.slice(0, 20),
    };
  }

  /** 使用 AI 从正文中提取别墅结构化数据 */
  private async extractStructured(title: string, text: string) {
    const prompt = `你是别墅房源信息提取助手。从下面的文本中提取别墅信息，返回 JSON 格式。

标题：${title}

正文：${text}

请提取：
{
  "name": "别墅名称（简洁版）",
  "address": "地址（如果有）",
  "maxGuests": 可住人数（数字，未提到则估算或留空）,
  "bedrooms": 卧室数（数字，未提到则留空）,
  "area": 面积（平方米，数字，未提到则留空）,
  "basePrice": 平日价（数字，未提到则留空）,
  "weekendPrice": 周末价（数字，未提到则留空）,
  "deposit": 押金（数字，未提到则留空）,
  "tags": "标签（从团建/生日/聚会/亲子中选，逗号分隔）",
  "facilities": ["设施列表，如 泳池/KTV/烧烤/麻将/桌游/厨房/空调/WiFi 等"],
  "summary": "用 100 字内总结别墅卖点，吸引人预订的语气"
}

只返回 JSON 不要其他内容。未提到的字段值设为 null 或空数组。`;

    const response = await this.client.chat.completions.create({
      model: this.textModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '';
    if (!content) {
      throw new Error('AI 返回空内容');
    }
    return this.extractJson(content);
  }

  /** 不依赖 AI 的简单规则提取（兜底） */
  private simpleExtract(title: string, text: string) {
    const extract = (re: RegExp): number | undefined => {
      const m = text.match(re);
      return m ? parseInt(m[1]) : undefined;
    };

    // 简单正则提取
    const maxGuests = extract(/可住\s*(\d+)(?:-\d+)?\s*人/) || extract(/(\d+)\s*人/);
    const bedrooms = extract(/(\d+)\s*(?:房|卧|间)/);
    const area = extract(/(\d+)(?:-\d+)?\s*(?:平方米|平米|㎡|平方)/);
    const basePrice = extract(/¥\s*(\d+)|(\d{3,4})\s*元/);

    // 提取设施关键词
    const facilityKeywords = ['泳池', 'KTV', '烧烤', '麻将', '棋牌', '投影', '桌游', '厨房', '空调', 'WiFi', '花园', '碳烤'];
    const facilities = facilityKeywords.filter((f) => text.includes(f));

    return {
      name: title.replace(/【.*?】/g, '').trim().slice(0, 50),
      maxGuests,
      bedrooms,
      area,
      basePrice,
      facilities,
      summary: text.slice(0, 150),
    };
  }

  private extractJson(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch { return {}; }
      }
      return {};
    }
  }

  private isValidImage(url: string): boolean {
    return /\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(url) && url.startsWith('http');
  }

  private resolveUrl(url: string): string {
    if (url.startsWith('//')) return 'https:' + url;
    return url;
  }
}
