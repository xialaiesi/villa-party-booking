// 本地开发：用电脑局域网 IP，真机调试时手机需要和电脑在同一个 WiFi
// 真机调试时 localhost 指的是手机自己，所以要用局域网 IP
// TODO: 生产环境改为正式域名
export const BASE_URL = 'http://192.168.110.43:3000';

/** 将服务器相对 URL 转为完整 URL */
export function resolveImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url}`;
}

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  params?: Record<string, any>;
}

function getToken(): string {
  return uni.getStorageSync('token') || '';
}

export function request<T = any>(options: RequestOptions): Promise<T> {
  let url = `${BASE_URL}${options.url}`;

  // 拼接 query params
  if (options.params) {
    const query = Object.entries(options.params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    if (query) url += `?${query}`;
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      success: (res: any) => {
        if (res.statusCode === 200) {
          const data = res.data;
          if (data.code === 0) {
            resolve(data.data);
          } else {
            uni.showToast({ title: data.message || '请求失败', icon: 'none' });
            reject(new Error(data.message));
          }
        } else if (res.statusCode === 401) {
          uni.removeStorageSync('token');
          uni.navigateTo({ url: '/pages/mine/index' });
          reject(new Error('请先登录'));
        } else {
          const msg = res.data?.message || '网络异常';
          uni.showToast({ title: msg, icon: 'none' });
          reject(new Error(msg));
        }
      },
      fail: (err: any) => {
        uni.showToast({ title: '网络连接失败', icon: 'none' });
        reject(err);
      },
    });
  });
}
