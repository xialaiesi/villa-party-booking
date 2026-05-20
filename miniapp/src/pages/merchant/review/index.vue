<template>
  <view class="page">
    <view class="toolbar">
      <text class="title">评价管理</text>
      <view class="video-btn" @tap="goVideoReview">
        视频审核
        <view class="badge" v-if="pendingCount > 0">{{ pendingCount }}</view>
      </view>
    </view>

    <view class="list">
      <view class="review-card" v-for="r in list" :key="r.id">
        <view class="review-header">
          <view class="user-info">
            <image class="user-avatar" :src="r.user?.avatar || '/static/logo.png'" />
            <view>
              <text class="user-name">{{ r.user?.nickname || '用户' }}</text>
              <text class="review-date">{{ formatDate(r.createdAt) }}</text>
            </view>
          </view>
          <view class="rating">
            <text v-for="i in 5" :key="i" class="star">{{ i <= r.rating ? '★' : '☆' }}</text>
          </view>
        </view>

        <text class="review-villa">{{ r.villa?.name }}</text>
        <text class="review-content">{{ r.content }}</text>

        <view class="review-images" v-if="r.images?.length">
          <image v-for="(img, i) in r.images" :key="i" :src="resolveImg(img)" class="review-img" mode="aspectFill"
            @tap="previewImage(r.images, i)" />
        </view>

        <view class="reply-box" v-if="r.reply">
          <text class="reply-label">商家回复：</text>
          <text class="reply-text">{{ r.reply }}</text>
        </view>

        <view class="review-actions">
          <text class="action-btn" v-if="!r.reply" @tap="handleReply(r)">回复</text>
          <text class="action-btn danger" @tap="handleDelete(r)">删除</text>
        </view>
      </view>
    </view>

    <view class="empty" v-if="!loading && list.length === 0">
      <text class="empty-text">暂无评价</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getAdminReviews, replyReview, deleteReview, getPendingVideos } from '../../../api/admin';
import { resolveImageUrl } from '../../../utils/request';

const resolveImg = resolveImageUrl;
const list = ref<any[]>([]);
const loading = ref(false);
const pendingCount = ref(0);

function formatDate(d: string) { return d ? d.replace('T', ' ').slice(0, 16) : ''; }

onShow(async () => {
  loading.value = true;
  try {
    const data = await getAdminReviews({ page: 1, pageSize: 50 });
    list.value = data.list || data;
    const pending = await getPendingVideos().catch(() => []);
    pendingCount.value = Array.isArray(pending) ? pending.length : 0;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
});

function previewImage(images: string[], index: number) {
  uni.previewImage({ urls: images.map(resolveImg), current: index });
}

function handleReply(r: any) {
  uni.showModal({
    title: '回复评价',
    editable: true,
    placeholderText: '输入回复内容',
    success: async (res) => {
      if (res.confirm && res.content) {
        await replyReview(r.id, res.content);
        uni.showToast({ title: '回复成功', icon: 'success' });
        r.reply = res.content;
      }
    },
  });
}

function handleDelete(r: any) {
  uni.showModal({
    title: '提示', content: '确认删除此评价？',
    success: async (res) => {
      if (res.confirm) {
        await deleteReview(r.id);
        list.value = list.value.filter((i) => i.id !== r.id);
        uni.showToast({ title: '已删除', icon: 'success' });
      }
    },
  });
}

function goVideoReview() {
  uni.navigateTo({ url: '/pages/merchant/video-review/index' });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }
.toolbar { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 24rpx; background: #fff; }
.title { font-size: 32rpx; font-weight: bold; }
.video-btn { position: relative; background: #E6A23C; color: #fff; padding: 10rpx 24rpx; border-radius: 24rpx; font-size: 26rpx; }
.badge { position: absolute; top: -10rpx; right: -10rpx; background: #F56C6C; color: #fff; font-size: 18rpx; min-width: 30rpx; height: 30rpx; line-height: 30rpx; border-radius: 15rpx; text-align: center; padding: 0 6rpx; }
.list { padding: 20rpx 24rpx; }
.review-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.review-header { display: flex; justify-content: space-between; align-items: center; }
.user-info { display: flex; align-items: center; gap: 16rpx; }
.user-avatar { width: 64rpx; height: 64rpx; border-radius: 50%; }
.user-name { font-size: 26rpx; color: #333; display: block; }
.review-date { font-size: 22rpx; color: #999; }
.rating { display: flex; }
.star { font-size: 28rpx; color: #ffd700; }
.review-villa { font-size: 24rpx; color: #409EFF; display: block; margin-top: 12rpx; }
.review-content { font-size: 28rpx; color: #333; display: block; margin-top: 12rpx; line-height: 1.6; }
.review-images { display: flex; gap: 12rpx; margin-top: 16rpx; flex-wrap: wrap; }
.review-img { width: 160rpx; height: 160rpx; border-radius: 8rpx; }
.reply-box { background: #f5f7fa; border-radius: 8rpx; padding: 16rpx; margin-top: 16rpx; }
.reply-label { font-size: 24rpx; color: #409EFF; }
.reply-text { font-size: 24rpx; color: #666; }
.review-actions { display: flex; gap: 16rpx; margin-top: 16rpx; justify-content: flex-end; }
.action-btn { font-size: 24rpx; color: #409EFF; padding: 6rpx 20rpx; border: 1rpx solid #409EFF; border-radius: 20rpx; }
.action-btn.danger { color: #F56C6C; border-color: #F56C6C; }
.empty { padding: 200rpx 0; text-align: center; }
.empty-text { color: #999; }
</style>
