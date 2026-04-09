import { request } from '../utils/request';

export function listEvents() {
  return request<any[]>({ url: '/api/seasonal-events' });
}
export function getEvent(id: number) {
  return request<any>({ url: `/api/seasonal-events/${id}` });
}
