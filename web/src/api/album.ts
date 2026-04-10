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
