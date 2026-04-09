<template>
  <view class="page">
    <!-- 场景筛选 -->
    <view class="scene-tabs">
      <view
        class="tab"
        :class="{ active: currentScene === '' }"
        @tap="switchScene('')"
      >全部</view>
      <view
        class="tab"
        :class="{ active: currentScene === s.key }"
        v-for="s in scenes"
        :key="s.key"
        @tap="switchScene(s.key)"
      >{{ s.name }}</view>
    </view>

    <!-- 方案列表 -->
    <view class="plan-list">
      <view class="plan-card" v-for="plan in plans" :key="plan.id" @tap="goDetail(plan.id)">
        <image v-if="plan.coverImage" :src="resolveImg(plan.coverImage)" class="plan-cover" mode="aspectFill" />
        <view class="plan-info">
          <text class="plan-name">{{ plan.name }}</text>
          <view class="plan-meta">
            <text class="meta-tag">{{ plan.scene }}</text>
            <text class="meta-text">{{ plan.minGuests }}-{{ plan.maxGuests }}人</text>
            <text class="meta-text" v-if="plan.duration">{{ plan.duration }}</text>
          </view>
          <text class="plan-desc">{{ plan.description }}</text>
          <view class="plan-steps-preview">
            <text class="step-count">{{ plan.steps?.length || 0 }}个环节</text>
            <text class="pkg-count" v-if="plan.packages?.length">{{ plan.packages.length }}项加购</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="plans.length === 0" class="empty">
      <text>暂无活动方案</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getPlans } from '../../api/activity-plan';
import { resolveImageUrl } from '../../utils/request';

const resolveImg = resolveImageUrl;

const scenes = [
  { key: '团建', name: '团建' },
  { key: '生日', name: '生日' },
  { key: '聚会', name: '聚会' },
  { key: '亲子', name: '亲子' },
];

const currentScene = ref('');
const plans = ref<any[]>([]);

onMounted(() => loadPlans());

async function loadPlans() {
  try {
    const params: any = {};
    if (currentScene.value) params.scene = currentScene.value;
    plans.value = await getPlans(params);
  } catch (e) {
    console.error(e);
  }
}

function switchScene(scene: string) {
  currentScene.value = scene;
  loadPlans();
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/plan/detail?id=${id}` });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }
.scene-tabs { display: flex; background: #fff; padding: 20rpx; gap: 16rpx; overflow-x: auto; }
.tab { padding: 12rpx 28rpx; border-radius: 30rpx; font-size: 26rpx; color: #666; background: #f5f5f5; white-space: nowrap; }
.tab.active { background: #ff6b35; color: #fff; }
.plan-list { padding: 20rpx; }
.plan-card { background: #fff; border-radius: 12rpx; overflow: hidden; margin-bottom: 20rpx; }
.plan-cover { width: 100%; height: 300rpx; }
.plan-info { padding: 24rpx; }
.plan-name { font-size: 32rpx; font-weight: bold; color: #333; display: block; }
.plan-meta { display: flex; align-items: center; gap: 12rpx; margin-top: 12rpx; }
.meta-tag { background: #fff3ed; color: #ff6b35; font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 20rpx; }
.meta-text { font-size: 22rpx; color: #999; }
.plan-desc { font-size: 26rpx; color: #666; margin-top: 12rpx; display: block; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.plan-steps-preview { display: flex; gap: 20rpx; margin-top: 16rpx; }
.step-count, .pkg-count { font-size: 22rpx; color: #999; background: #f5f5f5; padding: 6rpx 16rpx; border-radius: 6rpx; }
.empty { text-align: center; padding: 200rpx 0; color: #999; }
</style>
