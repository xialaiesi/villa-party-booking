import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

/** 图片分析结果 */
export interface ImageAnalysis {
  /** 图片 URL */
  url: string;
  /** 分类：exterior/living_room/bedroom/bathroom/kitchen/pool/garden/entertainment/dining/other */
  category: string;
  /** 中文分类名 */
  categoryName: string;
  /** 推荐排序权重（越小越靠前） */
  sortOrder: number;
  /** 是否推荐作为封面 */
  isCover: boolean;
  /** 图片描述 */
  description: string;
}

/** 排序权重映射：决定图片展示顺序 */
const CATEGORY_SORT: Record<string, number> = {
  exterior: 1,
  pool: 2,
  garden: 3,
  living_room: 4,
  dining: 5,
  kitchen: 6,
  bedroom: 7,
  bathroom: 8,
  entertainment: 9,
  other: 10,
};

const CATEGORY_NAMES: Record<string, string> = {
  exterior: '外观',
  pool: '泳池',
  garden: '花园',
  living_room: '客厅',
  dining: '餐厅',
  kitchen: '厨房',
  bedroom: '卧室',
  bathroom: '卫浴',
  entertainment: '娱乐',
  other: '其他',
};

@Injectable()
export class AiService {
  private client: OpenAI;
  private visionModel: string;
  private textModel: string;
  private readonly logger = new Logger(AiService.name);

  constructor(private config: ConfigService) {
    this.client = new OpenAI({
      baseURL: this.config.get('AI_BASE_URL'),
      apiKey: this.config.get('AI_API_KEY'),
    });
    this.visionModel = this.config.get('AI_VISION_MODEL', 'Qwen/Qwen2.5-VL-7B-Instruct');
    this.textModel = this.config.get('AI_TEXT_MODEL', 'Qwen/Qwen2.5-7B-Instruct');
  }

  /**
   * 分析多张别墅图片：自动分类、排序、选封面
   */
  async analyzeImages(imageUrls: string[]): Promise<ImageAnalysis[]> {
    const results: ImageAnalysis[] = [];

    for (const url of imageUrls) {
      try {
        const analysis = await this.analyzeSingleImage(url);
        results.push(analysis);
      } catch (e) {
        this.logger.warn(`图片分析失败: ${url}`, e);
        results.push({
          url,
          category: 'other',
          categoryName: '其他',
          sortOrder: 10,
          isCover: false,
          description: '',
        });
      }
    }

    // 按分类权重排序
    results.sort((a, b) => a.sortOrder - b.sortOrder);

    // 选定封面：优先外观，其次泳池，其次花园
    const coverPriority = ['exterior', 'pool', 'garden', 'living_room'];
    let coverSet = false;
    for (const cat of coverPriority) {
      const found = results.find((r) => r.category === cat);
      if (found) {
        found.isCover = true;
        coverSet = true;
        break;
      }
    }
    if (!coverSet && results.length > 0) {
      results[0].isCover = true;
    }

    // 更新最终排序
    results.forEach((r, i) => (r.sortOrder = i));

    return results;
  }

  /**
   * 分析单张图片
   */
  private async analyzeSingleImage(imageUrl: string): Promise<ImageAnalysis> {
    const prompt = `你是一个别墅房产图片分析助手。请分析这张别墅图片，返回 JSON 格式：

{
  "category": "分类，从以下选择一个：exterior（外观）、living_room（客厅）、bedroom（卧室）、bathroom（卫浴）、kitchen（厨房）、pool（泳池）、garden（花园）、entertainment（娱乐区/KTV/棋牌室）、dining（餐厅）、other（其他）",
  "description": "用一句话描述这张图片的亮点，用于吸引客人预订，不超过30字"
}

只返回 JSON，不要其他内容。`;

    const response = await this.client.chat.completions.create({
      model: this.visionModel,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const text = response.choices[0]?.message?.content || '';
    const json = this.extractJson(text);
    const category = json.category || 'other';

    return {
      url: imageUrl,
      category,
      categoryName: CATEGORY_NAMES[category] || '其他',
      sortOrder: CATEGORY_SORT[category] || 10,
      isCover: false,
      description: json.description || '',
    };
  }

  /**
   * 根据别墅信息和图片分析结果，生成营销描述
   */
  async generateDescription(villaInfo: {
    name: string;
    address?: string;
    maxGuests: number;
    bedrooms: number;
    area?: number;
    facilities?: string[];
    imageAnalysis?: ImageAnalysis[];
  }): Promise<string> {
    const facilitiesText = villaInfo.facilities?.length
      ? `配套设施：${villaInfo.facilities.join('、')}`
      : '';

    const imageText = villaInfo.imageAnalysis?.length
      ? `图片分析结果：\n${villaInfo.imageAnalysis.map((img) => `- ${img.categoryName}：${img.description}`).join('\n')}`
      : '';

    const prompt = `你是一个专业的别墅轰趴平台文案写手，擅长撰写吸引年轻人预订的别墅描述。

请根据以下信息，为这栋别墅撰写一段营销描述（150-250字），要求：
1. 突出别墅的核心卖点和场景感（团建、生日聚会、朋友聚会）
2. 语言生动有画面感，适合小程序展示
3. 自然地融入设施和空间优势
4. 结尾可以加一句号召性用语

别墅信息：
- 名称：${villaInfo.name}
- 地址：${villaInfo.address || '未填写'}
- 容纳人数：${villaInfo.maxGuests}人
- 卧室数：${villaInfo.bedrooms}间
- 面积：${villaInfo.area ? villaInfo.area + '㎡' : '未填写'}
${facilitiesText}
${imageText}

直接输出描述文案，不要任何前缀、标题或解释。`;

    const response = await this.client.chat.completions.create({
      model: this.textModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.8,
    });

    return response.choices[0]?.message?.content?.trim() || '';
  }

  /**
   * 一键处理：分析图片 + 生成描述
   */
  async processVilla(data: {
    name: string;
    address?: string;
    maxGuests: number;
    bedrooms: number;
    area?: number;
    facilities?: string[];
    imageUrls: string[];
  }) {
    // 1. 分析图片
    const imageAnalysis = await this.analyzeImages(data.imageUrls);

    // 2. 生成描述
    const description = await this.generateDescription({
      ...data,
      imageAnalysis,
    });

    return {
      images: imageAnalysis,
      description,
      coverImage: imageAnalysis.find((img) => img.isCover)?.url || data.imageUrls[0],
    };
  }

  private extractJson(text: string): any {
    try {
      // 尝试直接解析
      return JSON.parse(text);
    } catch {
      // 尝试提取 JSON 块
      const match = text.match(/\{[\s\S]*?\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return {};
        }
      }
      return {};
    }
  }
}
