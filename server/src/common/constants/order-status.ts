/**
 * 订单状态字典
 *
 * 流程：
 * 0(待付定金) → 1(已付定金/待商家确认) → 2(已确认/待入住) → 3(已入住/待付尾款)
 * → 4(已付全款/入住中) → 5(已完成)
 * → 6(已取消) / 7(已拒绝) / 8(已关闭)
 */
export const ORDER_STATUS = {
  PENDING_DEPOSIT: 0,      // 待付定金
  DEPOSIT_PAID: 1,         // 已付定金，待商家确认
  CONFIRMED: 2,            // 商家已确认，待入住
  CHECKED_IN: 3,           // 已入住，待付尾款
  FULLY_PAID: 4,           // 已付全款，入住中
  COMPLETED: 5,            // 已完成
  CANCELLED: 6,            // 已取消
  REJECTED: 7,             // 已拒绝
  CLOSED: 8,               // 已关闭
} as const;

export const ORDER_STATUS_MAP: Record<number, { label: string; color: string; desc: string }> = {
  0: { label: '待付定金', color: '#e6a23c', desc: '请支付定金以锁定日期' },
  1: { label: '已付定金', color: '#409eff', desc: '等待商家确认订单' },
  2: { label: '待入住', color: '#67c23a', desc: '订单已确认，等待入住' },
  3: { label: '待付尾款', color: '#e6a23c', desc: '已入住，请支付剩余尾款' },
  4: { label: '已付全款', color: '#409eff', desc: '费用已结清，入住中' },
  5: { label: '已完成', color: '#909399', desc: '订单已完成，欢迎下次光临' },
  6: { label: '已取消', color: '#909399', desc: '订单已取消' },
  7: { label: '已拒绝', color: '#f56c6c', desc: '商家已拒绝该订单' },
  8: { label: '已关闭', color: '#909399', desc: '订单已关闭' },
};

/** 前台可取消的状态 */
export const CANCELLABLE_STATUSES = [
  ORDER_STATUS.PENDING_DEPOSIT,
  ORDER_STATUS.DEPOSIT_PAID,
  ORDER_STATUS.CONFIRMED,
];
