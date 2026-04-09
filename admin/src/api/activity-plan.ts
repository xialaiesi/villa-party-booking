import request from '../utils/request';

export function getPlans(params?: any) {
  return request.get('/api/admin/activity-plans', { params });
}

export function createPlan(data: any) {
  return request.post('/api/admin/activity-plans', data);
}

export function updatePlan(id: number, data: any) {
  return request.put(`/api/admin/activity-plans/${id}`, data);
}

export function deletePlan(id: number) {
  return request.delete(`/api/admin/activity-plans/${id}`);
}
