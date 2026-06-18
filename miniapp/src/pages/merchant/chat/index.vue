<template>
  <view class="page">
    <view class="chat-list">
      <view class="chat-card" v-for="c in chats" :key="c.id" @tap="goDetail(c)">
        <image class="avatar" :src="resolveImg(c.userAvatar) || defaultAvatar" mode="aspectFill" />
        <view class="chat-info">
          <view class="row1">
            <text class="name">{{ c.userNickname || '客户' }}</text>
            <text class="time">{{ fmtTime(c.lastMessageAt) }}</text>
          </view>
          <view class="row2">
            <text class="last-msg">{{ c.lastMessage || '暂无消息' }}</text>
            <view class="badge" v-if="c.unread > 0">{{ c.unread }}</view>
          </view>
          <text class="villa">{{ c.villaName }} · {{ c.orderNo }}</text>
        </view>
      </view>
    </view>

    <view v-if="chats.length === 0" class="empty"><text>暂无客户咨询</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getAdminChats } from '../../../api/admin';
import { resolveImageUrl } from '../../../utils/request';

const resolveImg = resolveImageUrl;
const defaultAvatar = 'https://cdn-icons-png.flaticon.com/512/847/847969.png';
const chats = ref<any[]>([]);

onShow(() => { load(); });

async function load() {
  try {
    const res = await getAdminChats();
    chats.value = res.list;
  } catch (e) {
    console.error(e);
  }
}

function goDetail(c: any) {
  uni.navigateTo({ url: `/pages/merchant/chat/detail?id=${c.id}&name=${encodeURIComponent(c.userNickname || '客户')}` });
}

function fmtTime(t: string) {
  if (!t) return '';
  const d = new Date(t);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }
.chat-list { padding: 16rpx; }
.chat-card {
  display: flex; align-items: center; background: #fff;
  border-radius: 12rpx; padding: 24rpx; margin-bottom: 16rpx;
}
.avatar { width: 88rpx; height: 88rpx; border-radius: 50%; background: #eee; }
.chat-info { flex: 1; margin-left: 20rpx; overflow: hidden; }
.row1 { display: flex; justify-content: space-between; align-items: center; }
.name { font-size: 30rpx; font-weight: bold; color: #333; }
.time { font-size: 22rpx; color: #999; }
.row2 { display: flex; justify-content: space-between; align-items: center; margin-top: 8rpx; }
.last-msg { flex: 1; font-size: 26rpx; color: #999; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.badge {
  min-width: 32rpx; height: 32rpx; line-height: 32rpx; text-align: center; padding: 0 8rpx;
  background: #ff3b30; color: #fff; font-size: 22rpx; border-radius: 16rpx; margin-left: 12rpx;
}
.villa { font-size: 22rpx; color: #bbb; display: block; margin-top: 8rpx; }
.empty { text-align: center; padding: 200rpx 0; color: #999; }
</style>
