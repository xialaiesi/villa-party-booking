<template>
  <view class="page" v-if="order">
    <!-- 状态头部 -->
    <view class="status-bar" :class="'status-' + order.status">
      <text class="status-icon">{{ statusIcon(order.status) }}</text>
      <text class="status-text">{{ statusText(order.status) }}</text>
      <text class="status-desc">{{ statusDesc(order.status) }}</text>
      <text class="countdown" v-if="order.status === 0 && countdown">{{ countdown }}后自动取消</text>
    </view>

    <!-- 行动指引 -->
    <view class="action-card" v-if="actionItems.length">
      <view class="action-item" v-for="item in actionItems" :key="item.label" @tap="handleAction(item.key)">
        <text class="action-icon">{{ item.icon }}</text>
        <view class="action-body">
          <text class="action-label">{{ item.label }}</text>
          <text class="action-desc">{{ item.desc }}</text>
        </view>
        <text class="action-arrow">›</text>
      </view>
    </view>

    <!-- 别墅信息 -->
    <view class="card">
      <text class="card-title">别墅信息</text>
      <text class="villa-name">{{ order.villa?.name }}</text>
      <text class="date-info" v-if="order.slotName">{{ order.checkIn }} · {{ order.slotName }}</text>
      <text class="date-info" v-else>{{ order.checkIn }} ~ {{ order.checkOut }}（{{ order.days }}晚）</text>
      <text class="guest-info">入住{{ order.guests }}人</text>
    </view>

    <!-- 费用明细 -->
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

    <!-- 联系信息 -->
    <view class="card" v-if="order.contactName">
      <text class="card-title">联系信息</text>
      <view class="contact-row">
        <text>{{ order.contactName }}</text>
        <text class="phone-link" @tap="callPhone">{{ order.contactPhone }}</text>
      </view>
    </view>

    <!-- 订单信息 -->
    <view class="card">
      <text class="card-title">订单信息</text>
      <view class="info-row"><text class="info-label">订单号</text><text class="info-value">{{ order.orderNo }}</text></view>
      <view class="info-row"><text class="info-label">下单时间</text><text class="info-value">{{ formatDate(order.createdAt) }}</text></view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-bar" v-if="order.status === 0">
      <view class="cancel-btn" @tap="handleCancel">取消订单</view>
      <view class="pay-btn" @tap="handlePay">去支付 ¥{{ (Number(order.totalAmount) + Number(order.depositAmount)).toFixed(2) }}</view>
    </view>
    <view class="bottom-bar" v-else-if="order.status === 5">
      <view class="cancel-btn" @tap="goAlbum">创建回忆相册</view>
      <view class="pay-btn" @tap="goReview">写评价</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getOrder, cancelOrder, payOrder } from '../../api/order';

const order = ref<any>(null);
const countdown = ref('');
let orderId = 0;

const actionItems = computed(() => {
  if (!order.value) return [];
  const s = order.value.status;
  const items: any[] = [];
  if (s === 1 || s === 2) {
    items.push({ key: 'tasks', icon: '📋', label: '入住任务清单', desc: '准备好出行物品和活动方案' });
    items.push({ key: 'share', icon: '💰', label: '发起费用分摊', desc: '邀请朋友一起分摊费用' });
  }
  if (s >= 1 && s <= 3) {
    const signed = !!order.value.pactSignedAt;
    items.push({ key: 'checkin', icon: signed ? '✅' : '📝', label: '入住登记 · 派对公约', desc: signed ? '已完成登记，可查看' : '登记带队人并签署公约' });
  }
  if (s === 2 || s === 3) {
    items.push({ key: 'service', icon: '🍳', label: '预约周边服务', desc: '厨师/摄影/DJ 一键预约' });
  }
  if (s >= 1 && s <= 4) {
    items.push({ key: 'contact', icon: '💬', label: '联系管家', desc: '在线咨询，随时响应' });
  }
  if (s === 4) {
    items.push({ key: 'wait', icon: '⏳', label: '押金验收中', desc: '商家验收后押金将退还' });
  }
  if (s === 5) {
    items.push({ key: 'album', icon: '📸', label: '创建聚会回忆', desc: '上传照片和朋友一起珍藏' });
    items.push({ key: 'post', icon: '💬', label: '分享到趴友圈', desc: '种草给更多人' });
  }
  return items;
});

onLoad((query: any) => {
  orderId = parseInt(query.id);
  loadOrder();
  // 待支付倒计时
  const timer = setInterval(() => {
    if (order.value?.status !== 0) { clearInterval(timer); return; }
    updateCountdown();
  }, 1000);
});

async function loadOrder() {
  try {
    order.value = await getOrder(orderId);
    updateCountdown();
  } catch (e) { console.error(e); }
}

function updateCountdown() {
  if (!order.value || order.value.status !== 0) { countdown.value = ''; return; }
  const created = new Date(order.value.createdAt).getTime();
  const deadline = created + 30 * 60 * 1000;
  const diff = deadline - Date.now();
  if (diff <= 0) { countdown.value = '已超时'; return; }
  const min = Math.floor(diff / 60000);
  const sec = Math.floor((diff % 60000) / 1000);
  countdown.value = `${min}分${sec}秒`;
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
    uni.requestPayment({
      ...payParams,
      success: () => loadOrder(),
      fail: () => uni.showToast({ title: '支付取消', icon: 'none' }),
    });
  } catch (e) { console.error(e); }
}

