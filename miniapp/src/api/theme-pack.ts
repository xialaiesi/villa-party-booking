import { request } from '../utils/request';

export function listThemePacks(theme?: string) {
  return request<any[]>({ url: '/api/theme-packs', params: theme ? { theme } : undefined });
}

export function getThemePack(id: number) {
  return request<any>({ url: `/api/theme-packs/${id}` });
}
