<template>
  <view class="page">
    <text class="page-title">流量分析</text>

    <!-- 时间段选择 -->
    <view class="period-tabs">
      <text class="tab" :class="{active: period === 7}" @tap="period = 7; loadData()">7天</text>
      <text class="tab" :class="{active: period === 30}" @tap="period = 30; loadData()">30天</text>
      <text class="tab" :class="{active: period === 90}" @tap="period = 90; loadData()">90天</text>
    </view>

    <!-- 漏斗数据 -->
    <view class="funnel-section" v-if="overview">
      <text class="section-title">转化漏斗</text>
      <view class="funnel">
        <view class="funnel-item" v-for="(item, i) in funnelData" :key="i">
          <view class="funnel-bar" :style="{width: item.percent + '%'}">
            <text class="funnel-label">{{ item.name }}</text>
            <text class="funnel-value">{{ item.value }}</text>
          </view>
          <text class="funnel-rate" v-if="i > 0">{{ item.rate }}%</text>
        </view>
      </view>
    </view>

    <!-- 渠道分布 -->
    <view class="section" v-if="overview?.channels">
      <text class="section-title">渠道来源</text>
      <view class="channel-list">
        <view class="channel-item" v-for="c in overview.channels" :key="c.name">
          <text class="channel-name">{{ c.name }}</text>
          <view class="channel-bar-wrap">
            <view class="channel-bar" :style="{width: c.percent + '%'}"></view>
          </view>
          <text class="channel-value">{{ c.count }}</text>
        </view>
      </view>
    </view>

    <!-- 热门别墅 -->
    <view class="section" v-if="overview?.topVillas?.length">
      <text class="section-title">热门别墅 (浏览量)</text>
      <view class="top-list">
        <view class="top-item" v-for="(v, i) in overview.topVillas" :key="v.id">
          <text class="top-rank">{{ i + 1 }}</text>
          <text class="top-name">{{ v.name }}</text>
          <text class="top-count">{{ v.views }} 次</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getAnalyticsOverview } from '../../../api/admin';

const period = ref(30);
const overview = ref<any>(null);

const funnelData = computed(() => {
  if (!overview.value) return [];
  const o = overview.value;
  const maxVal = Math.max(o.pageViews || 1, 1);
  return [
    { name: '页面浏览', value: o.pageViews || 0, percent: 100, rate: '' },
    { name: '别墅详情', value: o.villaViews || 0, percent: Math.round(((o.villaViews || 0) / maxVal) * 100), rate: o.pageViews ? Math.round(((o.villaViews || 0) / o.pageViews) * 100) : 0 },
    { name: '预订页面', value: o.bookingViews || 0, percent: Math.round(((o.bookingViews || 0) / maxVal) * 100), rate: o.villaViews ? Math.round(((o.bookingViews || 0) / o.villaViews) * 100) : 0 },
    { name: '创建订单', value: o.orderCreated || 0, percent: Math.round(((o.orderCreated || 0) / maxVal) * 100), rate: o.bookingViews ? Math.round(((o.orderCreated || 0) / o.bookingViews) * 100) : 0 },
  ];
});

onShow(() => loadData());

async function loadData() {
  try { overview.value = await getAnalyticsOverview({ days: period.value }); }
  catch (e) { console.error(e); }
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding: 24rpx; }
.page-title { font-size: 32rpx; font-weight: bold; display: block; margin-bottom: 24rpx; }
.period-tabs { display: flex; gap: 16rpx; margin-bottom: 24rpx; }
.tab { font-size: 26rpx; padding: 10rpx 30rpx; border-radius: 24rpx; background: #fff; color: #666; }
.tab.active { background: #409EFF; color: #fff; }
.section, .funnel-section { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; margin-bottom: 20rpx; }
.funnel-item { margin-bottom: 16rpx; display: flex; align-items: center; }
.funnel-bar {
  background: linear-gradient(90deg, #409EFF, #66b1ff);
  border-radius: 8rpx;
  padding: 12rpx 16rpx;
  display: flex;
  justify-content: space-between;
  min-width: 30%;
}
.funnel-label { font-size: 24rpx; color: #fff; }
.funnel-value { font-size: 24rpx; color: #fff; font-weight: bold; }
.funnel-rate { font-size: 22rpx; color: #999; margin-left: 12rpx; white-space: nowrap; }
.channel-item { display: flex; align-items: center; margin-bottom: 16rpx; }
.channel-name { font-size: 26rpx; color: #333; width: 120rpx; }
.channel-bar-wrap { flex: 1; height: 20rpx; background: #f0f0f0; border-radius: 10rpx; margin: 0 16rpx; }
.channel-bar { height: 100%; background: #FF6B35; border-radius: 10rpx; }
.channel-value { font-size: 24rpx; color: #999; width: 80rpx; text-align: right; }
.top-list { }
.top-item { display: flex; align-items: center; padding: 12rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.top-item:last-child { border-bottom: none; }
.top-rank { font-size: 26rpx; font-weight: bold; color: #999; width: 50rpx; }
.top-name { flex: 1; font-size: 26rpx; color: #333; }
.top-count { font-size: 24rpx; color: #999; }
</style>
