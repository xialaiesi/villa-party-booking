<template>
  <view class="page">
    <!-- 顶部欢迎 -->
    <view class="header">
      <view class="header-info">
        <text class="welcome">{{ greeting }}</text>
        <text class="merchant-name">{{ adminInfo?.merchantName || '管理员' }}</text>
      </view>
      <view class="header-actions">
        <view class="msg-btn" @tap="goMessages">
          <text>消息</text>
          <view class="dot" v-if="unreadCount > 0"></view>
        </view>
        <view class="switch-btn" @tap="switchToCustomer">客户端</view>
      </view>
    </view>

    <!-- 今日/本月数据 -->
    <view class="stats-grid">
      <view class="stat-card orange">
        <text class="stat-value">{{ stats.today?.orders || 0 }}</text>
        <text class="stat-label">今日订单</text>
      </view>
      <view class="stat-card green">
        <text class="stat-value">¥{{ stats.today?.revenue || 0 }}</text>
        <text class="stat-label">今日收入</text>
      </view>
      <view class="stat-card blue">
        <text class="stat-value">{{ stats.month?.orders || 0 }}</text>
        <text class="stat-label">本月订单</text>
      </view>
      <view class="stat-card purple">
        <text class="stat-value">¥{{ stats.month?.revenue || 0 }}</text>
        <text class="stat-label">本月收入</text>
      </view>
    </view>

    <!-- 待处理 -->
    <view class="pending-section" v-if="pendingItems">
      <text class="section-title">待处理事项</text>
      <view class="pending-grid">
        <view class="pending-item" @tap="goPage('/pages/merchant/order-manage/index?status=0')">
          <text class="pending-num">{{ pendingItems.pendingOrders || 0 }}</text>
          <text class="pending-label">待确认订单</text>
        </view>
        <view class="pending-item" @tap="goPage('/pages/merchant/order-manage/index?status=1')">
          <text class="pending-num">{{ pendingItems.pendingDepositOrders || 0 }}</text>
          <text class="pending-label">待付定金</text>
        </view>
        <view class="pending-item" @tap="goPage('/pages/merchant/video-review/index')">
          <text class="pending-num">{{ pendingItems.pendingVideoReviews || 0 }}</text>
          <text class="pending-label">待审视频</text>
        </view>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="quick-section">
      <text class="section-title">快捷管理</text>
      <view class="quick-grid">
        <view class="quick-item" v-for="item in quickMenu" :key="item.name" @tap="goPage(item.url)">
          <text class="quick-icon">{{ item.icon }}</text>
          <text class="quick-name">{{ item.name }}</text>
        </view>
      </view>
    </view>

    <!-- 热门别墅 -->
    <view class="section" v-if="hotVillas.length">
      <text class="section-title">热门别墅 Top5</text>
      <view class="hot-list">
        <view class="hot-item" v-for="(v, i) in hotVillas" :key="v.id">
          <text class="hot-rank" :class="'rank-' + i">{{ i + 1 }}</text>
          <text class="hot-name">{{ v.name }}</text>
          <text class="hot-count">{{ v.orderCount }} 单</text>
        </view>
      </view>
    </view>

    <!-- 最近订单 -->
    <view class="section" v-if="recentOrders.length">
      <view class="section-header">
        <text class="section-title">最近订单</text>
        <text class="section-more" @tap="goPage('/pages/merchant/order-manage/index')">查看全部</text>
      </view>
      <view class="order-list">
        <view class="order-item" v-for="o in recentOrders" :key="o.id" @tap="goOrderDetail(o.id)">
          <view class="order-top">
            <text class="order-no">{{ o.orderNo }}</text>
            <text class="order-status" :style="{color: statusColor(o.status)}">{{ statusText(o.status) }}</text>
          </view>
          <view class="order-mid">
            <text class="order-villa">{{ o.villa?.name }}</text>
            <text class="order-amount">¥{{ o.totalAmount }}</text>
          </view>
          <text class="order-date">{{ o.checkIn }} ~ {{ o.checkOut }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useMerchantStore } from '../../../store/merchant';
