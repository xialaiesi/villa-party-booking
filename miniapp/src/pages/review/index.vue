<template>
  <view class="page">
    <!-- 评分 -->
    <view class="section">
      <view class="section-title">总体评分</view>
      <view class="rating-box">
        <text v-for="n in 5" :key="n" class="star" :class="{ active: n <= rating }" @tap="rating = n">★</text>
      </view>
    </view>

    <!-- 评价内容 -->
    <view class="section">
      <view class="section-title">分享您的入住体验</view>
      <textarea v-model="content" placeholder="分享您的入住体验，帮助其他用户更好地选择..." class="content-input" />
    </view>

    <!-- 图片上传 -->
    <view class="section">
      <view class="section-title">上传图片</view>
      <view class="upload-grid">
        <view class="upload-item" v-for="(img, i) in images" :key="i">
          <image :src="img" mode="aspectFill" class="preview-img" />
          <view class="remove-btn" @tap="removeImage(i)">✕</view>
        </view>
        <view class="upload-btn" @tap="chooseImage" v-if="images.length < 9">
          <text class="upload-icon">+</text>
          <text class="upload-label">添加图片</text>
        </view>
      </view>
    </view>

    <!-- 视频上传 -->
    <view class="section">
      <view class="section-title">上传视频（真实入住拍摄，更有帮助）</view>
      <view class="video-section">
        <view class="video-item" v-for="(v, i) in videos" :key="i">
          <video :src="v.url" class="preview-video" />
          <view class="remove-btn" @tap="removeVideo(i)">✕</view>
        </view>
        <view class="upload-btn video-btn" @tap="chooseVideo" v-if="!videos.length">
          <text class="upload-icon">🎥</text>
          <text class="upload-label">添加视频</text>
          <text class="upload-tip">建议时长 15-60 秒</text>
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-bar">
      <view class="submit-btn" :class="{ disabled: rating === 0 }" @tap="submitReview">
        <text>提交评价</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { createReview, checkReview } from '../../api/review';
import { uploadFile } from '../../api/upload';

let orderId = 0;

const rating = ref(0);
const content = ref('');
const images = ref<string[]>([]);
const videos = ref<any[]>([]);
const submitting = ref(false);

onLoad((query: any) => {
  orderId = parseInt(query.orderId);
});

async function chooseImage() {
  uni.chooseImage({
    count: 9 - images.value.length,
    sizeType: ['compressed'],
    success: async (res) => {
      uni.showLoading({ title: '上传中...', mask: true });
      for (const path of res.tempFilePaths) {
        try {
          const url = await uploadFile(path);
          images.value.push(url);
        } catch (e) {
          uni.showToast({ title: '图片上传失败', icon: 'none' });
        }
      }
      uni.hideLoading();
    },
  });
}

function removeImage(index: number) {
  images.value.splice(index, 1);
}

async function chooseVideo() {
  uni.chooseVideo({
    sourceType: ['camera', 'album'],
    maxDuration: 60,
    success: async (res) => {
      if (res.size && res.size > 100 * 1024 * 1024) {
        uni.showToast({ title: '视频不能超过 100MB', icon: 'none' });
        return;
      }
      uni.showLoading({ title: '上传中...', mask: true });
      try {
        const url = await uploadFile(res.tempFilePath);
        videos.value.push({ url, duration: res.duration || 0 });
      } catch (e) {
        uni.showToast({ title: '视频上传失败', icon: 'none' });
      }
      uni.hideLoading();
    },
  });
}

function removeVideo(index: number) {
  videos.value.splice(index, 1);
}

async function submitReview() {
  if (rating.value === 0) {
    uni.showToast({ title: '请选择评分', icon: 'none' });
    return;
  }
  if (submitting.value) return;
  submitting.value = true;

  try {
    const data: any = {
      orderId,
      rating: rating.value,
      content: content.value,
      images: images.value,
      videos: videos.value.map(v => ({ url: v.url, duration: Math.round(v.duration) })),
    };
    await createReview(data);
    uni.showToast({ title: '评价成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 1500);
  } catch (e: any) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding-bottom: 140rpx; }

.section { background: #fff; margin-bottom: 20rpx; padding: 30rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; }

.rating-box { display: flex; gap: 16rpx; }
.rating-box .star { font-size: 48rpx; color: #ddd; }
.rating-box .star.active { color: #ffc107; }

.content-input {
  width: 100%; height: 200rpx;
  padding: 20rpx; border: 1rpx solid #eee; border-radius: 12rpx;
  font-size: 28rpx; box-sizing: border-box;
}

.upload-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.upload-item { position: relative; width: 160rpx; height: 160rpx; border-radius: 12rpx; overflow: hidden; }
.preview-img { width: 100%; height: 100%; }
.remove-btn {
  position: absolute; top: 8rpx; right: 8rpx;
  width: 36rpx; height: 36rpx; background: rgba(0,0,0,0.6);
  color: #fff; border-radius: 50%; font-size: 20rpx;
  display: flex; align-items: center; justify-content: center;
}
.upload-btn {
  width: 160rpx; height: 160rpx; border: 2rpx dashed #ddd; border-radius: 12rpx;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: #fafafa;
}
.upload-icon { font-size: 40rpx; }
.upload-label { font-size: 22rpx; color: #999; margin-top: 8rpx; }
.upload-tip { font-size: 20rpx; color: #bbb; margin-top: 4rpx; }

.video-section { display: flex; flex-wrap: wrap; gap: 16rpx; }
.video-section .video-item { position: relative; width: 300rpx; height: 200rpx; border-radius: 12rpx; overflow: hidden; }
.preview-video { width: 100%; height: 100%; }
.video-btn { width: 300rpx; height: 200rpx; }

.submit-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 30rpx; background: #fff; box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05); }
.submit-btn {
  background: linear-gradient(135deg, #ff6b35, #ff8f65);
  color: #fff; text-align: center; padding: 24rpx; border-radius: 48rpx;
  font-size: 32rpx; font-weight: bold;
}
.submit-btn.disabled { background: #ccc; }
</style>