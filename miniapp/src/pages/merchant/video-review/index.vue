<template>
  <view class="page">
    <text class="page-title">视频审核</text>

    <view class="list">
      <view class="video-card" v-for="r in list" :key="r.id">
        <view class="video-info">
          <text class="video-user">{{ r.user?.nickname || '用户' }}</text>
          <text class="video-villa">{{ r.villa?.name }}</text>
        </view>

        <view class="video-list" v-if="r.videos?.length">
          <view class="video-item" v-for="(v, i) in r.videos" :key="i">
            <video :src="v.url" :poster="v.cover" class="video-player" controls />
            <view class="video-status">
              <text class="status-tag" :class="getStatusClass(v.status)">{{ getStatusText(v.status) }}</text>
            </view>
          </view>
        </view>

        <view class="video-actions" v-if="hasUnapproved(r)">
          <button class="btn-approve" @tap="handleApprove(r)">通过</button>
          <button class="btn-reject" @tap="handleReject(r)">拒绝</button>
        </view>
      </view>
    </view>

    <view class="empty" v-if="!loading && list.length === 0">
      <text class="empty-text">暂无待审核视频</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getPendingVideos, videoReview } from '../../../api/admin';

const list = ref<any[]>([]);
const loading = ref(false);

function getStatusText(s: number) {
  if (s === 0) return '待审核';
  if (s === 1) return '已通过';
  return '已拒绝';
}
function getStatusClass(s: number) {
  if (s === 0) return 'pending';
  if (s === 1) return 'approved';
  return 'rejected';
}
function hasUnapproved(r: any) {
  return r.videos?.some((v: any) => v.status === 0);
}

onShow(async () => {
  loading.value = true;
  try { list.value = await getPendingVideos() || []; }
  catch (e) { console.error(e); }
  finally { loading.value = false; }
});

async function handleApprove(r: any) {
  await videoReview(r.id, { approved: true });
  uni.showToast({ title: '已通过', icon: 'success' });
  list.value = list.value.filter((i) => i.id !== r.id);
}

function handleReject(r: any) {
  uni.showModal({
    title: '拒绝原因',
    editable: true,
    placeholderText: '输入拒绝原因',
    success: async (res) => {
      if (res.confirm) {
        await videoReview(r.id, { approved: false, reason: res.content });
        uni.showToast({ title: '已拒绝', icon: 'success' });
        list.value = list.value.filter((i) => i.id !== r.id);
      }
    },
  });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding: 24rpx; }
.page-title { font-size: 32rpx; font-weight: bold; display: block; margin-bottom: 24rpx; }
.video-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.video-info { margin-bottom: 16rpx; }
.video-user { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.video-villa { font-size: 24rpx; color: #999; display: block; margin-top: 4rpx; }
.video-item { margin-bottom: 16rpx; }
.video-player { width: 100%; height: 400rpx; border-radius: 12rpx; }
.video-status { margin-top: 8rpx; }
.status-tag { font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 8rpx; }
.status-tag.pending { background: rgba(230,162,60,0.1); color: #E6A23C; }
.status-tag.approved { background: rgba(103,194,58,0.1); color: #67C23A; }
.status-tag.rejected { background: rgba(245,108,108,0.1); color: #F56C6C; }
.video-actions { display: flex; gap: 20rpx; margin-top: 20rpx; }
.btn-approve { flex: 1; height: 72rpx; line-height: 72rpx; background: #67C23A; color: #fff; border: none; border-radius: 36rpx; font-size: 28rpx; }
.btn-approve::after { border: none; }
.btn-reject { flex: 1; height: 72rpx; line-height: 72rpx; background: #fff; color: #F56C6C; border: 2rpx solid #F56C6C; border-radius: 36rpx; font-size: 28rpx; }
.btn-reject::after { border: none; }
.empty { padding: 200rpx 0; text-align: center; }
.empty-text { color: #999; }
</style>
