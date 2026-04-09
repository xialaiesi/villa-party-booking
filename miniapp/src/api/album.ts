import { request } from '../utils/request';

export function createAlbum(data: { orderId: number; title?: string }) {
  return request<any>({ url: '/api/albums', method: 'POST', data });
}

export function getMyAlbums() {
  return request<any[]>({ url: '/api/albums/mine' });
}

export function getAlbumByCode(code: string) {
  return request<any>({ url: `/api/albums/invite/${code}` });
}

export function getAlbum(id: number) {
  return request<any>({ url: `/api/albums/${id}` });
}

export function addPhoto(albumId: number, data: { url: string; caption?: string }) {
  return request<any>({ url: `/api/albums/${albumId}/photos`, method: 'POST', data });
}

export function removePhoto(photoId: number) {
  return request<any>({ url: `/api/albums/photos/${photoId}`, method: 'DELETE' });
}
