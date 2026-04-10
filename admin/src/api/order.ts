import request from '../utils/request';

export function getOrders(params?: any) {
  return request.get('/api/admin/orders', { params });
}

/** 确认定金到账 (0→1) */
export function confirmDepositPaid(id: number) {
  return request.post(`/api/admin/orders/${id}/deposit-paid`);
}

/** 确认订单 (1→2) */
export function confirmOrder(id: number) {
  return request.post(`/api/admin/orders/${id}/confirm`);
}

/** 拒绝订单 (1→7) */
export function rejectOrder(id: number, reason?: string) {
  return request.post(`/api/admin/orders/${id}/reject`, { reason });
}

/** 标记已入住 (2→3) */
export function markCheckedIn(id: number) {
  return request.post(`/api/admin/orders/${id}/check-in`);
}

/** 确认尾款到账 (3→4) */
export function confirmFinalPayment(id: number) {
  return request.post(`/api/admin/orders/${id}/final-paid`);
}

/** 手动完成 (4→5) */
export function markCompleted(id: number) {
  return request.post(`/api/admin/orders/${id}/complete`);
}
