import { request } from '../utils/request';

/** 会员中心 */
export function getMembership() {
  return request<any>({ url: '/api/membership/me' });
}

/** 成长值流水 */
export function getGrowthLogs(params?: { page?: number; pageSize?: number }) {
  return request<any>({ url: '/api/membership/growth-logs', params });
}

/** 设置生日 */
export function setBirthday(birthday: string) {
  return request<any>({ url: '/api/membership/birthday', method: 'POST', data: { birthday } });
}
