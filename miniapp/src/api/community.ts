import { request } from '../utils/request';

export function getFeed(page = 1, pageSize = 10) {
  return request<any>({ url: '/api/community/feed', params: { page, pageSize } });
}
export function createPost(data: { content: string; images?: string[]; villaId?: number; albumId?: number }) {
  return request<any>({ url: '/api/community/posts', method: 'POST', data });
}
export function getPost(id: number) {
  return request<any>({ url: `/api/community/posts/${id}` });
}
export function addComment(postId: number, content: string) {
  return request<any>({ url: `/api/community/posts/${postId}/comment`, method: 'POST', data: { content } });
}
export function toggleLike(postId: number) {
  return request<any>({ url: `/api/community/posts/${postId}/like`, method: 'POST' });
}
