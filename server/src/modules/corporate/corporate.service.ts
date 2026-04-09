import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class CorporateService {
  private client: OpenAI;
  private textModel: string;

  constructor(private prisma: PrismaService, config: ConfigService) {
    this.client = new OpenAI({
      baseURL: config.get('AI_BASE_URL'),
      apiKey: config.get('AI_API_KEY'),
    });
    this.textModel = config.get('AI_TEXT_MODEL', 'Qwen/Qwen3-8B');
  }

  /** 创建企业团建订单 */
  async create(userId: number, data: {
    orderId: number;
    companyName: string;
    contactName: string;
    contactPhone: string;
    invoiceTitle?: string;
    invoiceTaxNo?: string;
    payMethod: number;
    transferProof?: string;
  }) {
    const order = await this.prisma.order.findFirst({ where: { id: data.orderId, userId } });
    if (!order) throw new NotFoundException('订单不存在');

    const corp = await this.prisma.corporateOrder.create({
      data: {
        orderId: data.orderId,
        companyName: data.companyName,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        invoiceTitle: data.invoiceTitle,
        invoiceTaxNo: data.invoiceTaxNo,
        payMethod: data.payMethod,
        transferProof: data.transferProof,
      },
    });
    return { id: Number(corp.id) };
  }

  /** AI 生成团建方案文案（返回文本，前端渲染为 PDF） */
  async generatePlan(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        villa: { select: { name: true, address: true, maxGuests: true, facilities: { include: { facility: true } } } },
        orderPackages: true,
      },
    });
    if (!order) throw new NotFoundException('订单不存在');

    const facilities = (order.villa as any).facilities?.map((f: any) => f.facility.name).join('、') || '';

    const prompt = `请生成一份专业的企业团建方案文档，包含以下内容：

别墅：${(order.villa as any).name}
地址：${(order.villa as any).address}
容纳人数：${(order.villa as any).maxGuests}人
入住日期：${order.checkIn} ~ ${order.checkOut}（${order.days}天）
参加人数：${order.guests}人
设施：${facilities}
总费用：¥${order.totalAmount}

请生成包含以下章节的方案：
1. 活动概述
2. 行程安排（按时间线）
3. 费用预算明细
4. 注意事项
5. 应急预案

用 Markdown 格式输出，风格专业正式，适合给领导审批。`;

    const response = await this.client.chat.completions.create({
      model: this.textModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.7,
    });

    return { content: response.choices[0]?.message?.content || '' };
  }

  /** AI 生成团建报告（活动结束后） */
  async generateReport(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        villa: { select: { name: true } },
        reviews: { select: { rating: true, content: true } },
      },
    });
    if (!order) throw new NotFoundException('订单不存在');

    const reviewText = order.reviews.map((r) => `评分${r.rating}/5: ${r.content || ''}`).join('\n') || '暂无评价';

    const prompt = `请生成一份简洁的团建活动总结报告（适合企业内部报销/汇报）：

别墅：${(order.villa as any).name}
日期：${order.checkIn} ~ ${order.checkOut}
人数：${order.guests}人
费用：¥${order.totalAmount}
参与者反馈：
${reviewText}

包含：活动概述、参与情况、费用明细、参与者反馈摘要、改进建议。
用 Markdown 格式，控制在 500 字以内。`;

    const response = await this.client.chat.completions.create({
      model: this.textModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
    });

    return { content: response.choices[0]?.message?.content || '' };
  }

  /** 获取企业订单详情 */
  async getDetail(orderId: number) {
    const corp = await this.prisma.corporateOrder.findUnique({ where: { orderId } });
    if (!corp) throw new NotFoundException('企业订单不存在');
    return { ...corp, id: Number(corp.id), orderId: Number(corp.orderId) };
  }
}
