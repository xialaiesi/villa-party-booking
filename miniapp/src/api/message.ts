import { request } from '../utils/request';

export function listMessages() {
  return request<any[]>({ url: '/api/messages' });
}

export function getUnreadCount() {
  return request<{ count: number }>({ url: '/api/messages/unread-count' });
}

export function readMessage(id: number) {
  return request<any>({ url: `/api/messages/${id}/read`, method: 'POST' });
}

export function readAllMessages() {
  return request<any>({ url: '/api/messages/read-all', method: 'POST' });
}
