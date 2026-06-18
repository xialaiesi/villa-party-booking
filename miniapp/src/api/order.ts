import { request } from '../utils/request';

export function createOrder(data: {
  villaId: number;
  checkIn: string;
  checkOut: string;
  slotId?: number;
  guests: number;
  contactName?: string;
  contactPhone?: string;
  remark?: string;
  packages?: { packageId: number; quantity: number }[];
}) {
  return request<any>({ url: '/api/orders', method: 'POST', data });
}

export function listOrders(params?: { status?: number; page?: number; pageSize?: number }) {
  return request<any>({ url: '/api/orders', params });
}

export function getOrder(id: number) {
  return request<any>({ url: `/api/orders/${id}` });
}

export function cancelOrder(id: number, reason?: string) {
  return request<any>({
    url: `/api/orders/${id}/cancel`,
    method: 'POST',
    data: { reason },
  });
}

export function signPact(id: number, data: {
  leaderName: string;
  leaderPhone: string;
  leaderIdTail?: string;
  partySize?: number;
}) {
  return request<any>({ url: `/api/orders/${id}/sign-pact`, method: 'POST', data });
}

export function getSiteConfig() {
  return request<any>({ url: '/api/site-config' });
}

export function payOrder(id: number) {
  return request<any>({
    url: `/api/orders/${id}/pay`,
    method: 'POST',
  });
}

export function listPackages() {
  return request<any[]>({ url: '/api/packages' });
}
