import { request } from '../utils/request';

export function createGroup(data: any) {
  return request<any>({ url: '/api/groups', method: 'POST', data });
}

export function listActiveGroups(villaId?: number) {
  return request<any[]>({ url: '/api/groups', params: villaId ? { villaId } : undefined });
}

export function getGroup(id: number) {
  return request<any>({ url: `/api/groups/${id}` });
}

export function joinGroup(id: number) {
  return request<any>({ url: `/api/groups/${id}/join`, method: 'POST' });
}
