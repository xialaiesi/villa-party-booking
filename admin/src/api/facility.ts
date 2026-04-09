import request from '../utils/request';

export function getFacilities() { return request.get('/api/admin/facilities'); }
export function createFacility(data: any) { return request.post('/api/admin/facilities', data); }
export function updateFacility(id: number, data: any) { return request.put(`/api/admin/facilities/${id}`, data); }
export function deleteFacility(id: number) { return request.delete(`/api/admin/facilities/${id}`); }
