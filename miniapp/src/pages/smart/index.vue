<template>
  <view class="page">
    <view class="header">
      <text class="title">智能选墅</text>
      <text class="subtitle">告诉我你的需求，AI 帮你挑选最合适的别墅</text>
    </view>

    <!-- 输入区 -->
    <view class="input-area">
      <textarea
        v-model="query"
        placeholder="例如：15人团建，预算5000，要有泳池和KTV，周六入住"
        :maxlength="200"
        class="input-box"
      />
      <view class="btn" :class="{ disabled: !query || loading }" @tap="handleRecommend">
        <text>{{ loading ? 'AI 思考中...' : 'AI 智能推荐' }}</text>
      </view>
    </view>

    <!-- 推荐结果 -->
    <view class="result" v-if="result">
      <!-- 推荐别墅 -->
      <view class="card" v-if="result.villa" @tap="goVilla(result.villa.id)">
        <text class="card-label">推荐别墅</text>
        <view class="villa-row">
          <image v-if="result.villa.coverImage" :src="result.villa.coverImage" class="villa-img" mode="aspectFill" />
          <view class="villa-info">
            <text class="villa-name">{{ result.villa.name }}</text>
            <text class="villa-price">¥{{ result.villa.basePrice }}/晚 · 可住{{ result.villa.maxGuests }}人</text>
            <text class="villa-reason">{{ result.villa.reason }}</text>
          </view>
        </view>
      </view>

      <!-- 推荐方案 -->
      <view class="card" v-if="result.plan?.id" @tap="goPlan(result.plan.id)">
        <text class="card-label">推荐活动方案</text>
        <text class="rec-name">{{ result.plan.name }}</text>
        <text class="rec-reason">{{ result.plan.reason }}</text>
      </view>

      <!-- 推荐氛围包 -->
      <view class="card" v-if="result.themePack?.id">
        <text class="card-label">推荐氛围包</text>
        <text class="rec-name">{{ result.themePack.name }} · ¥{{ result.themePack.price }}</text>
        <text class="rec-reason">{{ result.themePack.reason }}</text>
      </view>

      <!-- 预估费用和建议 -->
      <view class="card tips-card" v-if="result.estimatedBudget || result.tips">
        <text class="budget" v-if="result.estimatedBudget">{{ result.estimatedBudget }}</text>
        <text class="tips" v-if="result.tips">💡 {{ result.tips }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { smartRecommend } from '../../api/smart-recommend';

const query = ref('');
const loading = ref(false);
const result = ref<any>(null);

async function handleRecommend() {
  if (!query.value || loading.value) return;
  loading.value = true;
  result.value = null;
  try {
    result.value = await smartRecommend(query.value);
  } catch (e) {
    uni.showToast({ title: 'AI 推荐失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function goVilla(id: number) {
  uni.navigateTo({ url: `/pages/villa/index?id=${id}` });
}

function goPlan(id: number) {
  uni.navigateTo({ url: `/pages/plan/detail?id=${id}` });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }
.header { background: linear-gradient(135deg, #ff6b35, #ff8f65); padding: 60rpx 30rpx 40rpx; }
.title { font-size: 40rpx; font-weight: bold; color: #fff; display: block; }
.subtitle { font-size: 24rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; display: block; }
.input-area { padding: 30rpx; margin-top: -20rpx; }
.input-box { width: 100%; background: #fff; border-radius: 12rpx; padding: 24rpx; font-size: 28rpx; min-height: 160rpx; box-sizing: border-box; }
.btn { background: #ff6b35; color: #fff; text-align: center; padding: 24rpx; border-radius: 40rpx; font-size: 30rpx; font-weight: bold; margin-top: 20rpx; }
.btn.disabled { opacity: 0.5; }
.result { padding: 0 30rpx 30rpx; }
.card { background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 16rpx; }
.card-label { font-size: 22rpx; color: #ff6b35; background: #fff3ed; padding: 4rpx 16rpx; border-radius: 20rpx; display: inline-block; margin-bottom: 16rpx; }
.villa-row { display: flex; gap: 16rpx; }
.villa-img { width: 160rpx; height: 120rpx; border-radius: 8rpx; }
.villa-info { flex: 1; }
.villa-name { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.villa-price { font-size: 24rpx; color: #ff6b35; margin-top: 6rpx; display: block; }
.villa-reason { font-size: 22rpx; color: #999; margin-top: 6rpx; display: block; }
.rec-name { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.rec-reason { font-size: 24rpx; color: #666; margin-top: 8rpx; display: block; }
.tips-card { background: #fffbf5; border: 1rpx solid #ffe0c0; }
.budget { font-size: 28rpx; color: #e67e22; font-weight: bold; display: block; }
.tips { font-size: 24rpx; color: #666; margin-top: 8rpx; display: block; }
</style>
