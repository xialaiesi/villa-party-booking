import request from '../utils/request';

export function login(username: string, password: string) {
  return request.post('/api/admin/auth/login', { username, password });
}
