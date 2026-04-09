import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { imageSize } from 'image-size';
import puppeteer from 'puppeteer';
import OpenAI from 'openai';

const UPLOAD_DIR = 'uploads';
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

/** 图片过滤阈值 */
const MIN_IMAGE_WIDTH = 400;
const MIN_IMAGE_HEIGHT = 300;

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

    // 使用 Puppeteer 启动真实浏览器，触发懒加载
    let parsed: ImportedData;
    try {
      parsed = await this.fetchWithPuppeteer(url);
    } catch (e: any) {
      this.logger.error(`Puppeteer 抓取失败: ${e.message}，降级为静态抓取`);
      // 降级为普通 fetch
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });
      if (!res.ok) throw new BadRequestException(`抓取失败: HTTP ${res.status}`);
      const html = await res.text();
      parsed = this.parseHtml(html);
    }

    // 下载图片到本地并按尺寸过滤
    this.logger.log(`原始抓取到 ${parsed.images.length} 张图片，开始下载过滤...`);
    parsed.images = await this.downloadAndFilterImages(parsed.images);
    this.logger.log(`过滤后剩余 ${parsed.images.length} 张图片`);

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

  /**
   * 使用 Puppeteer 启动真实浏览器抓取
   * 模拟滚动以触发懒加载，等待所有图片加载完成
   */
  private async fetchWithPuppeteer(url: string): Promise<ImportedData> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      this.logger.log(`🌐 Puppeteer 加载页面: ${url}`);
      // domcontentloaded 比 networkidle2 快很多
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

      // 滚动到底部触发懒加载
      await this.autoScroll(page);

      // 等 1.5 秒让最后一批图片加载
      await new Promise((r) => setTimeout(r, 1500));

      // 提取数据
      const result = await page.evaluate(() => {
        const title = document.title || '';
        const description =
          document
            .querySelector('meta[name="description"]')
            ?.getAttribute('content') || '';

        const imgSet = new Set<string>();

        // 1. 所有 img 标签（已加载）
        document.querySelectorAll('img').forEach((img: any) => {
          const src = img.src || img.dataset.src || img.dataset.original;
          if (src && src.startsWith('http')) imgSet.add(src);
        });

        // 2. 所有元素的 background-image
        document.querySelectorAll('*').forEach((el: any) => {
          const bg = window.getComputedStyle(el).backgroundImage;
          if (bg && bg !== 'none') {
            const match = bg.match(/url\(["']?(https?:\/\/[^"')]+)/);
            if (match) imgSet.add(match[1]);
          }
        });

        // 正文
        const bodyText = document.body?.innerText?.replace(/\s+/g, ' ').trim() || '';

        return {
          title,
          description,
          rawText: bodyText.slice(0, 3000),
          images: Array.from(imgSet),
        };
      });

      return {
        title: result.title.slice(0, 100),
        description: result.description.slice(0, 500),
        rawText: result.rawText,
        images: this.filterImageUrls(result.images).slice(0, 30),
      };
    } finally {
      await browser.close();
    }
  }

  /** 自动滚动到页面底部触发懒加载 */
  private async autoScroll(page: any) {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let total = 0;
        const step = 600;
        const timer = setInterval(() => {
          const h = document.body.scrollHeight;
          window.scrollBy(0, step);
          total += step;
          if (total >= h) {
            clearInterval(timer);
            setTimeout(resolve, 300);
          }
        }, 120);
      });
    });
  }

  /** URL 层面过滤明显的装饰图 */
  private filterImageUrls(urls: string[]): string[] {
    return urls.filter((url) => {
      const lower = url.toLowerCase();
      return (
        !lower.includes('icon') &&
        !lower.includes('avatar') &&
        !lower.includes('placeholder') &&
        !lower.includes('logo') &&
        !lower.includes('/biz/') &&
        !lower.includes('/common/') &&
        !lower.includes('/template/') &&
        !lower.includes('iconfont') &&
        !lower.includes('font/')
      );
    });
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

    // URL 层面的过滤（关键词 + 路径）
    const filteredImages = Array.from(images).filter((url) => {
      const lower = url.toLowerCase();
      return (
        !lower.includes('icon') &&
        !lower.includes('avatar') &&
        !lower.includes('placeholder') &&
        !lower.includes('logo') &&
        // 简篇/美篇的装饰模板图都在 /biz/ 路径下
        !lower.includes('/biz/') &&
        !lower.includes('/common/') &&
        !lower.includes('/template/') &&
        !lower.includes('iconfont')
      );
    });

    return {
      title: title.slice(0, 100),
      description: description.slice(0, 500),
      rawText: bodyText.slice(0, 3000),
      images: filteredImages.slice(0, 30),
    };
  }

  /**
   * 下载图片到本地，按尺寸过滤掉小图
   * 返回本地访问 URL（/uploads/xxx.ext）
   */
  private async downloadAndFilterImages(urls: string[]): Promise<string[]> {
    const results: string[] = [];

    // 并发下载，最多 10 个
    const promises = urls.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            Referer: new URL(url).origin,
          },
        });
        if (!res.ok) return null;

        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length < 10 * 1024) return null; // 小于 10KB 的跳过

        // 检查图片尺寸
        try {
          const dims = imageSize(buffer);
          if (
            !dims.width ||
            !dims.height ||
            dims.width < MIN_IMAGE_WIDTH ||
            dims.height < MIN_IMAGE_HEIGHT
          ) {
            return null;
          }
        } catch {
          return null;
        }

        // 保存到本地
        const ext = this.getExtFromUrl(url) || 'jpg';
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
        const filepath = join(UPLOAD_DIR, filename);
        writeFileSync(filepath, buffer);
        return `/uploads/${filename}`;
      } catch (e: any) {
        this.logger.warn(`下载失败 ${url}: ${e.message}`);
        return null;
      }
    });

    const settled = await Promise.all(promises);
    for (const r of settled) {
      if (r) results.push(r);
    }

    return results;
  }

  private getExtFromUrl(url: string): string {
    const match = url.match(/\.(jpg|jpeg|png|webp|gif)(?:\?|$)/i);
    return match ? match[1].toLowerCase() : 'jpg';
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
