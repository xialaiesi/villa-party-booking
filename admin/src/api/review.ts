import request from '../utils/request';

export function getPendingVideoReviews(params?: any) {
  return request.get('/api/admin/reviews/pending-videos', { params });
}

export function reviewVideo(id: number, data: { approved: boolean; reason?: string }) {
  return request.post(`/api/admin/reviews/${id}/video-review`, data);
}