import { request } from '../utils/request';

export function getPlans(params?: { scene?: string; guests?: number }) {
  return request<any[]>({ url: '/api/activity-plans', params });
}

export function getPlan(id: number) {
  return request<any>({ url: `/api/activity-plans/${id}` });
}
