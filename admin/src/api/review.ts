import request from '../utils/request';

export function getReviews(params?: any) {
  return request.get('/api/admin/reviews', { params });
}

export function getPendingVideoReviews(params?: any) {
  return request.get('/api/admin/reviews/pending-videos', { params });
}

export function reviewVideo(id: number, data: { approved: boolean; reason?: string }) {
  return request.post(`/api/admin/reviews/${id}/video-review`, data);
}

export function replyReview(id: number, reply: string) {
  return request.post(`/api/admin/reviews/${id}/reply`, { reply });
}

export function deleteReview(id: number) {
  return request.delete(`/api/admin/reviews/${id}`);
}
