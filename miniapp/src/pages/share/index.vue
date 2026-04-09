<template>
  <view class="page" v-if="share">
    <!-- 订单信息 -->
    <view class="card order-card">
      <image :src="share.order?.villa?.coverImage" class="villa-img" mode="aspectFill" />
      <view class="order-info">
        <text class="villa-name">{{ share.order?.villa?.name }}</text>
        <text class="order-date">{{ share.order?.checkIn }} ~ {{ share.order?.checkOut }}</text>
      </view>
    </view>

    <!-- 分摊信息 -->
    <view class="card">
      <text class="card-title">费用分摊</text>
      <view class="fee-row">
        <text>总费用</text>
        <text class="fee-amount">¥{{ share.totalAmount }}</text>
      </view>
      <view class="fee-row">
        <text>分摊人数</text>
        <text>{{ share.memberCount }}人</text>
      </view>
      <view class="fee-row highlight">
        <text>每人支付</text>
        <text class="fee-amount">¥{{ perAmount }}</text>
      </view>
    </view>

    <!-- 支付进度 -->
    <view class="card">
      <text class="card-title">支付进度 ({{ paidCount }}/{{ share.memberCount }})</text>
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: (paidCount / share.memberCount * 100) + '%' }"></view>
      </view>
      <view class="member-list">
        <view class="member" v-for="p in share.payments" :key="p.id">
          <image :src="p.user?.avatar || '/static/default-avatar.png'" class="member-avatar" />
          <text class="member-name">{{ p.user?.nickname || '待加入' }}</text>
          <text :class="p.status === 1 ? 'status-paid' : 'status-pending'">
            {{ p.status === 1 ? '已支付' : '待支付' }}
          </text>
        </view>
      </view>
    </view>

    <!-- 操作 -->
    <view class="bottom-bar">
      <view class="share-btn" @tap="handleShare">邀请朋友</view>
      <view class="pay-btn" v-if="myPayment && myPayment.status === 0" @tap="handlePay">
        支付 ¥{{ perAmount }}
      </view>
      <view class="pay-btn paid" v-else-if="myPayment">已支付</view>
      <view class="pay-btn" v-else @tap="handleJoin">加入分摊</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getShareDetail, joinShare, payShare } from '../../api/share';
import { useUserStore } from '../../store/user';

const userStore = useUserStore();
const share = ref<any>(null);

const perAmount = computed(() => {
  if (!share.value) return 0;
  return (share.value.totalAmount / share.value.memberCount).toFixed(2);
});

const paidCount = computed(() => {
  return share.value?.payments?.filter((p: any) => p.status === 1).length || 0;
});

const myPayment = computed(() => {
  if (!share.value || !userStore.userInfo) return null;
  return share.value.payments?.find((p: any) => p.userId === userStore.userInfo.id);
});

onLoad(async (query: any) => {
  await loadDetail(parseInt(query.id));
});

async function loadDetail(id: number) {
  try {
    share.value = await getShareDetail(id);
  } catch (e) {
    console.error(e);
  }
}

async function handleJoin() {
  try {
    await joinShare(share.value.id);
    await loadDetail(share.value.id);
    uni.showToast({ title: '已加入', icon: 'success' });
  } catch (e) {
    console.error(e);
  }
}

async function handlePay() {
  if (!myPayment.value) return;
  try {
    await payShare(myPayment.value.id);
    await loadDetail(share.value.id);
    uni.showToast({ title: '支付成功', icon: 'success' });
  } catch (e) {
    console.error(e);
  }
}

function handleShare() {
  uni.showShareMenu({ withShareTicket: true });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding: 20rpx; padding-bottom: 120rpx; }
.card { background: #fff; border-radius: 12rpx; padding: 30rpx; margin-bottom: 20rpx; }
.card-title { font-size: 30rpx; font-weight: bold; color: #333; display: block; margin-bottom: 20rpx; }
.order-card { display: flex; gap: 20rpx; }
.villa-img { width: 160rpx; height: 120rpx; border-radius: 8rpx; }
.order-info { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.villa-name { font-size: 28rpx; font-weight: bold; color: #333; }
.order-date { font-size: 24rpx; color: #999; margin-top: 8rpx; }
.fee-row { display: flex; justify-content: space-between; padding: 12rpx 0; font-size: 26rpx; color: #666; }
.fee-row.highlight { border-top: 1rpx solid #f0f0f0; padding-top: 16rpx; margin-top: 8rpx; }
.fee-amount { color: #ff6b35; font-weight: bold; }
.progress-bar { height: 12rpx; background: #f0f0f0; border-radius: 6rpx; margin-bottom: 20rpx; }
.progress-fill { height: 100%; background: #27ae60; border-radius: 6rpx; transition: width 0.3s; }
.member-list { display: flex; flex-direction: column; gap: 16rpx; }
.member { display: flex; align-items: center; gap: 16rpx; }
.member-avatar { width: 64rpx; height: 64rpx; border-radius: 50%; }
.member-name { flex: 1; font-size: 26rpx; color: #333; }
.status-paid { font-size: 24rpx; color: #27ae60; }
.status-pending { font-size: 24rpx; color: #e67e22; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; display: flex; padding: 20rpx 30rpx; gap: 20rpx; }
.share-btn { flex: 1; text-align: center; padding: 24rpx; border: 1rpx solid #ff6b35; color: #ff6b35; border-radius: 40rpx; font-size: 28rpx; }
.pay-btn { flex: 2; text-align: center; padding: 24rpx; background: #ff6b35; color: #fff; border-radius: 40rpx; font-size: 28rpx; font-weight: bold; }
.pay-btn.paid { background: #ccc; }
</style>
