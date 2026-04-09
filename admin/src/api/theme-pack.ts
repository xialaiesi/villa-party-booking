import request from '../utils/request';

export function getThemePacks(params?: any) {
  return request.get('/api/admin/theme-packs', { params });
}

export function createThemePack(data: any) {
  return request.post('/api/admin/theme-packs', data);
}

export function updateThemePack(id: number, data: any) {
  return request.put(`/api/admin/theme-packs/${id}`, data);
}

export function deleteThemePack(id: number) {
  return request.delete(`/api/admin/theme-packs/${id}`);
}
