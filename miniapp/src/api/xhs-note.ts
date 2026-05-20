import { request } from '../utils/request';

// ==================== C 端 ====================

export function getXhsNoteFeed(params?: { page?: number; pageSize?: number; villaId?: number; style?: string }) {
  return request<any>({ url: '/api/xhs-notes', params });
}

export function getXhsNote(id: number) {
  return request<any>({ url: `/api/xhs-notes/${id}` });
}

export function createXhsNote(data: {
  title: string;
  content: string;
  coverImage: string;
  images?: string[];
  tags?: string[];
  villaId?: number;
  style?: string;
}) {
  return request<any>({ url: '/api/xhs-notes', method: 'POST', data });
}

export function toggleNoteLike(id: number) {
  return request<any>({ url: `/api/xhs-notes/${id}/like`, method: 'POST' });
}

export function toggleNoteCollect(id: number) {
  return request<any>({ url: `/api/xhs-notes/${id}/collect`, method: 'POST' });
}

export function addNoteComment(id: number, content: string, parentId?: number) {
  return request<any>({ url: `/api/xhs-notes/${id}/comment`, method: 'POST', data: { content, parentId } });
}

// ==================== 商家端 ====================

export function getAdminXhsNotes(params?: { page?: number; pageSize?: number; status?: number }) {
  return request<any>({ url: '/api/admin/xhs-notes', params });
}

export function createAdminXhsNote(data: any) {
  return request<any>({ url: '/api/admin/xhs-notes', method: 'POST', data });
}

export function updateAdminXhsNote(id: number, data: any) {
  return request<any>({ url: `/api/admin/xhs-notes/${id}`, method: 'PUT', data });
}

export function deleteAdminXhsNote(id: number) {
  return request<any>({ url: `/api/admin/xhs-notes/${id}`, method: 'DELETE' });
}
