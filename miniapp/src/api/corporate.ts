import { request } from '../utils/request';

export function createCorporateOrder(data: any) {
  return request<any>({ url: '/api/corporate', method: 'POST', data });
}
export function generatePlan(orderId: number) {
  return request<{ content: string }>({ url: `/api/corporate/${orderId}/generate-plan`, method: 'POST' });
}
export function generateReport(orderId: number) {
  return request<{ content: string }>({ url: `/api/corporate/${orderId}/generate-report`, method: 'POST' });
}
