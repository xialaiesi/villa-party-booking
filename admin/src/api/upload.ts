import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

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
