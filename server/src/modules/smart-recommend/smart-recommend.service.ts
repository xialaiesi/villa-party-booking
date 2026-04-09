import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class SmartRecommendService {
  private client: OpenAI;
  private textModel: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.client = new OpenAI({
      baseURL: this.config.get('AI_BASE_URL'),
      apiKey: this.config.get('AI_API_KEY'),
    });
    this.textModel = this.config.get('AI_TEXT_MODEL', 'Qwen/Qwen3-8B');
  }

  /**
   * 智能选墅：根据用户自然语言描述，推荐别墅+方案+套餐组合
   */
  async recommend(query: string) {
    // 1. 获取所有可用别墅、方案、氛围包
    const [villas, plans, themePacks] = await Promise.all([
      this.prisma.villa.findMany({
        where: { status: 1 },
        include: { facilities: { include: { facility: true } } },
      }),
      this.prisma.activityPlan.findMany({ where: { status: 1 } }),
      this.prisma.themePack.findMany({ where: { status: 1 } }),
    ]);

    // 2. 构建别墅摘要给 AI
    const villasSummary = villas.map((v) => ({
      id: Number(v.id),
      name: v.name,
      maxGuests: v.maxGuests,
      bedrooms: v.bedrooms,
      basePrice: Number(v.basePrice),
      weekendPrice: Number(v.weekendPrice),
      deposit: Number(v.deposit),
      facilities: v.facilities.map((f: any) => f.facility.name),
      tags: v.tags,
      address: v.address,
    }));

    const plansSummary = plans.map((p) => ({
      id: Number(p.id),
      name: p.name,
      scene: p.scene,
      guests: `${p.minGuests}-${p.maxGuests}`,
      duration: p.duration,
    }));

    const themePacksSummary = themePacks.map((t) => ({
      id: Number(t.id),
      name: t.name,
      theme: t.theme,
      price: Number(t.price),
    }));

    // 3. AI 推荐
    const prompt = `你是别墅轰趴预订平台的智能推荐助手。根据用户需求推荐最合适的组合。

可选别墅：
${JSON.stringify(villasSummary, null, 2)}

可选活动方案：
${JSON.stringify(plansSummary, null, 2)}

可选氛围包：
${JSON.stringify(themePacksSummary, null, 2)}

用户需求：${query}

请返回 JSON 格式推荐：
{
  "villa": { "id": 别墅ID, "reason": "推荐理由（一句话）" },
  "plan": { "id": 方案ID或null, "reason": "推荐理由" },
  "themePack": { "id": 氛围包ID或null, "reason": "推荐理由" },
  "tips": "给用户的额外建议（一句话）",
  "estimatedBudget": "预估总费用描述"
}

只返回 JSON，不要其他内容。如果没有合适的方案或氛围包，对应字段设为null。`;

    const response = await this.client.chat.completions.create({
      model: this.textModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.5,
    });

    const text = response.choices[0]?.message?.content || '';
    const recommendation = this.extractJson(text);

    // 4. 填充完整信息
    const result: any = { ...recommendation };

    if (recommendation.villa?.id) {
      const villa = villas.find((v) => Number(v.id) === recommendation.villa.id);
      if (villa) {
        result.villa = {
          ...recommendation.villa,
          name: villa.name,
          basePrice: Number(villa.basePrice),
          coverImage: villa.coverImage,
          maxGuests: villa.maxGuests,
        };
      }
    }

    if (recommendation.plan?.id) {
      const plan = plans.find((p) => Number(p.id) === recommendation.plan.id);
      if (plan) {
        result.plan = { ...recommendation.plan, name: plan.name, scene: plan.scene };
      }
    }

    if (recommendation.themePack?.id) {
      const pack = themePacks.find((t) => Number(t.id) === recommendation.themePack.id);
      if (pack) {
        result.themePack = {
          ...recommendation.themePack,
          name: pack.name,
          price: Number(pack.price),
        };
      }
    }

    return result;
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
}
