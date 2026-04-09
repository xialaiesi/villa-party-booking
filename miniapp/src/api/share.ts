import { request } from '../utils/request';

export function createShare(data: {
  orderId: number;
  memberCount: number;
  shareMode: number;
}) {
  return request<any>({ url: '/api/shares', method: 'POST', data });
}

export function getShareDetail(id: number) {
  return request<any>({ url: `/api/shares/${id}` });
}

export function joinShare(id: number) {
  return request<any>({ url: `/api/shares/${id}/join`, method: 'POST' });
}

export function payShare(paymentId: number) {
  return request<any>({
    url: `/api/shares/payments/${paymentId}/pay`,
    method: 'POST',
  });
}
