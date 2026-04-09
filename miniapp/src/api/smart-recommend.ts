import { request } from '../utils/request';

export function smartRecommend(query: string) {
  return request<any>({ url: '/api/smart-recommend', method: 'POST', data: { query } });
}
