import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';
import { imageSize } from 'image-size';
import puppeteer from 'puppeteer';
import OpenAI from 'openai';
import { CosService } from '../../common/cos/cos.service';
import { AiService } from '../ai/ai.service';

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

  constructor(
    config: ConfigService,
    private readonly cosService: CosService,
    private readonly aiService: AiService,
  ) {
    this.client = new OpenAI({
      baseURL: config.get('AI_BASE_URL'),
      apiKey: config.get('AI_API_KEY'),
    });
    this.textModel = config.get('AI_TEXT_MODEL', 'Qwen/Qwen3-8B');
  }

  /**
   * 批量上传图片 → AI 分析 → 生成别墅信息
   * 接收 Multer 文件数组，返回可直接用于创建别墅的完整数据
   */
  async importFromImages(files: Express.Multer.File[]) {
    if (!files?.length) throw new BadRequestException('请上传至少一张图片');
    if (!this.cosService.isEnabled()) throw new BadRequestException('COS 未配置');

    // 1. 批量上传到 COS
    this.logger.log(`📦 开始上传 ${files.length} 张图片到 COS...`);
    const uploadResults = await Promise.all(
      files.map(async (file) => {
        try {
          const url = await this.cosService.uploadFile(file, 'villa');
          return url;
        } catch (e: any) {
          this.logger.warn(`上传失败 ${file.originalname}: ${e.message}`);
          return null;
        }
      }),
    );
    const imageUrls = uploadResults.filter((u): u is string => !!u);
    if (!imageUrls.length) throw new BadRequestException('所有图片上传失败');
    this.logger.log(`✅ 上传完成: ${imageUrls.length}/${files.length}`);

    // 2. AI 视觉分析：分类、排序、选封面
    this.logger.log('🔍 AI 分析图片中...');
    const imageAnalysis = await this.aiService.analyzeImages(imageUrls);
    const coverImage = imageAnalysis.find((img) => img.isCover)?.url || imageUrls[0];

    // 3. AI 生成别墅信息
    this.logger.log('✍️ AI 生成别墅信息...');
    const villaInfo = await this.generateVillaFromImages(imageAnalysis);

    // 4. AI 生成营销描述
    const description = await this.aiService.generateDescription({
      name: villaInfo.name || '未命名别墅',
      maxGuests: villaInfo.maxGuests || 10,
      bedrooms: villaInfo.bedrooms || 3,
      area: villaInfo.area,
      facilities: villaInfo.facilities,
      imageAnalysis,
    });

    return {
      // 图片信息（已排序，含分类和描述）
      images: imageAnalysis.map((img) => ({
        url: img.url,
        category: img.category,
        categoryName: img.categoryName,
        caption: img.description,
        isCover: img.isCover,
      })),
      coverImage,
      // 别墅信息（可直接用于创建）
      villa: {
        name: villaInfo.name || '未命名别墅',
        description,
        address: villaInfo.address || '',
        maxGuests: villaInfo.maxGuests || 10,
        bedrooms: villaInfo.bedrooms || 3,
        area: villaInfo.area,
        basePrice: villaInfo.basePrice || 1888,
        weekendPrice: villaInfo.weekendPrice || 2388,
        deposit: villaInfo.deposit || 500,
        tags: villaInfo.tags || '聚会,团建',
        facilities: villaInfo.facilities || [],
      },
      // 统计
      stats: {
        uploaded: imageUrls.length,
        total: files.length,
        categories: Object.fromEntries(
          Object.entries(
            imageAnalysis.reduce((acc, img) => {
              acc[img.categoryName] = (acc[img.categoryName] || 0) + 1;
              return acc;
            }, {} as Record<string, number>),
          ).sort(([, a], [, b]) => (b as number) - (a as number)),
        ),
      },
    };
  }

  /**
   * 根据图片分析结果，用 AI 推断别墅基本信息
   */
  private async generateVillaFromImages(
    imageAnalysis: { category: string; categoryName: string; description: string }[],
  ) {
    const imageDesc = imageAnalysis
      .map((img) => `${img.categoryName}：${img.description}`)
      .join('\n');

    // 统计房间类型
    const bedroomCount = imageAnalysis.filter((i) => i.category === 'bedroom').length;
    const hasPool = imageAnalysis.some((i) => i.category === 'pool');
    const hasGarden = imageAnalysis.some((i) => i.category === 'garden');
    const hasEntertainment = imageAnalysis.some((i) => i.category === 'entertainment');

    const prompt = `你是别墅信息估算助手。根据以下别墅图片分析结果，推断别墅的基本信息。

图片分析（共 ${imageAnalysis.length} 张）：
${imageDesc}

可观察到的特征：
- 卧室图片数量：${bedroomCount}
- 有泳池：${hasPool ? '是' : '否'}
- 有花园：${hasGarden ? '是' : '否'}
- 有娱乐区：${hasEntertainment ? '是' : '否'}

请根据图片推断以下信息，返回 JSON：
{
  "name": "给别墅起一个吸引人的名称（如：湖畔星光别墅），不超过10字",
  "address": "如果能从图片推断位置则填写，否则留空",
  "maxGuests": 可住人数（根据卧室数量估算，每间2人），
  "bedrooms": 卧室数量,
  "area": 面积（平方米，根据图片规模估算，留空则设null）,
  "basePrice": 平日参考价（根据装修档次估算，经济型1000-2000，中档2000-4000，豪华4000+）,
  "weekendPrice": 周末参考价（通常比平日贵20-50%）,
  "deposit": 押金（通常500-2000）,
  "tags": "适合场景标签（从 团建,生日,聚会,亲子 中选，逗号分隔）",
  "facilities": ["从图片中能看到的设施，如 泳池/KTV/烧烤/麻将/投影/厨房/空调/WiFi/花园 等"]
}

只返回 JSON，不要其他内容。`;

    const response = await this.client.chat.completions.create({
      model: this.textModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content || '';
    return this.extractJson(content);
  }

  /**
   * 从文案文本中提取别墅结构化信息
   */
  async importFromText(text: string) {
    if (!text?.trim()) throw new BadRequestException('请输入文案内容');
    const trimmed = text.trim().slice(0, 5000);

    this.logger.log(`📝 开始解析文案（${trimmed.length} 字）...`);

    const prompt = `你是别墅房源信息提取专家。请从以下别墅推荐/介绍文案中，精确提取所有信息，返回 JSON 格式。

文案内容：
${trimmed}

请提取以下字段，返回 JSON：
{
  "name": "别墅名称（简洁，不超过15字）",
  "address": "详细地址（包含城市/区/路）",
  "maxGuests": 最大可住人数（数字）,
  "bedrooms": 房间/客房数量（数字）,
  "beds": 总床位数（数字，如果提到的话）,
  "area": 总面积（平方米，数字）,
  "floors": 楼层数（数字，如果提到的话）,
  "basePrice": 平日价格（数字，如未提到则根据档次估算：经济型1000-2000，中档2000-4000，豪华4000+），
  "weekendPrice": 周末价格（数字，通常比平日贵20-50%），
  "deposit": 押金（数字，通常500-2000），
  "tags": "适合场景标签（从 团建/生日/聚会/亲子/公司活动 中选，逗号分隔）",
  "facilities": ["从文案中提到的所有设施，如 KTV/麻将/泳池/烧烤/桌球/投影/厨房/空调/WiFi/花园/露营/游戏机/桌游 等"],
  "description": "用150-250字重写一段营销描述，突出卖点，适合小程序展示，语言生动有画面感",
  "floorPlan": "每层功能简述（如有楼层介绍的话）",
  "transportation": "交通信息简述（如有的话）",
  "highlights": ["3-5个核心卖点短语，每个不超过10字"]
}

要求：
1. 尽可能从原文提取准确数据，不要凭空捏造
2. 未提到的字段设为 null
3. facilities 要尽可能完整列出文案中提到的所有设施
4. description 要重新组织语言，比原文更吸引人
5. 只返回 JSON，不要其他内容`;

    const response = await this.client.chat.completions.create({
      model: this.textModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '';
    if (!content) throw new BadRequestException('AI 返回空内容');

    const parsed = this.extractJson(content);
    if (!parsed || !Object.keys(parsed).length) {
      throw new BadRequestException('无法从文案中提取信息');
    }

    return {
      villa: {
        name: parsed.name || '未命名别墅',
        description: parsed.description || '',
        address: parsed.address || '',
        maxGuests: parsed.maxGuests || 10,
        bedrooms: parsed.bedrooms || 3,
        area: parsed.area || null,
        basePrice: parsed.basePrice || 1888,
        weekendPrice: parsed.weekendPrice || 2388,
        deposit: parsed.deposit || 500,
        tags: parsed.tags || '团建,聚会',
        facilities: parsed.facilities || [],
      },
      extra: {
        beds: parsed.beds,
        floors: parsed.floors,
        floorPlan: parsed.floorPlan,
        transportation: parsed.transportation,
        highlights: parsed.highlights || [],
      },
    };
  }

  /**
   * 从 URL 抓取页面内容并解析
   * 支持：简篇(jianpian.cn)、美篇、普通网页
   */
  async importFromUrl(url: string, useAi = true): Promise<ImportedData> {
    // 清理 URL：去除前后空格、换行
    url = (url || '').trim().replace(/[\r\n\s]+/g, '');
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
   * 下载图片并上传到 COS，按尺寸过滤掉小图
   * 返回 COS 访问 URL
   */
  private async downloadAndFilterImages(urls: string[]): Promise<string[]> {
    const results: string[] = [];

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

        // 上传到 COS
        if (this.cosService.isEnabled()) {
          const ext = this.getExtFromUrl(url) || 'jpg';
          const cosUrl = await this.cosService.uploadBuffer(
            buffer,
            `import.${ext}`,
            'villa',
          );
          return cosUrl;
        } else {
          this.logger.warn('COS 未配置，跳过图片');
          return null;
        }
      } catch (e: any) {
        this.logger.warn(`下载/上传失败 ${url}: ${e.message}`);
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
