<template>
  <view class="page" v-if="order">
    <view class="status-bar">
      <text class="status-text">{{ statusText(order.status) }}</text>
    </view>

    <view class="card">
      <text class="card-title">别墅信息</text>
      <text class="villa-name">{{ order.villa?.name }}</text>
      <text class="date-info">{{ order.checkIn }} ~ {{ order.checkOut }}（{{ order.days }}晚）</text>
      <text class="guest-info">入住{{ order.guests }}人</text>
    </view>

    <view class="card">
      <text class="card-title">费用明细</text>
      <view class="fee-item"><text>别墅费用</text><text>¥{{ order.villaAmount }}</text></view>
      <view class="fee-item" v-if="order.discountAmount > 0">
        <text>连住折扣</text><text class="discount">-¥{{ order.discountAmount }}</text>
      </view>
      <view class="fee-item" v-if="order.packageAmount > 0">
        <text>套餐费用</text><text>¥{{ order.packageAmount }}</text>
      </view>
      <view class="fee-item total"><text>订单金额</text><text>¥{{ order.totalAmount }}</text></view>
      <view class="fee-item" v-if="order.depositAmount > 0">
        <text>押金</text><text>¥{{ order.depositAmount }}</text>
      </view>
    </view>

    <view class="card" v-if="order.contactName">
      <text class="card-title">联系信息</text>
      <text class="contact">{{ order.contactName }} {{ order.contactPhone }}</text>
    </view>

    <view class="bottom-bar" v-if="order.status === 0">
      <view class="cancel-btn" @tap="handleCancel"><text>取消订单</text></view>
      <view class="pay-btn" @tap="handlePay"><text>去支付 ¥{{ order.totalAmount + order.depositAmount }}</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getOrder, cancelOrder, payOrder } from '../../api/order';

const order = ref<any>(null);
let orderId = 0;

onLoad((query: any) => {
  orderId = parseInt(query.id);
  loadOrder();
});

async function loadOrder() {
  try {
    order.value = await getOrder(orderId);
  } catch (e) {
    console.error(e);
  }
}

async function handleCancel() {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消该订单吗？',
    success: async (res) => {
      if (res.confirm) {
        await cancelOrder(orderId);
        loadOrder();
      }
    },
  });
}

async function handlePay() {
  try {
    const payParams = await payOrder(orderId);
    // 调用微信支付
    uni.requestPayment({
      ...payParams,
      success: () => { loadOrder(); },
      fail: () => { uni.showToast({ title: '支付取消', icon: 'none' }); },
    });
  } catch (e) {
    console.error(e);
  }
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
.page { background: #f5f5f5; min-height: 100vh; padding-bottom: 120rpx; }
.status-bar { background: #ff6b35; padding: 40rpx 30rpx; }
.status-text { color: #fff; font-size: 36rpx; font-weight: bold; }
.card { background: #fff; margin: 20rpx; padding: 30rpx; border-radius: 12rpx; }
.card-title { font-size: 30rpx; font-weight: bold; color: #333; display: block; margin-bottom: 16rpx; }
.villa-name { font-size: 28rpx; color: #333; display: block; }
.date-info, .guest-info, .contact { font-size: 26rpx; color: #666; display: block; margin-top: 8rpx; }
.fee-item { display: flex; justify-content: space-between; padding: 10rpx 0; font-size: 26rpx; color: #666; }
.fee-item.total { border-top: 1rpx solid #f0f0f0; padding-top: 16rpx; margin-top: 8rpx; font-weight: bold; color: #333; font-size: 28rpx; }
.discount { color: #27ae60; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; display: flex; padding: 20rpx 30rpx; gap: 20rpx; }
.cancel-btn { flex: 1; text-align: center; padding: 24rpx; border: 1rpx solid #ddd; border-radius: 40rpx; font-size: 28rpx; color: #666; }
.pay-btn { flex: 2; text-align: center; padding: 24rpx; background: #ff6b35; border-radius: 40rpx; font-size: 28rpx; color: #fff; font-weight: bold; }
</style>
