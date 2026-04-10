import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000';

export async function uploadSingle(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('user_token');
  const res = await axios.post(`${BASE_URL}/api/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  return res.data.data;
}
