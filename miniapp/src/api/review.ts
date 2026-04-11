import { request } from '../utils/request';

export function createReview(data: {
  orderId: number;
  rating: number;
  content?: string;
  images?: string[];
  videos?: { url: string; duration: number }[];
}) {
  return request({ url: '/api/reviews', method: 'POST', data });
}

export function checkReview(orderId: number) {
  return request({ url: `/api/orders/${orderId}/review` });
}