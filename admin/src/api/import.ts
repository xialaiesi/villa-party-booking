import axios from 'axios';
import request from '../utils/request';

const BASE_URL = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000';

export function importFromUrl(url: string, useAi = true) {
  // Puppeteer 抓取耗时较长（启动浏览器+滚动+下载），设置 2 分钟超时
  return request.post('/api/admin/import/url', { url, useAi }, { timeout: 120000 });
}

/** 批量上传图片 → AI 分析 → 生成别墅信息 */
export async function importFromImages(files: File[]) {
  const formData = new FormData();
  files.forEach((f) => formData.append('images', f));
  const token = localStorage.getItem('admin_token');
  const res = await axios.post(`${BASE_URL}/api/admin/import/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
    timeout: 180000, // 3 分钟（AI 分析耗时）
  });
  const { code, message, data } = res.data;
  if (code !== 0) throw new Error(message);
  return data;
}
