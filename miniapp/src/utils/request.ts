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

/**
 * COS 数据万象图片处理
 * 在 COS URL 后追加 imageMogr2 参数，实现缩放/压缩/转格式
 */
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

/** 列表页缩略图 (400px 宽, webp, 质量 75) */
export function thumbUrl(url: string): string {
  return ciImage(resolveImageUrl(url), { width: 400, format: 'webp', quality: 75 });
}

/** 详情页大图 (800px 宽, webp, 质量 85) */
export function detailUrl(url: string): string {
  return ciImage(resolveImageUrl(url), { width: 800, format: 'webp', quality: 85 });
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
