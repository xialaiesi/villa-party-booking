<template>
  <view class="page">
    <view class="user-card">
      <image class="avatar" :src="userStore.userInfo?.avatar || '/static/default-avatar.png'" />
      <view class="user-info" v-if="userStore.isLoggedIn">
        <text class="nickname">{{ userStore.userInfo?.nickname || '用户' }}</text>
        <text class="phone">{{ userStore.userInfo?.phone || '' }}</text>
      </view>
      <view class="user-info" v-else @tap="handleLogin">
        <text class="nickname">点击登录</text>
      </view>
    </view>

    <view class="menu-list">
      <view class="menu-item" @tap="goOrders(-1)">
        <text>全部订单</text><text class="arrow">></text>
      </view>
      <view class="menu-item" @tap="goOrders(0)">
        <text>待支付</text><text class="arrow">></text>
      </view>
      <view class="menu-item" @tap="goOrders(2)">
        <text>待入住</text><text class="arrow">></text>
      </view>
      <view class="menu-item" @tap="goOrders(5)">
        <text>已完成</text><text class="arrow">></text>
      </view>
    </view>

    <view class="menu-list" v-if="userStore.isLoggedIn">
      <view class="menu-item" @tap="handleLogout">
        <text>退出登录</text><text class="arrow">></text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useUserStore } from '../../store/user';

const userStore = useUserStore();

async function handleLogin() {
  try {
    await userStore.login();
    uni.showToast({ title: '登录成功', icon: 'success' });
  } catch (e) {
    console.error(e);
  }
}

function handleLogout() {
  userStore.logout();
  uni.showToast({ title: '已退出', icon: 'none' });
}

function goOrders(status: number) {
  uni.switchTab({ url: '/pages/order/index' });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }
.user-card { background: #ff6b35; padding: 60rpx 30rpx; display: flex; align-items: center; }
.avatar { width: 120rpx; height: 120rpx; border-radius: 50%; background: #fff; }
.user-info { margin-left: 24rpx; }
.nickname { font-size: 34rpx; color: #fff; font-weight: bold; display: block; }
.phone { font-size: 26rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; display: block; }
.menu-list { background: #fff; margin: 20rpx; border-radius: 12rpx; overflow: hidden; }
.menu-item { display: flex; justify-content: space-between; align-items: center; padding: 30rpx; border-bottom: 1rpx solid #f5f5f5; font-size: 28rpx; color: #333; }
.arrow { color: #ccc; }
</style>
