<template>
  <view class="page">
    <text class="page-title">相册管理</text>
    <view class="list">
      <view class="album-card" v-for="a in list" :key="a.id">
        <image v-if="a.coverImage" :src="resolveImg(a.coverImage)" class="album-cover" mode="aspectFill" />
        <view class="album-body">
          <text class="album-title">{{ a.title || '未命名相册' }}</text>
          <text class="album-info">{{ a.villaName }} · {{ a.orderNo }}</text>
          <text class="album-info">创建者: {{ a.creator?.nickname || '-' }} · {{ a.photoCount || 0 }}张</text>
          <text class="album-code">邀请码: {{ a.inviteCode }}</text>
          <view class="album-actions">
            <text class="action-btn" :class="a.status === 1 ? 'danger' : 'success'" @tap="toggleStatus(a)">
              {{ a.status === 1 ? '禁用' : '启用' }}
            </text>
          </view>
        </view>
      </view>
    </view>
    <view class="empty" v-if="!loading && list.length === 0">
      <text class="empty-text">暂无相册</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getAdminAlbums, updateAlbumStatus } from '../../../api/admin';
import { resolveImageUrl } from '../../../utils/request';

const resolveImg = resolveImageUrl;
const list = ref<any[]>([]);
const loading = ref(false);

onShow(async () => {
  loading.value = true;
  try {
    const data = await getAdminAlbums({ page: 1, pageSize: 50 });
    list.value = data.list || data;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
});

async function toggleStatus(a: any) {
  const newStatus = a.status === 1 ? 0 : 1;
  await updateAlbumStatus(a.id, newStatus);
  a.status = newStatus;
  uni.showToast({ title: '操作成功', icon: 'success' });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding: 24rpx; }
.page-title { font-size: 32rpx; font-weight: bold; display: block; margin-bottom: 24rpx; }
.album-card { background: #fff; border-radius: 16rpx; overflow: hidden; margin-bottom: 20rpx; display: flex; }
.album-cover { width: 200rpx; height: 200rpx; flex-shrink: 0; }
.album-body { flex: 1; padding: 20rpx; }
.album-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.album-info { font-size: 22rpx; color: #999; display: block; margin-top: 6rpx; }
.album-code { font-size: 22rpx; color: #409EFF; display: block; margin-top: 6rpx; }
.album-actions { margin-top: 12rpx; }
.action-btn { font-size: 24rpx; padding: 6rpx 20rpx; border-radius: 20rpx; }
.action-btn.danger { color: #F56C6C; border: 1rpx solid #F56C6C; }
.action-btn.success { color: #67C23A; border: 1rpx solid #67C23A; }
.empty { padding: 200rpx 0; text-align: center; }
.empty-text { color: #999; }
</style>
