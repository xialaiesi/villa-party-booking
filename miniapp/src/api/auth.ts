import { request } from '../utils/request';

export function wxLogin(code: string) {
  return request<{ token: string; user: any }>({
    url: '/api/auth/wx-login',
    method: 'POST',
    data: { code },
  });
}

export function getProfile() {
  return request<any>({ url: '/api/auth/profile' });
}

export function updateProfile(data: { nickname?: string; avatar?: string; phone?: string }) {
  return request<any>({ url: '/api/auth/profile', method: 'PUT', data });
}
