import request from '../utils/request';

export function listVillas(params?: any) {
  return request.get('/api/villas', { params });
}

export function getVilla(id: number) {
  return request.get(`/api/villas/${id}`);
}

export function getVillaCalendar(id: number, year: number, month: number) {
  return request.get(`/api/villas/${id}/calendar`, { params: { year, month } });
}

export function getVillaReviews(id: number, page = 1, pageSize = 10, sort?: string) {
  return request.get(`/api/villas/${id}/reviews`, { params: { page, pageSize, sort } });
}

export function listFacilities() {
  return request.get('/api/facilities');
}

export function getHome() {
  return request.get('/api/home');
}

export function getSiteConfig() {
  return request.get('/api/site-config');
}
