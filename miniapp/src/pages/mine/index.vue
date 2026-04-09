<template>
  <view class="page">
    <!-- 用户信息头部 -->
    <view class="header">
      <view class="user-info" v-if="userStore.isLoggedIn">
        <image class="avatar" :src="userStore.userInfo?.avatar || '/static/logo.png'" />
        <view class="info">
          <text class="nickname">{{ userStore.userInfo?.nickname || '用户' }}</text>
          <text class="phone">{{ userStore.userInfo?.phone || '未绑定手机' }}</text>
        </view>
        <view class="msg-icon" @tap="goMessages">
          🔔
          <view class="badge" v-if="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</view>
        </view>
      </view>
      <view class="user-info" v-else @tap="handleLogin">
        <image class="avatar" src="/static/logo.png" />
        <view class="info">
          <text class="nickname">点击登录</text>
        </view>
      </view>
    </view>

    <!-- 数据统计卡 -->
    <view class="stats-card">
      <view class="stat-item" @tap="goOrders(-1)">
        <text class="stat-num">{{ stats.orderTotal }}</text>
        <text class="stat-label">全部订单</text>
      </view>
      <view class="stat-item" @tap="goOrders(0)">
        <text class="stat-num">{{ stats.pendingPay }}</text>
        <text class="stat-label">待支付</text>
      </view>
      <view class="stat-item" @tap="goOrders(2)">
        <text class="stat-num">{{ stats.ongoing }}</text>
        <text class="stat-label">进行中</text>
      </view>
      <view class="stat-item" @tap="goOrders(5)">
        <text class="stat-num">{{ stats.completed }}</text>
        <text class="stat-label">已完成</text>
      </view>
    </view>

    <!-- 我的服务 -->
    <view class="section">
      <text class="section-title">我的服务</text>
      <view class="menu-grid">
        <view class="menu-item" v-for="item in menuItems" :key="item.name" @tap="goPage(item.url)">
          <text class="menu-icon">{{ item.icon }}</text>
          <text class="menu-name">{{ item.name }}</text>
        </view>
      </view>
    </view>

    <!-- 其他设置 -->
    <view class="section">
      <text class="section-title">其他</text>
      <view class="list-menu">
        <view class="list-item" @tap="goContact">
          <text class="list-icon">💬</text>
          <text class="list-name">联系客服</text>
          <text class="list-arrow">›</text>
        </view>
        <view class="list-item" @tap="goAbout">
          <text class="list-icon">ℹ️</text>
          <text class="list-name">关于我们</text>
          <text class="list-arrow">›</text>
        </view>
        <view class="list-item" v-if="userStore.isLoggedIn" @tap="handleLogout">
          <text class="list-icon">🚪</text>
          <text class="list-name">退出登录</text>
          <text class="list-arrow">›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '../../store/user';
import { getMineStats } from '../../api/home';
import { getUnreadCount } from '../../api/message';

const userStore = useUserStore();
const stats = ref({ orderTotal: 0, pendingPay: 0, ongoing: 0, completed: 0, albumCount: 0, postCount: 0 });
const unreadCount = ref(0);

const menuItems = [
  { name: '我的相册', icon: '📸', url: '/pages/album/index' },
  { name: '我的帖子', icon: '💬', url: '/pages/community/index' },
  { name: 'AI 策划', icon: '🤖', url: '/pages/planner/index' },
  { name: '入住清单', icon: '📋', url: '/pages/order/index' },
  { name: '活动方案', icon: '🎭', url: '/pages/plan/index' },
  { name: '氛围包', icon: '✨', url: '/pages/theme-pack/index' },
];

onShow(async () => {
  if (userStore.isLoggedIn) {
    try {
      stats.value = await getMineStats();
      const res = await getUnreadCount();
      unreadCount.value = res.count || 0;
    } catch (e) { console.error(e); }
  }
});

async function handleLogin() {
  try {
    await userStore.login();
    uni.showToast({ title: '登录成功', icon: 'success' });
  } catch (e) { console.error(e); }
}

function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确认退出登录？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout();
        uni.showToast({ title: '已退出', icon: 'none' });
      }
    },
  });
}

function goOrders(_status: number) {
  uni.switchTab({ url: '/pages/order/index' });
}

// tab bar 页面白名单
const TAB_PAGES = ['/pages/index/index', '/pages/community/index', '/pages/order/index', '/pages/mine/index'];

function goPage(url: string) {
  const path = url.split('?')[0];
  if (TAB_PAGES.includes(path)) {
    uni.switchTab({ url: path });
  } else {
    uni.navigateTo({ url });
  }
}

function goMessages() {
  uni.navigateTo({ url: '/pages/message/index' });
}

function goContact() {
  uni.showToast({ title: '客服电话：400-xxx-xxxx', icon: 'none' });
}

function goAbout() {
  uni.showToast({ title: '别墅轰趴 v1.0', icon: 'none' });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding-bottom: 40rpx; }

.header {
  background: linear-gradient(135deg, #ff6b35, #ff8f65);
  padding: 80rpx 30rpx 100rpx;
}
.user-info { display: flex; align-items: center; gap: 24rpx; }
.avatar { width: 120rpx; height: 120rpx; border-radius: 50%; background: #fff; border: 4rpx solid rgba(255,255,255,0.3); }
.info { flex: 1; }
.nickname { font-size: 34rpx; color: #fff; font-weight: bold; display: block; }
.phone { font-size: 24rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; display: block; }
.msg-icon {
  position: relative;
  width: 60rpx; height: 60rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 36rpx;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
}
.badge {
  position: absolute; top: -4rpx; right: -4rpx;
  background: #e74c3c; color: #fff;
  font-size: 18rpx; padding: 2rpx 10rpx;
  border-radius: 20rpx; min-width: 28rpx;
  text-align: center;
}

.stats-card {
  background: #fff; margin: -40rpx 20rpx 20rpx;
  padding: 30rpx 0; border-radius: 16rpx;
  display: flex;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
}
.stat-item {
  flex: 1; text-align: center;
  display: flex; flex-direction: column; align-items: center;
}
.stat-num { font-size: 40rpx; font-weight: bold; color: #333; }
.stat-label { font-size: 22rpx; color: #999; margin-top: 6rpx; }

.section { margin: 30rpx 20rpx; }
.section-title { font-size: 28rpx; color: #333; font-weight: bold; display: block; margin-bottom: 20rpx; }

.menu-grid {
  background: #fff; border-radius: 16rpx; padding: 30rpx 0;
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 20rpx 0;
}
.menu-item { display: flex; flex-direction: column; align-items: center; gap: 10rpx; }
.menu-icon { font-size: 52rpx; }
.menu-name { font-size: 22rpx; color: #333; }

.list-menu { background: #fff; border-radius: 16rpx; overflow: hidden; }
.list-item {
  display: flex; align-items: center; padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}
.list-item:last-child { border-bottom: none; }
.list-icon { font-size: 36rpx; margin-right: 20rpx; }
.list-name { flex: 1; font-size: 28rpx; color: #333; }
.list-arrow { font-size: 36rpx; color: #ccc; }
</style>
