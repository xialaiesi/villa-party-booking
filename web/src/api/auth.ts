import request from '../utils/request';

export function login(phone: string, password: string) {
  return request.post('/api/auth/login', { phone, password });
}

export function register(phone: string, password: string, nickname?: string) {
  return request.post('/api/auth/register', { phone, password, nickname });
}

export function getProfile() {
  return request.get('/api/auth/profile');
}
