<template>
  <view class="page">
    <!-- 财务概览 -->
    <view class="finance-header">
      <text class="header-title">财务中心</text>
      <view class="finance-stats">
        <view class="stat">
          <text class="stat-value">¥{{ finance.totalRevenue || 0 }}</text>
          <text class="stat-label">总收入</text>
        </view>
        <view class="stat">
          <text class="stat-value">¥{{ finance.settledAmount || 0 }}</text>
          <text class="stat-label">已结算</text>
        </view>
        <view class="stat">
          <text class="stat-value pending">¥{{ finance.pendingAmount || 0 }}</text>
          <text class="stat-label">待结算</text>
        </view>
      </view>
    </view>

    <!-- 结算记录 -->
    <view class="section">
      <text class="section-title">结算记录</text>
      <view class="settlement-list">
        <view class="settlement-item" v-for="s in settlements" :key="s.id">
          <view class="settlement-top">
            <text class="settlement-no">{{ s.orderNo }}</text>
            <text class="settlement-status" :class="s.status === 1 ? 'settled' : 'pending'">
              {{ s.status === 1 ? '已结算' : '待结算' }}
            </text>
          </view>
          <view class="settlement-mid">
            <view class="settlement-detail">
              <text class="detail-item">订单金额: ¥{{ s.amount }}</text>
              <text class="detail-item">佣金: ¥{{ s.commission }}</text>
              <text class="detail-item highlight">实得: ¥{{ s.netAmount }}</text>
            </view>
          </view>
          <view class="settlement-bottom">
            <text class="settlement-date">{{ formatDate(s.createdAt) }}</text>
            <text class="mark-btn" v-if="s.status === 0 && isPlatform" @tap="handleMarkSettled(s)">标记已结算</text>
          </view>
        </view>
      </view>
      <view class="empty" v-if="settlements.length === 0">
        <text class="empty-text">暂无结算记录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getMyFinance, getMySettlements, markSettled } from '../../../api/admin';
import { useMerchantStore } from '../../../store/merchant';

const merchantStore = useMerchantStore();
const isPlatform = ref(merchantStore.isPlatform);
const finance = ref<any>({});
const settlements = ref<any[]>([]);

function formatDate(d: string) { return d ? d.replace('T', ' ').slice(0, 16) : ''; }

onShow(async () => {
  try {
    finance.value = await getMyFinance();
    const data = await getMySettlements({ page: 1, pageSize: 50 });
    settlements.value = data.list || data;
  } catch (e) { console.error(e); }
});

async function handleMarkSettled(s: any) {
  uni.showModal({
    title: '提示', content: '确认标记为已结算？',
    success: async (res) => {
      if (res.confirm) {
        await markSettled(s.id);
        s.status = 1;
        uni.showToast({ title: '已标记', icon: 'success' });
      }
    },
  });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }
.finance-header {
  background: linear-gradient(135deg, #409EFF, #66b1ff);
  padding: 40rpx 30rpx;
}
.header-title { font-size: 34rpx; font-weight: bold; color: #fff; display: block; margin-bottom: 30rpx; }
.finance-stats { display: flex; }
.stat { flex: 1; text-align: center; }
.stat-value { font-size: 36rpx; font-weight: bold; color: #fff; display: block; }
.stat-value.pending { color: #ffd700; }
.stat-label { font-size: 22rpx; color: rgba(255,255,255,0.8); display: block; margin-top: 8rpx; }
.section { padding: 24rpx; }
.section-title { font-size: 30rpx; font-weight: bold; color: #333; display: block; margin-bottom: 20rpx; }
.settlement-item { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.settlement-top { display: flex; justify-content: space-between; align-items: center; }
.settlement-no { font-size: 24rpx; color: #999; }
.settlement-status { font-size: 24rpx; padding: 4rpx 16rpx; border-radius: 8rpx; }
.settlement-status.settled { background: rgba(103,194,58,0.1); color: #67C23A; }
.settlement-status.pending { background: rgba(230,162,60,0.1); color: #E6A23C; }
.settlement-detail { margin-top: 16rpx; }
.detail-item { font-size: 26rpx; color: #666; display: block; margin-top: 8rpx; }
.detail-item.highlight { color: #FF6B35; font-weight: bold; }
.settlement-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid #f5f5f5; }
.settlement-date { font-size: 22rpx; color: #999; }
.mark-btn { font-size: 24rpx; color: #409EFF; padding: 6rpx 20rpx; border: 1rpx solid #409EFF; border-radius: 20rpx; }
.empty { padding: 100rpx 0; text-align: center; }
.empty-text { color: #999; }
</style>
