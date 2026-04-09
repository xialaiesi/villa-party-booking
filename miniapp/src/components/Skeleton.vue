<template>
  <view class="skeleton" :class="{ 'skeleton--list': type === 'list' }">
    <template v-if="type === 'card'">
      <view class="sk-img"></view>
      <view class="sk-body">
        <view class="sk-line sk-line--title"></view>
        <view class="sk-line sk-line--short"></view>
        <view class="sk-line"></view>
      </view>
    </template>
    <template v-else-if="type === 'list'">
      <view class="sk-list-item" v-for="n in count" :key="n">
        <view class="sk-img-sm"></view>
        <view class="sk-body">
          <view class="sk-line sk-line--title"></view>
          <view class="sk-line"></view>
          <view class="sk-line sk-line--short"></view>
        </view>
      </view>
    </template>
    <template v-else>
      <view class="sk-line sk-line--title"></view>
      <view class="sk-line"></view>
      <view class="sk-line sk-line--short"></view>
    </template>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  type?: 'card' | 'list' | 'text';
  count?: number;
}>();
</script>

<style lang="scss">
@keyframes skeleton-loading {
  0% { background-position: -200rpx 0; }
  100% { background-position: 200rpx 0; }
}

.skeleton { padding: 20rpx; }
.sk-img {
  width: 100%; height: 300rpx; border-radius: 12rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 400rpx 100%;
  animation: skeleton-loading 1.2s infinite;
}
.sk-img-sm {
  width: 180rpx; height: 140rpx; border-radius: 8rpx; flex-shrink: 0;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 400rpx 100%;
  animation: skeleton-loading 1.2s infinite;
}
.sk-body { padding: 20rpx 0; flex: 1; }
.sk-line {
  height: 24rpx; border-radius: 4rpx; margin-bottom: 12rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 400rpx 100%;
  animation: skeleton-loading 1.2s infinite;
}
.sk-line--title { width: 60%; height: 32rpx; }
.sk-line--short { width: 40%; }
.sk-list-item { display: flex; gap: 20rpx; padding: 20rpx 0; border-bottom: 1rpx solid #f5f5f5; }
</style>
