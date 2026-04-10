import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ORDER_STATUS } from '../../common/constants/order-status';

@Injectable()
export class OrderCronService {
  private readonly logger = new Logger(OrderCronService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 每小时扫描一次：已付全款(status=4) 且退房时间已过 24 小时的订单自动完成
   */
  @Cron('0 * * * *') // 每小时整点
  async autoCompleteOrders() {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);

    const result = await this.prisma.order.updateMany({
      where: {
        status: ORDER_STATUS.FULLY_PAID,
        checkOut: { lte: cutoff },
      },
      data: { status: ORDER_STATUS.COMPLETED },
    });

    if (result.count > 0) {
      this.logger.log(`自动完成 ${result.count} 个订单（退房超24小时）`);
    }
  }
}
