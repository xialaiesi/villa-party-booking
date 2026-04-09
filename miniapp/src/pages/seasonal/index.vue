<template>
  <view class="page">
    <view class="banner">
      <text class="banner-title">限定体验</text>
      <text class="banner-sub">限时限量，错过等一年</text>
    </view>

    <view class="event-list">
      <view class="event-card" v-for="event in events" :key="event.id">
        <image v-if="event.coverImage" :src="event.coverImage" class="event-cover" mode="aspectFill" />
        <view class="event-body">
          <view class="event-header">
            <text class="event-name">{{ event.name }}</text>
            <text class="season-tag">{{ seasonLabel(event.season) }}</text>
          </view>
          <text class="event-desc">{{ event.description }}</text>
          <view class="event-meta">
            <text class="event-date">{{ event.startDate?.split('T')[0] }} ~ {{ event.endDate?.split('T')[0] }}</text>
            <text class="event-remaining" v-if="event.remaining !== null">剩余 {{ event.remaining }} 个名额</text>
          </view>
          <view class="event-footer">
            <text class="discount" v-if="event.discount">立减 ¥{{ event.discount }}</text>
            <view class="grab-btn" @tap="goVilla(event)">立即抢购</view>
          </view>
        </view>
      </view>
    </view>
    <view v-if="!events.length" class="empty"><text>暂无限定活动</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listEvents } from '../../api/seasonal-event';

const events = ref<any[]>([]);
onMounted(async () => { events.value = await listEvents(); });

function seasonLabel(s: string) {
  const map: Record<string, string> = { spring: '春日', summer: '夏日', autumn: '秋日', winter: '冬日' };
  return map[s] || s;
}

function goVilla(event: any) {
  if (event.villaId) uni.navigateTo({ url: `/pages/villa/index?id=${event.villaId}` });
}
</script>

<style lang="scss">
.page { background: #1a1a2e; min-height: 100vh; }
.banner { padding: 60rpx 30rpx; text-align: center; }
.banner-title { font-size: 44rpx; font-weight: bold; color: #ffd700; display: block; }
.banner-sub { font-size: 26rpx; color: rgba(255,255,255,0.6); margin-top: 8rpx; display: block; }
.event-list { padding: 0 20rpx 20rpx; }
.event-card { background: #252547; border-radius: 16rpx; overflow: hidden; margin-bottom: 20rpx; border: 1rpx solid rgba(255,215,0,0.2); }
.event-cover { width: 100%; height: 350rpx; }
.event-body { padding: 24rpx; }
.event-header { display: flex; justify-content: space-between; align-items: center; }
.event-name { font-size: 32rpx; font-weight: bold; color: #fff; }
.season-tag { font-size: 22rpx; color: #ffd700; background: rgba(255,215,0,0.15); padding: 4rpx 16rpx; border-radius: 20rpx; }
.event-desc { font-size: 26rpx; color: rgba(255,255,255,0.7); margin-top: 12rpx; display: block; }
.event-meta { display: flex; justify-content: space-between; margin-top: 16rpx; font-size: 22rpx; color: rgba(255,255,255,0.5); }
.event-remaining { color: #ff6b35; }
.event-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; }
.discount { font-size: 28rpx; color: #ffd700; font-weight: bold; }
.grab-btn { background: linear-gradient(135deg, #ffd700, #ff6b35); color: #1a1a2e; padding: 14rpx 40rpx; border-radius: 30rpx; font-size: 26rpx; font-weight: bold; }
.empty { text-align: center; padding: 200rpx 0; color: rgba(255,255,255,0.4); }
</style>
