import request from '../utils/request';

export function createOrder(data: any) {
  return request.post('/api/orders', data);
}

export function listOrders(params?: any) {
  return request.get('/api/orders', { params });
}

export function getOrder(id: number) {
  return request.get(`/api/orders/${id}`);
}

export function cancelOrder(id: number, reason?: string) {
  return request.post(`/api/orders/${id}/cancel`, { reason });
}
