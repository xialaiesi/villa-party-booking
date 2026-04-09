import { request } from '../utils/request';

export function getHomeData() {
  return request<any>({ url: '/api/home' });
}

export function getMineStats() {
  return request<any>({ url: '/api/home/mine/stats' });
}
