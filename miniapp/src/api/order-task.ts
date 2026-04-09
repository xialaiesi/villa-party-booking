import { request } from '../utils/request';

export function getOrderTasks(orderId: number) {
  return request<any>({ url: `/api/orders/${orderId}/tasks` });
}

export function generateTasks(orderId: number) {
  return request<any>({ url: `/api/orders/${orderId}/tasks/generate`, method: 'POST' });
}

export function toggleTask(taskId: number) {
  return request<any>({ url: `/api/orders/tasks/${taskId}/toggle`, method: 'POST' });
}
