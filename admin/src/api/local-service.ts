import request from '../utils/request';

export function getServices(params?: any) { return request.get('/api/admin/local-services', { params }); }
export function createService(data: any) { return request.post('/api/admin/local-services', data); }
export function updateService(id: number, data: any) { return request.put(`/api/admin/local-services/${id}`, data); }
export function deleteService(id: number) { return request.delete(`/api/admin/local-services/${id}`); }