import { getDashboardStats, getDashboardHotVillas, getDashboardRecentOrders, getAdminUnreadCount } from '../../../api/admin';

const merchantStore = useMerchantStore();
const adminInfo = ref(merchantStore.adminInfo);

const stats = ref<any>({});
const pendingItems = ref<any>({});
const hotVillas = ref<any[]>([]);
const recentOrders = ref<any[]>([]);
const unreadCount = ref(0);

const STATUS_MAP: Record<number, { text: string; color: string }> = {
  0: { text: '待付定金', color: '#E6A23C' },
  1: { text: '待确认', color: '#409EFF' },
  2: { text: '待付尾款', color: '#E6A23C' },
  3: { text: '待入住', color: '#67C23A' },
  4: { text: '已入住', color: '#909399' },
  5: { text: '已完成', color: '#67C23A' },
  6: { text: '已取消', color: '#909399' },
  7: { text: '已拒绝', color: '#F56C6C' },
};

const statusText = (s: number) => STATUS_MAP[s]?.text || '未知';
const statusColor = (s: number) => STATUS_MAP[s]?.color || '#999';

const greeting = ref('');
function setGreeting() {
  const h = new Date().getHours();
  if (h < 12) greeting.value = '上午好';
  else if (h < 18) greeting.value = '下午好';
  else greeting.value = '晚上好';
}

const quickMenu = [
  { name: '房源管理', icon: '🏠', url: '/pages/merchant/villa-manage/index' },
  { name: '房态日历', icon: '📅', url: '/pages/merchant/calendar/index' },
  { name: '套餐管理', icon: '📦', url: '/pages/merchant/package/index' },
  { name: '订单管理', icon: '📋', url: '/pages/merchant/order-manage/index' },
  { name: '客户咨询', icon: '💬', url: '/pages/merchant/chat/index' },
  { name: '评价管理', icon: '⭐', url: '/pages/merchant/review/index' },
  { name: '活动方案', icon: '🎭', url: '/pages/merchant/activity-plan/index' },
  { name: '氛围包', icon: '✨', url: '/pages/merchant/theme-pack/index' },
  { name: '财务中心', icon: '💰', url: '/pages/merchant/finance/index' },
  { name: '周边服务', icon: '🍳', url: '/pages/merchant/local-service/index' },
  { name: '限定活动', icon: '🎉', url: '/pages/merchant/seasonal-event/index' },
  { name: '设施管理', icon: '🔧', url: '/pages/merchant/facility/index' },
  { name: '种草笔记', icon: '📝', url: '/pages/merchant/xhs-note/index' },
  { name: '站点配置', icon: '⚙️', url: '/pages/merchant/site-config/index' },
  { name: '流量分析', icon: '📊', url: '/pages/merchant/analytics/index' },
  { name: '相册管理', icon: '📸', url: '/pages/merchant/album/index' },
  { name: '视频审核', icon: '🎬', url: '/pages/merchant/video-review/index' },
  { name: '商家管理', icon: '🏢', url: '/pages/merchant/merchant-manage/index' },
];

onShow(async () => {
  if (!merchantStore.isLoggedIn) {
    uni.redirectTo({ url: '/pages/merchant/login/index' });
    return;
  }
  setGreeting();
  try {
    const [statsData, villas, orders] = await Promise.all([
      getDashboardStats(),
      getDashboardHotVillas(),
      getDashboardRecentOrders(),
    ]);
    stats.value = statsData;
    pendingItems.value = statsData.pendingItems || {};
    hotVillas.value = villas || [];
    recentOrders.value = orders || [];
    const countRes = await getAdminUnreadCount().catch(() => ({ count: 0 }));
    unreadCount.value = countRes.count || 0;
  } catch (e) {
    console.error(e);
  }
});

