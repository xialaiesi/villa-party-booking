import request from '../utils/request';

export function createReview(data: { orderId: number; rating: number; content?: string; images?: string[] }) {
  return request.post('/api/reviews', data);
}

export function updateReview(id: number, data: { rating?: number; content?: string }) {
  return request.put(`/api/reviews/${id}`, data);
}

export function deleteReview(id: number) {
  return request.delete(`/api/reviews/${id}`);
}

export function checkReview(orderId: number) {
  return request.get(`/api/orders/${orderId}/review`);
}
