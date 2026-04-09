<template>
  <view class="empty">
    <text class="empty-icon">{{ icon }}</text>
    <text class="empty-text">{{ text || '暂无数据' }}</text>
    <view v-if="action" class="empty-btn" @tap="$emit('action')">
      <text>{{ action }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string;
  text?: string;
  action?: string;
}>();
defineEmits(['action']);
</script>

<style lang="scss">
.empty { text-align: center; padding: 120rpx 40rpx; }
.empty-icon { font-size: 120rpx; display: block; }
.empty-text { font-size: 26rpx; color: #999; display: block; margin-top: 24rpx; }
.empty-btn {
  display: inline-block;
  background: #ff6b35; color: #fff;
  padding: 16rpx 48rpx; border-radius: 40rpx;
  font-size: 26rpx; margin-top: 32rpx;
}
</style>
