<template>
  <view class="page">
    <view class="cat-tabs">
      <view class="tab" :class="{ active: cat === '' }" @tap="switchCat('')">全部</view>
      <view class="tab" :class="{ active: cat === c }" v-for="c in cats" :key="c" @tap="switchCat(c)">{{ c }}</view>
    </view>
    <view class="service-list">
      <view class="service-card" v-for="s in services" :key="s.id">
        <image v-if="s.coverImage" :src="s.coverImage" class="svc-img" mode="aspectFill" />
        <view class="svc-body">
          <text class="svc-name">{{ s.name }}</text>
          <text class="svc-cat">{{ s.category }}</text>
          <text class="svc-desc">{{ s.description }}</text>
          <view class="svc-footer">
            <text class="svc-price">¥{{ s.price }}/{{ s.unit }}</text>
            <view class="book-btn" @tap="handleBook(s)">预约</view>
          </view>
        </view>
      </view>
    </view>
    <view v-if="!services.length" class="empty"><text>暂无服务</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listServices } from '../../api/local-service';

const cats = ['厨师', '摄影', 'DJ', '调酒', '蛋糕', '教练'];
const cat = ref('');
const services = ref<any[]>([]);

onMounted(() => load());
async function load() {
  services.value = await listServices(cat.value || undefined);
}
function switchCat(c: string) { cat.value = c; load(); }
function handleBook(s: any) {
  uni.setStorageSync('selectedService', JSON.stringify(s));
  uni.showToast({ title: '已选择服务', icon: 'success' });
  setTimeout(() => uni.navigateBack(), 500);
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }
.cat-tabs { display: flex; background: #fff; padding: 20rpx; gap: 12rpx; overflow-x: auto; }
.tab { padding: 12rpx 24rpx; border-radius: 30rpx; font-size: 24rpx; color: #666; background: #f5f5f5; white-space: nowrap; }
.tab.active { background: #ff6b35; color: #fff; }
.service-list { padding: 20rpx; }
.service-card { display: flex; background: #fff; border-radius: 12rpx; overflow: hidden; margin-bottom: 16rpx; }
.svc-img { width: 200rpx; height: 180rpx; }
.svc-body { flex: 1; padding: 20rpx; display: flex; flex-direction: column; }
.svc-name { font-size: 28rpx; font-weight: bold; color: #333; }
.svc-cat { font-size: 20rpx; color: #ff6b35; background: #fff3ed; padding: 2rpx 12rpx; border-radius: 10rpx; display: inline-block; margin-top: 6rpx; width: fit-content; }
.svc-desc { font-size: 22rpx; color: #999; margin-top: 8rpx; flex: 1; }
.svc-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 8rpx; }
.svc-price { font-size: 28rpx; color: #ff6b35; font-weight: bold; }
.book-btn { background: #ff6b35; color: #fff; padding: 8rpx 24rpx; border-radius: 20rpx; font-size: 24rpx; }
.empty { text-align: center; padding: 200rpx 0; color: #999; }
</style>
