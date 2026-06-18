<template>
  <view class="page">
    <!-- 状态筛选 -->
    <scroll-view scroll-x class="status-scroll">
      <view class="status-tabs">
        <text class="tab" :class="{active: currentStatus === -1}" @tap="setStatus(-1)">全部</text>
        <text class="tab" :class="{active: currentStatus === s.value}" v-for="s in statusList" :key="s.value" @tap="setStatus(s.value)">
          {{ s.label }}
        </text>
      </view>
    </scroll-view>

    <!-- 订单列表 -->
    <view class="order-list">
      <view class="order-card" v-for="o in orders" :key="o.id" @tap="goDetail(o.id)">
        <view class="order-header">
          <text class="order-no">{{ o.orderNo }}</text>
          <text class="order-status" :style="{color: statusColor(o.status)}">{{ statusText(o.status) }}</text>
        </view>

        <view class="order-body">
          <text class="order-villa">{{ o.villa?.name || '-' }}</text>
          <text class="order-user">{{ o.user?.nickname || '用户' }} · {{ o.user?.phone || '' }}</text>
          <text class="order-date">{{ formatDate(o.checkIn) }} ~ {{ formatDate(o.checkOut) }}</text>
        </view>

        <view class="order-footer">
          <text class="order-amount">¥{{ o.totalAmount }}</text>
          <view class="order-actions">
            <text class="btn-action confirm" v-if="o.status === 0" @tap.stop="handleDepositPaid(o)">确认定金</text>
            <text class="btn-action confirm" v-if="o.status === 1" @tap.stop="handleConfirm(o)">确认订单</text>
            <text class="btn-action reject" v-if="o.status === 1" @tap.stop="handleReject(o)">拒绝</text>
            <text class="btn-action confirm" v-if="o.status === 2" @tap.stop="handleFinalPaid(o)">确认尾款</text>
            <text class="btn-action confirm" v-if="o.status === 3" @tap.stop="handleCheckIn(o)">确认入住</text>
            <text class="btn-action confirm" v-if="o.status === 4" @tap.stop="handleComplete(o)">完成订单</text>
          </view>
        </view>
      </view>
    </view>

    <view class="empty" v-if="!loading && orders.length === 0">
      <text class="empty-text">暂无订单</text>
    </view>

    <view class="load-more" v-if="hasMore" @tap="loadMore">
      <text>加载更多...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import {
  getAdminOrders,
  confirmDepositPaid,
  confirmOrder,
  rejectOrder,
  confirmFinalPaid,
  markCheckIn,
  markComplete,
} from '../../../api/admin';

const orders = ref<any[]>([]);
const loading = ref(false);
const currentStatus = ref(-1);
const page = ref(1);
const hasMore = ref(false);

const statusList = [
  { label: '待付定金', value: 0 },
  { label: '待确认', value: 1 },
  { label: '待付尾款', value: 2 },
  { label: '待入住', value: 3 },
  { label: '已入住', value: 4 },
  { label: '已完成', value: 5 },
  { label: '已取消', value: 6 },
  { label: '已拒绝', value: 7 },
];

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

function formatDate(d: string) {
  return d ? d.split('T')[0] : '';
}

onLoad((opts: any) => {
  if (opts?.status !== undefined) {
    currentStatus.value = Number(opts.status);
  }
});

onShow(() => loadData());

async function loadData(reset = true) {
  if (reset) { page.value = 1; orders.value = []; }
  loading.value = true;
  try {
    const params: any = { page: page.value, pageSize: 20 };
    if (currentStatus.value !== -1) params.status = currentStatus.value;
    const data = await getAdminOrders(params);
    const items = data.list || data;
    if (reset) orders.value = items;
    else orders.value = [...orders.value, ...items];
    hasMore.value = items.length === 20;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

function setStatus(s: number) {
  currentStatus.value = s;
  loadData();
}

function loadMore() {
  page.value++;
  loadData(false);
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/merchant/order-detail/index?id=${id}` });
}

function confirmAction(title: string, action: () => Promise<any>) {
  uni.showModal({
    title: '操作确认',
    content: title,
    success: async (res) => {
      if (res.confirm) {
        try {
          await action();
          uni.showToast({ title: '操作成功', icon: 'success' });
          loadData();
        } catch (e) { console.error(e); }
      }
    },
  });
}

function handleDepositPaid(o: any) { confirmAction('确认定金已到账？', () => confirmDepositPaid(o.id)); }
function handleConfirm(o: any) { confirmAction('确认接受此订单？', () => confirmOrder(o.id)); }
function handleFinalPaid(o: any) { confirmAction('确认尾款已到账？', () => confirmFinalPaid(o.id)); }
function handleCheckIn(o: any) {
  uni.showModal({
    title: '到店核销',
    editable: true,
    placeholderText: '请输入客人出示的 6 位核销码',
    success: async (res) => {
      if (!res.confirm) return;
      const code = (res.content || '').trim();
      if (!code) { uni.showToast({ title: '请输入核销码', icon: 'none' }); return; }
      try {
        await markCheckIn(o.id, code);
        uni.showToast({ title: '核销成功', icon: 'success' });
        loadData();
      } catch (e: any) {
        uni.showToast({ title: e?.message || '核销码不正确', icon: 'none' });
      }
    },
  });
}
function handleComplete(o: any) { confirmAction('确认订单已完成？', () => markComplete(o.id)); }

function handleReject(o: any) {
  uni.showModal({
    title: '拒绝订单',
    editable: true,
    placeholderText: '请输入拒绝原因（选填）',
    success: async (res) => {
      if (res.confirm) {
        try {
          await rejectOrder(o.id, res.content);
          uni.showToast({ title: '已拒绝', icon: 'success' });
          loadData();
        } catch (e) { console.error(e); }
      }
    },
  });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }

.status-scroll { background: #fff; white-space: nowrap; }
.status-tabs { display: inline-flex; padding: 20rpx 24rpx; gap: 16rpx; }
.tab {
  font-size: 26rpx; color: #666;
  padding: 10rpx 24rpx;
  border-radius: 24rpx;
  flex-shrink: 0;
}
.tab.active { background: #409EFF; color: #fff; }

.order-list { padding: 20rpx 24rpx; }
.order-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}
.order-header { display: flex; justify-content: space-between; align-items: center; }
.order-no { font-size: 24rpx; color: #999; }
.order-status { font-size: 26rpx; font-weight: 500; }

.order-body { margin-top: 16rpx; }
.order-villa { font-size: 30rpx; color: #333; font-weight: 500; display: block; }
.order-user { font-size: 24rpx; color: #999; display: block; margin-top: 8rpx; }
.order-date { font-size: 24rpx; color: #666; display: block; margin-top: 8rpx; }

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f5f5f5;
}
.order-amount { font-size: 34rpx; color: #FF6B35; font-weight: bold; }
.order-actions { display: flex; gap: 16rpx; }
.btn-action {
  font-size: 24rpx;
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
}
.btn-action.confirm { background: #409EFF; color: #fff; }
.btn-action.reject { background: #fff; color: #F56C6C; border: 1rpx solid #F56C6C; }

.empty { padding: 200rpx 0; text-align: center; }
.empty-text { color: #999; font-size: 28rpx; }
.load-more { text-align: center; padding: 30rpx; color: #999; font-size: 26rpx; }
</style>
