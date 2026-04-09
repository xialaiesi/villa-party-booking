import request from '../utils/request';

export function importFromUrl(url: string, useAi = true) {
  return request.post('/api/admin/import/url', { url, useAi });
}
