import request from '../utils/request';

export function getVillas(params?: any) {
  return request.get('/api/admin/villas', { params });
}

export function createVilla(data: any) {
  return request.post('/api/admin/villas', data);
}

export function updateVilla(id: number, data: any) {
  return request.put(`/api/admin/villas/${id}`, data);
}

export function updateVillaStatus(id: number, status: number) {
  return request.put(`/api/admin/villas/${id}/status`, { status });
}

export function getCalendar(id: number, year: number, month: number) {
  return request.get(`/api/admin/villas/${id}/calendar`, { params: { year, month } });
}

export function setCalendar(id: number, dates: any[]) {
  return request.put(`/api/admin/villas/${id}/calendar`, { dates });
}
