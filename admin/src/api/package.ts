import request from '../utils/request';

export function getPackages(params?: any) { return request.get('/api/admin/packages', { params }); }
export function createPackage(data: any) { return request.post('/api/admin/packages', data); }
export function updatePackage(id: number, data: any) { return request.put(`/api/admin/packages/${id}`, data); }
export function deletePackage(id: number) { return request.delete(`/api/admin/packages/${id}`); }
