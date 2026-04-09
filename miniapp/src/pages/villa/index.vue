<template>
  <view class="page" v-if="villa">
    <!-- 轮播图 -->
    <swiper class="swiper" indicator-dots autoplay circular>
      <swiper-item v-for="img in villa.images" :key="img.id">
        <image :src="img.url" mode="aspectFill" class="swiper-img" />
      </swiper-item>
    </swiper>

    <!-- 基本信息 -->
    <view class="info-card">
      <text class="villa-name">{{ villa.name }}</text>
      <view class="merchant-row" v-if="villa.merchant">
        <image v-if="villa.merchant.logo" :src="villa.merchant.logo" class="merchant-logo" />
        <text class="merchant-name">{{ villa.merchant.name }}</text>
        <text class="merchant-badge">官方认证</text>
      </view>
      <view class="villa-meta">
        <text>{{ villa.maxGuests }}人 · {{ villa.bedrooms }}卧 · {{ villa.area }}㎡</text>
      </view>
      <text class="villa-address">{{ villa.address }}</text>
      <view class="price-row">
        <text class="price">¥{{ villa.basePrice }}</text>
        <text class="price-label">平日/晚</text>
        <text class="price weekend">¥{{ villa.weekendPrice }}</text>
        <text class="price-label">周末/晚</text>
      </view>
      <view class="deposit" v-if="villa.deposit > 0">
        <text>押金 ¥{{ villa.deposit }}</text>
      </view>
    </view>

    <!-- 设施 -->
    <view class="info-card">
      <text class="card-title">设施</text>
      <view class="facility-list">
        <view class="facility-item" v-for="f in villa.facilities" :key="f.id">
          <text>{{ f.name }}</text>
        </view>
      </view>
    </view>

    <!-- 描述 -->
    <view class="info-card">
      <text class="card-title">介绍</text>
      <text class="description">{{ villa.description }}</text>
    </view>

    <!-- 底部操作 -->
    <view class="bottom-bar">
      <view class="price-info">
        <text class="price">¥{{ villa.basePrice }}起</text>
        <text class="price-desc">/晚 · 连住优惠</text>
      </view>
      <view class="book-btn" @tap="goBooking">
        <text>立即预订</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getVilla } from '../../api/villa';

const villa = ref<any>(null);
let villaId = 0;

onLoad((query: any) => {
  villaId = parseInt(query.id);
  loadData();
});

async function loadData() {
  try {
    villa.value = await getVilla(villaId);
  } catch (e) {
    console.error(e);
  }
}

function goBooking() {
  uni.navigateTo({ url: `/pages/booking/index?id=${villaId}` });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; padding-bottom: 120rpx; }
.swiper { height: 500rpx; }
.swiper-img { width: 100%; height: 100%; }
.info-card { background: #fff; margin: 20rpx; padding: 30rpx; border-radius: 12rpx; }
.villa-name { font-size: 36rpx; font-weight: bold; color: #333; display: block; }
.merchant-row { display: flex; align-items: center; gap: 12rpx; margin-top: 12rpx; }
.merchant-logo { width: 40rpx; height: 40rpx; border-radius: 50%; }
.merchant-name { font-size: 24rpx; color: #666; }
.merchant-badge { font-size: 20rpx; color: #ff6b35; background: #fff3ed; padding: 2rpx 12rpx; border-radius: 10rpx; }
.villa-meta { font-size: 26rpx; color: #666; margin-top: 12rpx; }
.villa-address { font-size: 24rpx; color: #999; margin-top: 8rpx; display: block; }
.price-row { margin-top: 20rpx; display: flex; align-items: baseline; gap: 12rpx; }
.price { font-size: 36rpx; color: #ff6b35; font-weight: bold; }
.price.weekend { color: #e74c3c; }
.price-label { font-size: 22rpx; color: #999; }
.deposit { margin-top: 12rpx; font-size: 24rpx; color: #e67e22; }
.card-title { font-size: 30rpx; font-weight: bold; color: #333; display: block; margin-bottom: 16rpx; }
.facility-list { display: flex; flex-wrap: wrap; gap: 16rpx; }
.facility-item { background: #f5f5f5; padding: 10rpx 24rpx; border-radius: 8rpx; font-size: 24rpx; color: #666; }
.description { font-size: 26rpx; color: #666; line-height: 1.8; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; display: flex; align-items: center; justify-content: space-between; padding: 20rpx 30rpx; box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05); }
.price-info { .price { font-size: 36rpx; } .price-desc { font-size: 22rpx; color: #999; } }
.book-btn { background: #ff6b35; color: #fff; padding: 20rpx 60rpx; border-radius: 40rpx; font-size: 30rpx; font-weight: bold; }
</style>
