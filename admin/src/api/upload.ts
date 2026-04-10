import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000';

export async function uploadSingle(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await axios.post(`${BASE_URL}/api/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function uploadBatch(files: File[]): Promise<{ url: string }[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));
  const res = await axios.post(`${BASE_URL}/api/upload/batch`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

/** 将服务器相对路径转换为完整 URL */
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
