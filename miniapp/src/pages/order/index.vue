<template>
  <view class="page">
    <view class="tabs">
      <view class="tab" :class="{ active: currentTab === -1 }" @tap="switchTab(-1)">全部</view>
      <view class="tab" :class="{ active: currentTab === 0 }" @tap="switchTab(0)">待支付</view>
      <view class="tab" :class="{ active: currentTab === 2 }" @tap="switchTab(2)">待入住</view>
      <view class="tab" :class="{ active: currentTab === 5 }" @tap="switchTab(5)">已完成</view>
    </view>

    <view class="order-list">
      <view class="order-card" v-for="order in orderList" :key="order.id" @tap="goDetail(order.id)">
        <view class="order-header">
          <text class="order-no">{{ order.orderNo }}</text>
          <text class="order-status">{{ statusText(order.status) }}</text>
        </view>
        <view class="order-body">
          <image class="villa-cover" :src="resolveImg(order.villa?.coverImage)" mode="aspectFill" />
          <view class="order-info">
            <text class="villa-name">{{ order.villa?.name }}</text>
            <text class="order-date" v-if="order.slotName">{{ order.checkIn }} · {{ order.slotName }}</text>
            <text class="order-date" v-else>{{ order.checkIn }} ~ {{ order.checkOut }}</text>
            <text class="order-amount">¥{{ order.totalAmount }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="orderList.length === 0" class="empty">
      <text>暂无订单</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { listOrders } from '../../api/order';
import { resolveImageUrl } from '../../utils/request';

const resolveImg = resolveImageUrl;

const orderList = ref<any[]>([]);
const currentTab = ref(-1);

onShow(() => { loadOrders(); });

async function loadOrders() {
  try {
    const params: any = { page: 1, pageSize: 20 };
    if (currentTab.value >= 0) params.status = currentTab.value;
    const res = await listOrders(params);
    orderList.value = res.list;
  } catch (e) {
    console.error(e);
  }
}

function switchTab(tab: number) {
  currentTab.value = tab;
  loadOrders();
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/order/detail?id=${id}` });
}

function statusText(status: number) {
  const map: Record<number, string> = {
    0: '待支付', 1: '待确认', 2: '待入住', 3: '已入住',
    4: '待退押金', 5: '已完成', 6: '已取消', 7: '已拒绝', 8: '已关闭',
  };
  return map[status] || '未知';
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }
.tabs { display: flex; background: #fff; padding: 0 20rpx; }
.tab { flex: 1; text-align: center; padding: 24rpx 0; font-size: 28rpx; color: #666; position: relative; }
.tab.active { color: #ff6b35; font-weight: bold; &::after { content: ''; position: absolute; bottom: 0; left: 30%; right: 30%; height: 4rpx; background: #ff6b35; border-radius: 2rpx; } }
.order-list { padding: 20rpx; }
.order-card { background: #fff; border-radius: 12rpx; margin-bottom: 20rpx; overflow: hidden; }
.order-header { display: flex; justify-content: space-between; padding: 20rpx; border-bottom: 1rpx solid #f0f0f0; }
.order-no { font-size: 24rpx; color: #999; }
.order-status { font-size: 24rpx; color: #ff6b35; }
.order-body { display: flex; padding: 20rpx; }
.villa-cover { width: 160rpx; height: 120rpx; border-radius: 8rpx; }
.order-info { flex: 1; margin-left: 20rpx; display: flex; flex-direction: column; justify-content: space-between; }
.villa-name { font-size: 28rpx; font-weight: bold; color: #333; }
.order-date { font-size: 24rpx; color: #999; }
.order-amount { font-size: 30rpx; color: #ff6b35; font-weight: bold; }
.empty { text-align: center; padding: 200rpx 0; color: #999; }
</style>