function handleAction(key: string) {
  switch (key) {
    case 'tasks': uni.navigateTo({ url: `/pages/checklist/index?id=${orderId}` }); break;
    case 'share': uni.showToast({ title: '发起分摊中...', icon: 'none' }); break;
    case 'service': uni.navigateTo({ url: '/pages/service/index' }); break;
    case 'contact': uni.navigateTo({ url: `/pages/chat/index?orderId=${orderId}` }); break;
    case 'checkin': uni.navigateTo({ url: `/pages/checkin/index?id=${orderId}` }); break;
    case 'album': uni.navigateTo({ url: '/pages/album/index' }); break;
    case 'post': uni.switchTab({ url: '/pages/community/index' }); break;
  }
}

function goAlbum() {
  uni.navigateTo({ url: '/pages/album/index' });
}

function goReview() {
  if (order.value) {
    uni.navigateTo({ url: `/pages/review/index?orderId=${order.value.id}` });
  }
}

function callPhone() {
  if (order.value?.contactPhone) {
    uni.makePhoneCall({ phoneNumber: order.value.contactPhone });
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleString();
}

function statusIcon(s: number) {
  return { 0: '⏳', 1: '💳', 2: '✅', 3: '🏠', 4: '💎', 5: '🎉', 6: '❌', 7: '❌', 8: '⏰' }[s] || '';
}

function statusText(s: number) {
  return { 0: '待支付', 1: '待商家确认', 2: '待入住', 3: '已入住', 4: '待退押金', 5: '已完成', 6: '已取消', 7: '已拒绝', 8: '已关闭' }[s] || '未知';
}

function statusDesc(s: number) {
  return {
    0: '请尽快完成支付',
    1: '商家正在处理，请耐心等待',
    2: '请按时入住',
    3: '祝你玩得开心！',
    4: '商家正在验收，请稍候',
    5: '感谢您的入住，欢迎再次预订',
    6: '订单已取消',
    7: '订单已被商家拒绝，款项已退回',
    8: '订单已超时关闭',
  }[s] || '';
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding-bottom: 140rpx; }

.status-bar {
  background: linear-gradient(135deg, #ff6b35, #ff8f65);
  padding: 60rpx 30rpx;
  color: #fff; text-align: center;
}
.status-bar.status-0 { background: linear-gradient(135deg, #ff8f65, #ffb088); }
.status-bar.status-5 { background: linear-gradient(135deg, #27ae60, #2ecc71); }
.status-bar.status-6, .status-bar.status-7, .status-bar.status-8 { background: linear-gradient(135deg, #95a5a6, #bdc3c7); }

.status-icon { font-size: 72rpx; display: block; }
.status-text { font-size: 38rpx; font-weight: bold; color: #fff; display: block; margin-top: 12rpx; }
.status-desc { font-size: 24rpx; color: rgba(255,255,255,0.85); display: block; margin-top: 8rpx; }
.countdown {
  display: inline-block; margin-top: 16rpx; padding: 8rpx 24rpx;
  background: rgba(255,255,255,0.2); border-radius: 30rpx; font-size: 24rpx;
}

.action-card { background: #fff; margin: 20rpx; border-radius: 16rpx; overflow: hidden; }
.action-item { display: flex; align-items: center; padding: 24rpx 30rpx; border-bottom: 1rpx solid #f5f5f5; }
.action-item:last-child { border-bottom: none; }
.action-icon { font-size: 40rpx; margin-right: 20rpx; }
.action-body { flex: 1; }
.action-label { font-size: 28rpx; color: #333; font-weight: bold; display: block; }
.action-desc { font-size: 22rpx; color: #999; display: block; margin-top: 4rpx; }
.action-arrow { font-size: 36rpx; color: #ccc; }

.card { background: #fff; margin: 20rpx; padding: 30rpx; border-radius: 12rpx; }
.card-title { font-size: 30rpx; font-weight: bold; color: #333; display: block; margin-bottom: 16rpx; }
.villa-name { font-size: 28rpx; color: #333; display: block; }
.date-info, .guest-info { font-size: 26rpx; color: #666; display: block; margin-top: 8rpx; }

.fee-item { display: flex; justify-content: space-between; padding: 10rpx 0; font-size: 26rpx; color: #666; }
.fee-item.total { border-top: 1rpx solid #f0f0f0; padding-top: 16rpx; margin-top: 8rpx; font-weight: bold; color: #333; font-size: 28rpx; }
.discount { color: #27ae60; }

.contact-row { display: flex; justify-content: space-between; align-items: center; font-size: 26rpx; }
.phone-link { color: #ff6b35; }

.info-row { display: flex; justify-content: space-between; padding: 8rpx 0; font-size: 24rpx; }
.info-label { color: #999; }
.info-value { color: #333; }

.bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0; background: #fff;
  display: flex; padding: 20rpx 30rpx; gap: 20rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
}
.cancel-btn { flex: 1; text-align: center; padding: 24rpx; border: 1rpx solid #ddd; border-radius: 40rpx; font-size: 28rpx; color: #666; }
.pay-btn { flex: 2; text-align: center; padding: 24rpx; background: #ff6b35; border-radius: 40rpx; font-size: 28rpx; color: #fff; font-weight: bold; }
</style>
