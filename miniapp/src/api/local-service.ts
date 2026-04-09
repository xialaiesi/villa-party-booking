import { request } from '../utils/request';

export function listServices(category?: string) {
  return request<any[]>({ url: '/api/local-services', params: category ? { category } : undefined });
}
export function bookService(data: { orderId: number; serviceId: number; serviceDate: string; remark?: string }) {
  return request<any>({ url: '/api/local-services/book', method: 'POST', data });
}
