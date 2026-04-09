import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `你是"趴体策划师"——别墅轰趴预订平台的 AI 策划顾问。你的任务是通过对话了解用户需求，然后推荐最合适的别墅、活动方案和氛围包组合。

对话风格：
- 亲切、专业、有趣，像一个经验丰富的派对策划师
- 每次回复简洁，不超过 150 字
- 主动引导用户，而不是被动等待

对话流程：
1. 第一轮：了解场景（团建/生日/聚会/亲子？）和大致人数
2. 第二轮：了解预算范围和偏好（要泳池？要 KTV？）
3. 第三轮：了解日期偏好
4. 第四轮：给出推荐方案，包含别墅+活动+氛围包
5. 后续：回答追问，调整方案

如果用户提供了足够信息，直接给出推荐，不要硬凑四轮。

回复格式要求：
- 普通对话直接回复文本
- 当给出推荐时，在文本末尾附加一行 JSON（用 <<<RECOMMEND>>> 标记）：
<<<RECOMMEND>>>{"villaKeywords":"关键词","scene":"场景","guests":人数,"budget":"预算范围"}`;

@Injectable()
export class AiPlannerService {
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

  /** 创建新对话 */
  async createSession(userId: number) {
    const session = await this.prisma.chatSession.create({
      data: { userId, title: '新的趴体策划' },
    });

    // 发送欢迎消息
    const welcome = '嗨！我是你的趴体策划师 🎉 告诉我你想办什么样的聚会？比如团建、生日趴、还是朋友聚会？大概多少人参加呀？';
    await this.prisma.chatMessage.create({
      data: { sessionId: session.id, role: 'assistant', content: welcome },
    });

    return {
      sessionId: Number(session.id),
      messages: [{ role: 'assistant', content: welcome }],
    };
  }

  /** 发送消息并获取 AI 回复 */
  async chat(sessionId: number, userId: number, message: string) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('对话不存在');

    // 保存用户消息
    await this.prisma.chatMessage.create({
      data: { sessionId, role: 'user', content: message },
    });

    // 获取历史消息
    const history = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20, // 保留最近 20 条
    });

    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    // AI 回复
    const response = await this.client.chat.completions.create({
      model: this.textModel,
      messages,
      max_tokens: 500,
      temperature: 0.8,
    });

    const aiContent = response.choices[0]?.message?.content || '抱歉，我需要想一下...';

    // 保存 AI 回复
    let metadata: string | null = null;
    if (aiContent.includes('<<<RECOMMEND>>>')) {
      const parts = aiContent.split('<<<RECOMMEND>>>');
      metadata = parts[1]?.trim() || null;
    }

    await this.prisma.chatMessage.create({
      data: { sessionId, role: 'assistant', content: aiContent.split('<<<RECOMMEND>>>')[0].trim(), metadata },
    });

    // 更新会话标题（取用户第一条消息的前 20 字）
    if (history.length <= 2) {
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { title: message.slice(0, 20) },
      });
    }

    return {
      reply: aiContent.split('<<<RECOMMEND>>>')[0].trim(),
      recommendation: metadata ? JSON.parse(metadata) : null,
    };
  }

  /** 获取用户的对话列表 */
  async getSessions(userId: number) {
    const sessions = await this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
    return sessions.map((s) => ({ id: Number(s.id), title: s.title, updatedAt: s.updatedAt }));
  }

  /** 获取对话历史 */
  async getMessages(sessionId: number, userId: number) {
    const session = await this.prisma.chatSession.findFirst({ where: { id: sessionId, userId } });
    if (!session) throw new NotFoundException('对话不存在');

    const messages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((m) => ({
      id: Number(m.id),
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    }));
  }
}
