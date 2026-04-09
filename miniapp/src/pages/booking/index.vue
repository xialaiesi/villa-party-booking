<template>
  <view class="page">
    <view class="card">
      <text class="card-title">预订信息</text>
      <view class="form-item">
        <text class="label">入住日期</text>
        <picker mode="date" :value="checkIn" @change="checkIn = $event.detail.value">
          <text class="picker-text">{{ checkIn || '选择日期' }}</text>
        </picker>
      </view>
      <view class="form-item">
        <text class="label">退房日期</text>
        <picker mode="date" :value="checkOut" @change="checkOut = $event.detail.value">
          <text class="picker-text">{{ checkOut || '选择日期' }}</text>
        </picker>
      </view>
      <view class="form-item">
        <text class="label">入住人数</text>
        <input type="number" v-model="guests" placeholder="输入人数" class="input" />
      </view>
    </view>

    <view class="card">
      <text class="card-title">联系信息</text>
      <view class="form-item">
        <text class="label">联系人</text>
        <input v-model="contactName" placeholder="请输入姓名" class="input" />
      </view>
      <view class="form-item">
        <text class="label">手机号</text>
        <input v-model="contactPhone" type="number" placeholder="请输入手机号" class="input" />
      </view>
      <view class="form-item">
        <text class="label">备注</text>
        <input v-model="remark" placeholder="特殊需求（选填）" class="input" />
      </view>
    </view>

    <view class="card summary" v-if="checkIn && checkOut">
      <text class="card-title">费用明细</text>
      <view class="fee-item">
        <text>别墅费用（{{ days }}晚）</text>
        <text>待计算</text>
      </view>
      <view class="fee-item" v-if="days >= 3">
        <text>连续入住折扣</text>
        <text class="discount">优惠中</text>
      </view>
      <view class="fee-item">
        <text>押金（退房后退还）</text>
        <text>待计算</text>
      </view>
    </view>

    <view class="bottom-bar">
      <view class="submit-btn" @tap="submitOrder">
        <text>提交订单</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { createOrder } from '../../api/order';
import { useUserStore } from '../../store/user';

const userStore = useUserStore();
let villaId = 0;

const checkIn = ref('');
const checkOut = ref('');
const guests = ref('');
const contactName = ref('');
const contactPhone = ref('');
const remark = ref('');

const days = computed(() => {
  if (!checkIn.value || !checkOut.value) return 0;
  const diff = new Date(checkOut.value).getTime() - new Date(checkIn.value).getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

onLoad((query: any) => {
  villaId = parseInt(query.id);
});

async function submitOrder() {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  if (!checkIn.value || !checkOut.value || !guests.value) {
    uni.showToast({ title: '请填写完整预订信息', icon: 'none' });
    return;
  }

  try {
    const order = await createOrder({
      villaId,
      checkIn: checkIn.value,
      checkOut: checkOut.value,
      guests: parseInt(guests.value),
      contactName: contactName.value,
      contactPhone: contactPhone.value,
      remark: remark.value,
    });
    uni.redirectTo({ url: `/pages/order/detail?id=${order.id}` });
  } catch (e) {
    console.error(e);
  }
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding: 20rpx; padding-bottom: 120rpx; }
.card { background: #fff; border-radius: 12rpx; padding: 30rpx; margin-bottom: 20rpx; }
.card-title { font-size: 30rpx; font-weight: bold; color: #333; display: block; margin-bottom: 20rpx; }
.form-item { display: flex; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.label { font-size: 28rpx; color: #333; width: 160rpx; }
.input { flex: 1; font-size: 28rpx; }
.picker-text { font-size: 28rpx; color: #666; }
.fee-item { display: flex; justify-content: space-between; padding: 12rpx 0; font-size: 26rpx; color: #666; }
.discount { color: #ff6b35; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 20rpx 30rpx; }
.submit-btn { background: #ff6b35; color: #fff; text-align: center; padding: 24rpx; border-radius: 40rpx; font-size: 32rpx; font-weight: bold; }
</style>
