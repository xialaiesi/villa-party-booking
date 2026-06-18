import { request } from '../utils/request';

export function listVillas(params?: {
  page?: number;
  pageSize?: number;
  check_in?: string;
  check_out?: string;
  guests?: number;
  facilities?: string;
  min_price?: number;
  max_price?: number;
  tag?: string;
  sort?: string;
}) {
  return request<any>({ url: '/api/villas', params });
}

export function getVilla(id: number) {
  return request<any>({ url: `/api/villas/${id}` });
}

export function getVillaCalendar(id: number, year: number, month: number) {
  return request<any[]>({
    url: `/api/villas/${id}/calendar`,
    params: { year, month },
  });
}

export function getVillaSlots(id: number, date: string) {
  return request<any[]>({
    url: `/api/villas/${id}/slots`,
    params: { date },
  });
}

export function getVillaReviews(id: number, page = 1, pageSize = 10) {
  return request<any>({
    url: `/api/villas/${id}/reviews`,
    params: { page, pageSize },
  });
}

export function getVillaPlans(guests?: number) {
  return request<any[]>({
    url: '/api/activity-plans',
    params: guests ? { guests } : undefined,
  });
}

export function listFacilities() {
  return request<any[]>({ url: '/api/facilities' });
}
