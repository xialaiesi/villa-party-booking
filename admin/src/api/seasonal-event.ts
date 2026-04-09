import request from '../utils/request';

export function getEvents(params?: any) { return request.get('/api/admin/seasonal-events', { params }); }
export function createEvent(data: any) { return request.post('/api/admin/seasonal-events', data); }
export function updateEvent(id: number, data: any) { return request.put(`/api/admin/seasonal-events/${id}`, data); }
export function deleteEvent(id: number) { return request.delete(`/api/admin/seasonal-events/${id}`); }
