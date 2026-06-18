<template>
  <view class="page" v-if="data">
    <!-- 会员卡 -->
    <view class="card" :class="'lv-' + data.level">
      <view class="card-top">
        <text class="lv-icon">{{ data.icon }}</text>
        <view class="lv-info">
          <text class="lv-name">{{ data.levelName }}</text>
          <text class="growth">成长值 {{ data.growth }}</text>
        </view>
        <text class="order-count">{{ data.orderCount }} 次聚会</text>
      </view>

      <view class="progress-box" v-if="data.nextLevel">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: data.nextLevel.progress + '%' }"></view>
        </view>
        <text class="progress-text">还差 {{ data.nextLevel.gap }} 成长值升级 {{ data.nextLevel.name }}</text>
      </view>
      <view class="progress-box" v-else>
        <text class="progress-text">已是最高等级，感谢您的信赖 🎉</text>
      </view>
    </view>

    <!-- 当前权益 -->
    <view class="section">
      <text class="section-title">我的专属权益</text>
      <view class="benefit-list">
        <view class="benefit-item" v-for="(b, i) in data.benefits" :key="i">
          <text class="benefit-dot">✓</text>
          <text class="benefit-text">{{ b }}</text>
        </view>
      </view>
    </view>

    <!-- 生日 -->
    <view class="section">
      <text class="section-title">生日权益</text>
      <view class="birthday-box">
        <text class="bd-tip">设置生日，金卡及以上当月预订免押金</text>
        <picker mode="date" :value="data.birthday ? fmtDate(data.birthday) : ''" @change="onBirthday">
          <view class="bd-value">{{ data.birthday ? fmtDate(data.birthday) : '点击设置 ›' }}</view>
        </picker>
      </view>
    </view>

    <!-- 等级体系 -->
    <view class="section">
      <text class="section-title">等级与权益</text>
      <view class="level-list">
        <view class="level-row" v-for="l in data.levels" :key="l.level" :class="{ cur: l.level === data.level }">
          <text class="level-icon">{{ l.icon }}</text>
          <view class="level-detail">
            <text class="level-name">{{ l.name }}<text class="level-thr"> · {{ l.threshold }}成长值</text></text>
            <text class="level-benefits">{{ l.benefits.join('、') }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 成长值明细 -->
    <view class="section">
      <text class="section-title">成长值明细</text>
      <view class="log-list" v-if="logs.length">
        <view class="log-item" v-for="log in logs" :key="log.id">
          <view class="log-info">
            <text class="log-desc">{{ log.description }}</text>
            <text class="log-time">{{ fmtTime(log.createdAt) }}</text>
          </view>
          <text class="log-points" :class="{ minus: log.points < 0 }">{{ log.points > 0 ? '+' : '' }}{{ log.points }}</text>
        </view>
      </view>
      <view v-else class="log-empty"><text>完成聚会、发布评价即可获得成长值</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getMembership, getGrowthLogs, setBirthday } from '../../api/membership';

const data = ref<any>(null);
const logs = ref<any[]>([]);

onShow(() => { load(); });

async function load() {
  try {
    data.value = await getMembership();
    const res = await getGrowthLogs({ page: 1, pageSize: 20 });
    logs.value = res.list;
  } catch (e) { console.error(e); }
}

async function onBirthday(e: any) {
  try {
    await setBirthday(e.detail.value);
    uni.showToast({ title: '已设置', icon: 'success' });
    load();
  } catch (err) {
    uni.showToast({ title: '设置失败', icon: 'none' });
  }
}

function fmtDate(d: string) { return d ? d.split('T')[0] : ''; }
function fmtTime(d: string) {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getMonth() + 1}/${dt.getDate()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding-bottom: 40rpx; }

.card {
  margin: 24rpx; padding: 36rpx; border-radius: 20rpx; color: #fff;
  background: linear-gradient(135deg, #b0764a, #8a5a36);
}
.card.lv-2 { background: linear-gradient(135deg, #9aa7b5, #6d7a8a); }
.card.lv-3 { background: linear-gradient(135deg, #e0a83c, #c07e1a); }
.card.lv-4 { background: linear-gradient(135deg, #3a3a4a, #1a1a26); }

.card-top { display: flex; align-items: center; }
.lv-icon { font-size: 64rpx; }
.lv-info { flex: 1; margin-left: 20rpx; }
.lv-name { font-size: 38rpx; font-weight: bold; display: block; }
.growth { font-size: 24rpx; opacity: 0.85; display: block; margin-top: 6rpx; }
.order-count { font-size: 24rpx; opacity: 0.85; }

.progress-box { margin-top: 30rpx; }
.progress-bar { height: 12rpx; background: rgba(255,255,255,0.3); border-radius: 6rpx; overflow: hidden; }
.progress-fill { height: 100%; background: #fff; border-radius: 6rpx; }
.progress-text { font-size: 22rpx; opacity: 0.9; display: block; margin-top: 12rpx; }

.section { margin: 24rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; margin-bottom: 16rpx; }

.benefit-list { background: #fff; border-radius: 16rpx; padding: 12rpx 24rpx; }
.benefit-item { display: flex; align-items: center; padding: 18rpx 0; }
.benefit-dot { color: #ff6b35; font-size: 28rpx; margin-right: 16rpx; }
.benefit-text { font-size: 28rpx; color: #333; }

.birthday-box { background: #fff; border-radius: 16rpx; padding: 28rpx 24rpx; }
.bd-tip { font-size: 24rpx; color: #999; display: block; }
.bd-value { font-size: 30rpx; color: #ff6b35; margin-top: 16rpx; }

.level-list { background: #fff; border-radius: 16rpx; overflow: hidden; }
.level-row { display: flex; align-items: center; padding: 24rpx; border-bottom: 1rpx solid #f5f5f5; }
.level-row:last-child { border-bottom: none; }
.level-row.cur { background: #fff8f4; }
.level-icon { font-size: 44rpx; margin-right: 20rpx; }
.level-detail { flex: 1; }
.level-name { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.level-thr { font-size: 22rpx; color: #999; font-weight: normal; }
.level-benefits { font-size: 22rpx; color: #999; display: block; margin-top: 6rpx; }

.log-list { background: #fff; border-radius: 16rpx; padding: 0 24rpx; }
.log-item { display: flex; align-items: center; justify-content: space-between; padding: 24rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.log-item:last-child { border-bottom: none; }
.log-desc { font-size: 28rpx; color: #333; display: block; }
.log-time { font-size: 22rpx; color: #999; display: block; margin-top: 6rpx; }
.log-points { font-size: 32rpx; font-weight: bold; color: #ff6b35; }
.log-points.minus { color: #999; }
.log-empty { background: #fff; border-radius: 16rpx; padding: 60rpx 0; text-align: center; color: #999; font-size: 26rpx; }
</style>
