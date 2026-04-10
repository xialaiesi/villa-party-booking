import axios from 'axios';
import { ElMessage } from 'element-plus';

export const BASE_URL = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000';

export function resolveImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url}`;
}

/** COS 数据万象图片处理 */
export function ciImage(
  url: string,
  opts: { width?: number; height?: number; quality?: number; format?: 'webp' | 'jpg' | 'png' } = {},
): string {
  if (!url || !url.includes('.cos.') && !url.includes('.myqcloud.com')) return url;
  const parts: string[] = [];
  if (opts.width && opts.height) parts.push(`thumbnail/${opts.width}x${opts.height}`);
  else if (opts.width) parts.push(`thumbnail/${opts.width}x`);
  else if (opts.height) parts.push(`thumbnail/x${opts.height}`);
  if (opts.format) parts.push(`format/${opts.format}`);
  parts.push(`quality/${opts.quality ?? 80}`);
  if (!parts.length) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}imageMogr2/${parts.join('/')}`;
}

/** 列表页缩略图 */
export function thumbUrl(url: string): string {
  return ciImage(resolveImageUrl(url), { width: 400, format: 'webp', quality: 75 });
}

/** 详情页大图 */
export function detailUrl(url: string): string {
  return ciImage(resolveImageUrl(url), { width: 800, format: 'webp', quality: 85 });
}

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('user_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    const { code, message, data } = response.data;
    if (code === 0) return data;
    ElMessage.error(message || '请求失败');
    return Promise.reject(new Error(message));
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user_token');
      localStorage.removeItem('user_info');
      window.location.href = '/login';
    }
    ElMessage.error(error.response?.data?.message || '网络异常');
    return Promise.reject(error);
  },
);

export default request;
