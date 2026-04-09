<template>
  <view class="page" v-if="plan">
    <image v-if="plan.coverImage" :src="plan.coverImage" class="cover" mode="aspectFill" />

    <view class="card">
      <text class="plan-name">{{ plan.name }}</text>
      <view class="plan-meta">
        <text class="tag">{{ plan.scene }}</text>
        <text>{{ plan.minGuests }}-{{ plan.maxGuests }}人</text>
        <text v-if="plan.duration">{{ plan.duration }}</text>
      </view>
      <text class="plan-desc">{{ plan.description }}</text>
    </view>

    <!-- 活动流程 -->
    <view class="card">
      <text class="card-title">活动流程</text>
      <view class="timeline">
        <view class="step" v-for="(step, i) in plan.steps" :key="step.id">
          <view class="step-dot">{{ i + 1 }}</view>
          <view class="step-content">
            <view class="step-header">
              <text class="step-title">{{ step.title }}</text>
              <text class="step-time" v-if="step.time">{{ step.time }}</text>
            </view>
            <text class="step-desc" v-if="step.content">{{ step.content }}</text>
            <text class="step-tips" v-if="step.tips">💡 {{ step.tips }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 推荐加购 -->
    <view class="card" v-if="plan.packages?.length">
      <text class="card-title">推荐加购</text>
      <view class="pkg-list">
        <view class="pkg-item" v-for="pkg in plan.packages" :key="pkg.id">
          <view class="pkg-info">
            <text class="pkg-name">{{ pkg.name }}</text>
            <text class="pkg-price">¥{{ pkg.price }}</text>
          </view>
          <text class="pkg-required" v-if="pkg.required">必需</text>
          <text class="pkg-optional" v-else>可选</text>
        </view>
      </view>
    </view>

    <view class="bottom-bar">
      <view class="use-btn" @tap="usePlan">使用此方案</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getPlan } from '../../api/activity-plan';

const plan = ref<any>(null);

onLoad(async (query: any) => {
  try {
    plan.value = await getPlan(parseInt(query.id));
  } catch (e) {
    console.error(e);
  }
});

function usePlan() {
  // 将方案信息传递到预订页
  uni.setStorageSync('selectedPlan', JSON.stringify(plan.value));
  uni.navigateBack();
}
</script>

<style lang="scss">
.page { background: #f5f5f5; padding-bottom: 120rpx; }
.cover { width: 100%; height: 400rpx; }
.card { background: #fff; margin: 20rpx; padding: 30rpx; border-radius: 12rpx; }
.plan-name { font-size: 36rpx; font-weight: bold; color: #333; display: block; }
.plan-meta { display: flex; gap: 16rpx; align-items: center; margin-top: 12rpx; font-size: 24rpx; color: #999; }
.tag { background: #fff3ed; color: #ff6b35; padding: 4rpx 16rpx; border-radius: 20rpx; font-size: 22rpx; }
.plan-desc { font-size: 26rpx; color: #666; margin-top: 16rpx; line-height: 1.8; display: block; }
.card-title { font-size: 30rpx; font-weight: bold; color: #333; display: block; margin-bottom: 20rpx; }
.timeline { padding-left: 20rpx; }
.step { display: flex; gap: 20rpx; margin-bottom: 24rpx; }
.step-dot { width: 44rpx; height: 44rpx; background: #ff6b35; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22rpx; flex-shrink: 0; }
.step-content { flex: 1; }
.step-header { display: flex; justify-content: space-between; align-items: center; }
.step-title { font-size: 28rpx; font-weight: bold; color: #333; }
.step-time { font-size: 22rpx; color: #999; }
.step-desc { font-size: 24rpx; color: #666; margin-top: 8rpx; display: block; }
.step-tips { font-size: 22rpx; color: #e67e22; margin-top: 8rpx; display: block; }
.pkg-list { display: flex; flex-direction: column; gap: 12rpx; }
.pkg-item { display: flex; justify-content: space-between; align-items: center; padding: 16rpx; background: #fafafa; border-radius: 8rpx; }
.pkg-info { display: flex; gap: 16rpx; align-items: center; }
.pkg-name { font-size: 26rpx; color: #333; }
.pkg-price { font-size: 26rpx; color: #ff6b35; }
.pkg-required { font-size: 22rpx; color: #e74c3c; }
.pkg-optional { font-size: 22rpx; color: #999; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 20rpx 30rpx; }
.use-btn { background: #ff6b35; color: #fff; text-align: center; padding: 24rpx; border-radius: 40rpx; font-size: 32rpx; font-weight: bold; }
</style>
