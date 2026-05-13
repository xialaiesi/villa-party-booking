import request from '../utils/request';

export function getAnalyticsOverview(days = 30) {
  return request.get('/api/analytics/admin/overview', { params: { days } });
}
