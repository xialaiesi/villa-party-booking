import request from '../utils/request';

export function getMerchants(params?: any) {
  return request.get('/api/admin/merchants', { params });
}

export function createMerchant(data: any) {
  return request.post('/api/admin/merchants', data);
}

export function updateMerchant(id: number, data: any) {
  return request.put(`/api/admin/merchants/${id}`, data);
}

export function updateMerchantStatus(id: number, status: number) {
  return request.put(`/api/admin/merchants/${id}/status`, { status });
}

export function deleteMerchant(id: number) {
  return request.delete(`/api/admin/merchants/${id}`);
}

export function getMyFinance() {
  return request.get('/api/admin/merchants/my/finance');
}

export function getMySettlements(params?: any) {
  return request.get('/api/admin/merchants/my/settlements', { params });
}

export function markSettled(id: number) {
  return request.post(`/api/admin/merchants/settlements/${id}/mark-settled`);
}
