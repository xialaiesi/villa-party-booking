import axios from 'axios';
import { ElMessage } from 'element-plus';

const request = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    const { code, message, data } = response.data;
    if (code === 0) {
      return data;
    }
    ElMessage.error(message || '请求失败');
    return Promise.reject(new Error(message));
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    ElMessage.error(error.response?.data?.message || '网络异常');
    return Promise.reject(error);
  },
);

export default request;
