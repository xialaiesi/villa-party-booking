import request from '../utils/request';

export function getMyAlbums() {
  return request.get('/api/albums/mine');
}

export function getAlbumByCode(code: string) {
  return request.get(`/api/albums/invite/${code}`);
}

export function getAlbumDetail(id: number) {
  return request.get(`/api/albums/${id}`);
}

export function createAlbum(data: { orderId: number; title?: string }) {
  return request.post('/api/albums', data);
}

export function addPhoto(albumId: number, data: { url: string; caption?: string }) {
  return request.post(`/api/albums/${albumId}/photos`, data);
}

export function deletePhoto(photoId: number) {
  return request.delete(`/api/albums/photos/${photoId}`);
}

// 评论
export function getComments(albumId: number, photoId?: number) {
  const params: any = {};
  if (photoId) params.photoId = photoId;
  return request.get(`/api/albums/${albumId}/comments`, { params });
}

export function addComment(albumId: number, data: { content: string; photoId?: number; parentId?: number }) {
  return request.post(`/api/albums/${albumId}/comments`, data);
}

export function deleteComment(commentId: number) {
  return request.delete(`/api/albums/comments/${commentId}`);
}
