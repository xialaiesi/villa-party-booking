<template>
  <view class="page" v-if="order">
    <!-- 状态头 -->
    <view class="status-header" :style="{background: statusGradient}">
      <text class="status-text">{{ statusText(order.status) }}</text>
      <text class="status-desc">{{ statusDesc }}</text>
    </view>

    <!-- 订单信息 -->
    <view class="card">
      <text class="card-title">订单信息</text>
      <view class="info-row">
        <text class="info-label">订单号</text>
        <text class="info-value">{{ order.orderNo }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">别墅</text>
        <text class="info-value">{{ order.villa?.name }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">入住日期</text>
        <text class="info-value" v-if="order.slotName">{{ formatDate(order.checkIn) }} · {{ order.slotName }}</text>
        <text class="info-value" v-else>{{ formatDate(order.checkIn) }} ~ {{ formatDate(order.checkOut) }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">下单时间</text>
        <text class="info-value">{{ formatDateTime(order.createdAt) }}</text>
      </view>
    </view>

    <!-- 客户信息 -->
    <view class="card">
      <text class="card-title">客户信息</text>
      <view class="info-row">
        <text class="info-label">昵称</text>
        <text class="info-value">{{ order.user?.nickname || '-' }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">手机</text>
        <text class="info-value">{{ order.user?.phone || '-' }}</text>
      </view>
    </view>

    <!-- 入住登记 -->
    <view class="card" v-if="order.pactSignedAt">
      <text class="card-title">入住登记</text>
      <view class="info-row">
        <text class="info-label">带队人</text>
        <text class="info-value">{{ order.leaderName || '-' }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">联系手机</text>
        <text class="info-value">{{ order.leaderPhone || '-' }}</text>
      </view>
      <view class="info-row" v-if="order.leaderIdTail">
        <text class="info-label">身份证后四位</text>
        <text class="info-value">{{ order.leaderIdTail }}</text>
      </view>
      <view class="info-row" v-if="order.partySize">
        <text class="info-label">实际到场人数</text>
        <text class="info-value">{{ order.partySize }}人</text>
      </view>
      <view class="info-row">
        <text class="info-label">公约签署</text>
        <text class="info-value">{{ formatDateTime(order.pactSignedAt) }}</text>
      </view>
    </view>

    <!-- 金额信息 -->
    <view class="card">
      <text class="card-title">金额明细</text>
      <view class="info-row">
        <text class="info-label">订单总额</text>
        <text class="info-value price">¥{{ order.totalAmount }}</text>
      </view>
      <view class="info-row" v-if="order.depositAmount">
        <text class="info-label">定金</text>
        <text class="info-value">¥{{ order.depositAmount }}</text>
      </view>
      <view class="info-row" v-if="order.finalAmount">
        <text class="info-label">尾款</text>
        <text class="info-value">¥{{ order.finalAmount }}</text>
      </view>
    </view>

    <!-- 拒绝原因 -->
    <view class="card" v-if="order.status === 7 && order.refundReason">
      <text class="card-title">拒绝原因</text>
      <text class="reason-text">{{ order.refundReason }}</text>
    </view>

    <!-- 操作按钮 -->
    <view class="action-bar" v-if="showActions">
      <button class="btn-confirm" v-if="order.status === 0" @tap="handleAction('depositPaid', '确认定金已到账？')">确认定金</button>
      <button class="btn-confirm" v-if="order.status === 1" @tap="handleAction('confirm', '确认接受此订单？')">确认订单</button>
      <button class="btn-reject" v-if="order.status === 1" @tap="handleReject">拒绝订单</button>
      <button class="btn-confirm" v-if="order.status === 2" @tap="handleAction('finalPaid', '确认尾款已到账？')">确认尾款</button>
      <button class="btn-confirm" v-if="order.status === 3" @tap="handleCheckIn">核销入住</button>
      <button class="btn-confirm" v-if="order.status === 4" @tap="handleAction('complete', '确认订单已完成？')">完成订单</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getAdminOrders, confirmDepositPaid, confirmOrder, rejectOrder, confirmFinalPaid, markCheckIn, markComplete } from '../../../api/admin';

const order = ref<any>(null);

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
const statusGradient = computed(() => {
  const color = STATUS_MAP[order.value?.status]?.color || '#999';
  return `linear-gradient(135deg, ${color}, ${color}aa)`;
});
const statusDesc = computed(() => {
  const s = order.value?.status;
  if (s === 0) return '等待客户支付定金';
  if (s === 1) return '请尽快确认或拒绝订单';
  if (s === 2) return '等待客户支付尾款';
  if (s === 3) return '客户即将入住';
  return '';
});
const showActions = computed(() => [0, 1, 2, 3, 4].includes(order.value?.status));

function formatDate(d: string) { return d ? d.split('T')[0] : ''; }
function formatDateTime(d: string) { return d ? d.replace('T', ' ').slice(0, 16) : ''; }

onLoad(async (opts: any) => {
  if (opts?.id) {
    try {
      const data = await getAdminOrders({ page: 1, pageSize: 100 });
      order.value = (data.list || data).find((o: any) => o.id === Number(opts.id));
    } catch (e) { console.error(e); }
  }
});

const actionMap: Record<string, (id: number) => Promise<any>> = {
  depositPaid: confirmDepositPaid,
  confirm: confirmOrder,
  finalPaid: confirmFinalPaid,
  complete: markComplete,
};

function handleCheckIn() {
  uni.showModal({
    title: '到店核销',
    editable: true,
    placeholderText: '请输入客人出示的 6 位核销码',
    success: async (res) => {
      if (!res.confirm) return;
      const code = (res.content || '').trim();
      if (!code) {
        uni.showToast({ title: '请输入核销码', icon: 'none' });
        return;
      }
      try {
        await markCheckIn(order.value.id, code);
        uni.showToast({ title: '核销成功', icon: 'success' });
        setTimeout(() => uni.navigateBack(), 500);
      } catch (e: any) {
        uni.showToast({ title: e?.message || '核销码不正确', icon: 'none' });
      }
    },
  });
}

function handleAction(action: string, msg: string) {
  uni.showModal({
    title: '操作确认',
    content: msg,
    success: async (res) => {
      if (res.confirm) {
        await actionMap[action](order.value.id);
        uni.showToast({ title: '操作成功', icon: 'success' });
        setTimeout(() => uni.navigateBack(), 500);
      }
    },
  });
}

function handleReject() {
  uni.showModal({
    title: '拒绝订单',
    editable: true,
    placeholderText: '请输入拒绝原因（选填）',
    success: async (res) => {
      if (res.confirm) {
        await rejectOrder(order.value.id, res.content);
        uni.showToast({ title: '已拒绝', icon: 'success' });
        setTimeout(() => uni.navigateBack(), 500);
      }
    },
  });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding-bottom: 200rpx; }

.status-header {
  padding: 60rpx 30rpx 40rpx;
  color: #fff;
}
.status-text { font-size: 40rpx; font-weight: bold; display: block; }
.status-desc { font-size: 26rpx; opacity: 0.9; display: block; margin-top: 8rpx; }

.card {
  background: #fff; margin: 24rpx; border-radius: 16rpx; padding: 24rpx;
}
.card-title { font-size: 30rpx; font-weight: bold; color: #333; display: block; margin-bottom: 20rpx; }
.info-row {
  display: flex; justify-content: space-between; padding: 12rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 26rpx; color: #999; }
.info-value { font-size: 26rpx; color: #333; }
.info-value.price { color: #FF6B35; font-weight: bold; font-size: 30rpx; }
.reason-text { font-size: 28rpx; color: #F56C6C; }

.action-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: #fff; padding: 20rpx 30rpx;
  display: flex; gap: 20rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}
.btn-confirm {
  flex: 1; height: 80rpx; line-height: 80rpx;
  background: #409EFF; color: #fff; border: none; border-radius: 40rpx; font-size: 30rpx;
}
.btn-confirm::after { border: none; }
.btn-reject {
  flex: 1; height: 80rpx; line-height: 80rpx;
  background: #fff; color: #F56C6C; border: 2rpx solid #F56C6C; border-radius: 40rpx; font-size: 30rpx;
}
.btn-reject::after { border: none; }
</style>
