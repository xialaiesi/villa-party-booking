import request from '../utils/request';

export function getOrders(params?: any) {
  return request.get('/api/admin/orders', { params });
}

export function confirmOrder(id: number) {
  return request.post(`/api/admin/orders/${id}/confirm`);
}

export function rejectOrder(id: number, reason?: string) {
  return request.post(`/api/admin/orders/${id}/reject`, { reason });
}

export function refundDeposit(id: number, amount: number) {
  return request.post(`/api/admin/orders/${id}/deposit/refund`, { amount });
}
