import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** 默认任务模板：根据入住天数倒计时自动生成 */
const TASK_TEMPLATES = [
  { daysBefore: 7, title: '确认参加人数', detail: '在群里统计最终参加人数，提前告知别墅管家', category: 'before_checkin' },
  { daysBefore: 5, title: '确认活动方案', detail: '选好轰趴剧本/活动流程，确保道具和套餐已加购', category: 'before_checkin' },
  { daysBefore: 3, title: '采购食材和饮品', detail: '根据人数准备零食、饮料、酒水；如已加购烧烤套餐可跳过食材', category: 'before_checkin' },
  { daysBefore: 2, title: '准备个人物品', detail: '泳衣、换洗衣物、洗漱用品、充电宝、桌游', category: 'before_checkin' },
  { daysBefore: 1, title: '确认交通方案', detail: '确认导航地址、停车位信息、拼车安排', category: 'before_checkin' },
  { daysBefore: 1, title: '联系管家确认入住', detail: '确认入住时间（14:00后），获取开门密码或钥匙位置', category: 'before_checkin' },
  { daysBefore: 0, title: '入住检查', detail: '检查设施设备是否完好，拍照记录现状（避免押金纠纷）', category: 'during' },
  { daysBefore: 0, title: '拍合照！', detail: '趁人齐先拍一张合照，不要等到最后大家都走了', category: 'during' },
  { daysBefore: -1, title: '退房前清理', detail: '收拾垃圾、检查个人物品、恢复家具位置', category: 'after' },
  { daysBefore: -1, title: '退房检查', detail: '12:00前退房，等管家确认无损坏后离开', category: 'after' },
  { daysBefore: -1, title: '创建聚会回忆', detail: '把照片上传到趴后回忆相册，邀请朋友一起共创', category: 'after' },
];

@Injectable()
export class OrderTaskService {
  constructor(private prisma: PrismaService) {}

  /** 为订单自动生成任务清单（订单确认时调用） */
  async generateTasks(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('订单不存在');

    // 检查是否已生成
    const existing = await this.prisma.orderTask.count({ where: { orderId } });
    if (existing > 0) return { message: '任务已生成' };

    const checkIn = new Date(order.checkIn);
    const tasks = TASK_TEMPLATES.map((t, i) => {
      const dueDate = new Date(checkIn);
      dueDate.setDate(dueDate.getDate() - t.daysBefore);
      // after 类型的任务日期是退房日
      if (t.daysBefore < 0) {
        dueDate.setDate(new Date(order.checkOut).getDate());
      }

      return {
        orderId,
        sortOrder: i,
        title: t.title,
        detail: t.detail,
        dueDate,
        category: t.category,
        done: 0,
      };
    });

    await this.prisma.orderTask.createMany({ data: tasks });
    return { message: '任务清单已生成', count: tasks.length };
  }

  /** 获取订单任务清单 */
  async getTasks(orderId: number, userId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) throw new NotFoundException('订单不存在');

    const tasks = await this.prisma.orderTask.findMany({
      where: { orderId },
      orderBy: { sortOrder: 'asc' },
    });

    const checkIn = new Date(order.checkIn);
    const now = new Date();
    const daysUntilCheckin = Math.ceil(
      (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      orderId: Number(orderId),
      daysUntilCheckin,
      checkIn: order.checkIn,
      checkOut: order.checkOut,
      tasks: tasks.map((t) => ({
        id: Number(t.id),
        title: t.title,
        detail: t.detail,
        dueDate: t.dueDate,
        done: t.done === 1,
        category: t.category,
        overdue: t.dueDate && new Date(t.dueDate) < now && t.done === 0,
      })),
      progress: {
        total: tasks.length,
        done: tasks.filter((t) => t.done === 1).length,
        percent: tasks.length
          ? Math.round((tasks.filter((t) => t.done === 1).length / tasks.length) * 100)
          : 0,
      },
    };
  }

  /** 标记任务完成/取消完成 */
  async toggleTask(taskId: number, userId: number) {
    const task = await this.prisma.orderTask.findUnique({
      where: { id: taskId },
      include: { order: { select: { userId: true } } },
    });
    if (!task || Number(task.order.userId) !== userId) {
      throw new NotFoundException('任务不存在');
    }

    const newDone = task.done === 1 ? 0 : 1;
    await this.prisma.orderTask.update({
      where: { id: taskId },
      data: { done: newDone },
    });

    return { id: Number(taskId), done: newDone === 1 };
  }
}
