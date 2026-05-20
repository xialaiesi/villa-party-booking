<template>
  <view class="page">
    <view class="logo-area">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <text class="title">商家管理中心</text>
      <text class="subtitle">Villa Party Booking</text>
    </view>

    <view class="form-area">
      <view class="input-group">
        <text class="input-label">账号</text>
        <input class="input" v-model="username" placeholder="请输入商家账号" />
      </view>
      <view class="input-group">
        <text class="input-label">密码</text>
        <input class="input" v-model="password" placeholder="请输入密码" password />
      </view>
      <button class="btn-login" :loading="loading" @tap="handleLogin">登 录</button>
    </view>

    <view class="back" @tap="goBack">
      <text class="back-text">← 返回客户端</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useMerchantStore } from '../../../store/merchant';

const merchantStore = useMerchantStore();
const username = ref('');
const password = ref('');
const loading = ref(false);

async function handleLogin() {
  if (!username.value || !password.value) {
    uni.showToast({ title: '请输入账号和密码', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    await merchantStore.login(username.value, password.value);
    uni.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => {
      uni.redirectTo({ url: '/pages/merchant/dashboard/index' });
    }, 500);
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function goBack() {
  uni.navigateBack();
}
</script>

<style lang="scss">
.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #409EFF 0%, #2b7de9 50%, #f5f5f5 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 160rpx;
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}
.logo { width: 140rpx; height: 140rpx; border-radius: 28rpx; }
.title { font-size: 40rpx; color: #fff; font-weight: bold; margin-top: 24rpx; }
.subtitle { font-size: 24rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; }

.form-area {
  width: 85%;
  background: #fff;
  border-radius: 24rpx;
  padding: 50rpx 40rpx;
  box-shadow: 0 8rpx 40rpx rgba(0,0,0,0.1);
}
.input-group { margin-bottom: 36rpx; }
.input-label { font-size: 26rpx; color: #666; display: block; margin-bottom: 12rpx; }
.input {
  width: 100%;
  height: 88rpx;
  background: #f5f7fa;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  box-sizing: border-box;
}

.btn-login {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, #409EFF, #66b1ff);
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  border-radius: 44rpx;
  margin-top: 20rpx;
}
.btn-login::after { border: none; }

.back {
  margin-top: 40rpx;
  padding: 20rpx;
}
.back-text { color: #fff; font-size: 28rpx; }
</style>
