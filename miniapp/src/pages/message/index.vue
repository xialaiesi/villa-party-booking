<template>
  <view class="page">
    <view class="header">
      <text class="header-title">消息中心</text>
      <text class="read-all" @tap="markAllRead">全部已读</text>
    </view>

    <view v-if="messages.length" class="msg-list">
      <view
        class="msg-item"
        :class="{ unread: !msg.read }"
        v-for="msg in messages"
        :key="msg.id"
        @tap="handleTap(msg)"
      >
        <view class="msg-icon">{{ iconOf(msg.type) }}</view>
        <view class="msg-body">
          <view class="msg-header">
            <text class="msg-title">{{ msg.title }}</text>
            <text class="msg-time">{{ formatTime(msg.createdAt) }}</text>
          </view>
          <text class="msg-content">{{ msg.content }}</text>
        </view>
        <view v-if="!msg.read" class="unread-dot"></view>
      </view>
    </view>

    <Empty v-else icon="📭" text="暂无消息" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listMessages, readMessage, readAllMessages } from '../../api/message';
import Empty from '../../components/Empty.vue';

const messages = ref<any[]>([]);

onMounted(async () => {
  messages.value = await listMessages();
});

async function handleTap(msg: any) {
  if (!msg.read) {
    await readMessage(msg.id);
    msg.read = true;
  }
  if (msg.link) {
    uni.navigateTo({ url: msg.link });
  }
}

async function markAllRead() {
  await readAllMessages();
  messages.value.forEach((m) => (m.read = true));
  uni.showToast({ title: '已全部标记', icon: 'success' });
}

function iconOf(type: string) {
  return { order: '📦', system: '🔔', activity: '🎉' }[type] || '📬';
}

function formatTime(d: string) {
  return new Date(d).toLocaleDateString();
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }
.header {
  background: #fff; padding: 30rpx;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1rpx solid #f0f0f0;
}
.header-title { font-size: 32rpx; font-weight: bold; color: #333; }
.read-all { font-size: 24rpx; color: #ff6b35; }

.msg-list { padding: 20rpx; }
.msg-item {
  display: flex; gap: 20rpx; background: #fff;
  padding: 24rpx; border-radius: 12rpx; margin-bottom: 16rpx;
  position: relative; align-items: flex-start;
}
.msg-item.unread { background: #fff8f5; }
.msg-icon { font-size: 40rpx; }
.msg-body { flex: 1; }
.msg-header { display: flex; justify-content: space-between; align-items: center; }
.msg-title { font-size: 28rpx; font-weight: bold; color: #333; }
.msg-time { font-size: 22rpx; color: #999; }
.msg-content { font-size: 24rpx; color: #666; margin-top: 8rpx; display: block; line-height: 1.6; }
.unread-dot {
  position: absolute; top: 30rpx; right: 30rpx;
  width: 16rpx; height: 16rpx; border-radius: 50%; background: #ff6b35;
}
</style>
