import { request } from '../utils/request';

export function uploadFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${uni.getStorageSync('baseUrl') || ''}/api/upload/video`,
      filePath,
      name: 'file',
      success: (res) => {
        if (res.statusCode === 200) {
          const data = JSON.parse(res.data);
          resolve(data.url);
        } else {
          reject(new Error('上传失败'));
        }
      },
      fail: reject,
    });
  });
}

export function uploadImage(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${uni.getStorageSync('baseUrl') || ''}/api/upload`,
      filePath,
      name: 'file',
      success: (res) => {
        if (res.statusCode === 200) {
          const data = JSON.parse(res.data);
          resolve(data.url);
        } else {
          reject(new Error('上传失败'));
        }
      },
      fail: reject,
    });
  });
}