<template>
  <view class="video-page">
    <video
      :src="videoUrl"
      class="video-player"
      autoplay
      controls
      show-center-play-btn
      enable-danmu
    />
    <view class="video-tip">真实入住者拍摄 · 仅供参考</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const videoUrl = ref('');

onLoad((query: any) => {
  if (query.url) {
    videoUrl.value = decodeURIComponent(query.url);
  }
});
</script>

<style lang="scss">
.video-page {
  width: 100vw;
  height: 100vh;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.video-player {
  width: 100%;
  height: 70vh;
}
.video-tip {
  color: #999;
  font-size: 24rpx;
  margin-top: 20rpx;
}
</style>