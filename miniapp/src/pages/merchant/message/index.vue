<template>
  <view class="page">
    <view class="toolbar">
      <text class="title">消息中心</text>
      <text class="read-all" @tap="handleReadAll" v-if="list.length">全部已读</text>
    </view>
    <view class="list">
      <view class="msg-item" :class="{unread: !m.readAt}" v-for="m in list" :key="m.id" @tap="handleRead(m)">
        <view class="msg-icon">
          <text>{{ m.type === 'order' ? '📋' : m.type === 'review' ? '⭐' : '🔔' }}</text>
        </view>
        <view class="msg-body">
          <text class="msg-title">{{ m.title }}</text>
          <text class="msg-content">{{ m.content }}</text>
          <text class="msg-time">{{ formatDate(m.createdAt) }}</text>
        </view>
        <view class="unread-dot" v-if="!m.readAt"></view>
      </view>
    </view>
    <view class="empty" v-if="list.length === 0">
      <text class="empty-text">暂无消息</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getAdminMessages, readAdminMessage, readAllAdminMessages } from '../../../api/admin';

const list = ref<any[]>([]);

function formatDate(d: string) { return d ? d.replace('T', ' ').slice(0, 16) : ''; }

onShow(async () => {
  try {
    const data = await getAdminMessages({ page: 1, pageSize: 50 });
    list.value = data.list || data;
  } catch (e) { console.error(e); }
});

async function handleRead(m: any) {
  if (!m.readAt) {
    await readAdminMessage(m.id);
    m.readAt = new Date().toISOString();
  }
}

async function handleReadAll() {
  await readAllAdminMessages();
  list.value.forEach((m) => { if (!m.readAt) m.readAt = new Date().toISOString(); });
  uni.showToast({ title: '全部已读', icon: 'success' });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }
.toolbar { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 24rpx; background: #fff; }
.title { font-size: 32rpx; font-weight: bold; }
.read-all { font-size: 26rpx; color: #409EFF; }
.list { padding: 0 24rpx; }
.msg-item {
  display: flex; align-items: center; gap: 20rpx;
  background: #fff; border-radius: 12rpx; padding: 24rpx; margin-top: 16rpx;
  position: relative;
}
.msg-item.unread { background: #f0f7ff; }
.msg-icon { font-size: 40rpx; }
.msg-body { flex: 1; }
.msg-title { font-size: 28rpx; color: #333; font-weight: 500; display: block; }
.msg-content { font-size: 24rpx; color: #999; display: block; margin-top: 6rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.msg-time { font-size: 22rpx; color: #ccc; display: block; margin-top: 6rpx; }
.unread-dot { width: 16rpx; height: 16rpx; background: #F56C6C; border-radius: 50%; }
.empty { padding: 200rpx 0; text-align: center; }
.empty-text { color: #999; }
</style>
