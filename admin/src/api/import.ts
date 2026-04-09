import request from '../utils/request';

export function importFromUrl(url: string, useAi = true) {
  // Puppeteer 抓取耗时较长（启动浏览器+滚动+下载），设置 2 分钟超时
  return request.post('/api/admin/import/url', { url, useAi }, { timeout: 120000 });
}