function goPage(url: string) {
  uni.navigateTo({ url });
}

function goOrderDetail(id: number) {
  uni.navigateTo({ url: `/pages/merchant/order-detail/index?id=${id}` });
}

function goMessages() {
  uni.navigateTo({ url: '/pages/merchant/message/index' });
}

function switchToCustomer() {
  uni.switchTab({ url: '/pages/index/index' });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding-bottom: 40rpx; }

.header {
  background: linear-gradient(135deg, #409EFF, #66b1ff);
  padding: 60rpx 30rpx 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.welcome { font-size: 26rpx; color: rgba(255,255,255,0.8); display: block; }
.merchant-name { font-size: 36rpx; color: #fff; font-weight: bold; display: block; margin-top: 8rpx; }
.header-actions { display: flex; gap: 16rpx; }
.msg-btn, .switch-btn {
  position: relative;
  background: rgba(255,255,255,0.2);
  color: #fff;
  font-size: 24rpx;
  padding: 10rpx 24rpx;
  border-radius: 24rpx;
}
.dot {
  position: absolute; top: 4rpx; right: 4rpx;
  width: 14rpx; height: 14rpx;
  background: #F56C6C; border-radius: 50%;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin: -20rpx 24rpx 24rpx;
}
.stat-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}
.stat-value { font-size: 40rpx; font-weight: bold; display: block; }
.stat-label { font-size: 22rpx; color: #999; display: block; margin-top: 8rpx; }
.stat-card.orange .stat-value { color: #FF6B35; }
.stat-card.green .stat-value { color: #67C23A; }
.stat-card.blue .stat-value { color: #409EFF; }
.stat-card.purple .stat-value { color: #764ba2; }

.pending-section, .quick-section, .section {
  margin: 24rpx;
}
.section-title { font-size: 30rpx; font-weight: bold; color: #333; display: block; margin-bottom: 20rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.section-more { font-size: 24rpx; color: #999; }

.pending-grid {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx 0;
}
.pending-item {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.pending-num { font-size: 44rpx; font-weight: bold; color: #F56C6C; }
.pending-label { font-size: 22rpx; color: #999; margin-top: 8rpx; }

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx 0;
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx 0;
}
.quick-item { display: flex; flex-direction: column; align-items: center; gap: 10rpx; }
.quick-icon { font-size: 48rpx; }
.quick-name { font-size: 22rpx; color: #333; }

.hot-list {
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
}
.hot-item {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.hot-item:last-child { border-bottom: none; }
.hot-rank {
  width: 44rpx; height: 44rpx;
  line-height: 44rpx;
  text-align: center;
  border-radius: 8rpx;
  font-size: 24rpx;
  font-weight: bold;
  color: #999;
  background: #f5f5f5;
  margin-right: 20rpx;
}
.rank-0 { background: #ffd700; color: #fff; }
.rank-1 { background: #c0c0c0; color: #fff; }
.rank-2 { background: #cd7f32; color: #fff; }
.hot-name { flex: 1; font-size: 28rpx; color: #333; }
.hot-count { font-size: 24rpx; color: #999; }

.order-list { background: #fff; border-radius: 16rpx; overflow: hidden; }
.order-item { padding: 24rpx; border-bottom: 1rpx solid #f5f5f5; }
.order-item:last-child { border-bottom: none; }
.order-top { display: flex; justify-content: space-between; align-items: center; }
.order-no { font-size: 24rpx; color: #999; }
.order-status { font-size: 24rpx; font-weight: 500; }
.order-mid { display: flex; justify-content: space-between; margin-top: 12rpx; }
.order-villa { font-size: 28rpx; color: #333; font-weight: 500; }
.order-amount { font-size: 28rpx; color: #FF6B35; font-weight: bold; }
.order-date { font-size: 22rpx; color: #999; display: block; margin-top: 8rpx; }
</style>
