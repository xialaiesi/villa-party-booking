<template>
  <view class="page">
    <view class="search-bar" @tap="goSearch">
      <text class="search-placeholder">搜索别墅、地点...</text>
    </view>

    <view class="categories">
      <view class="category-item" v-for="item in categories" :key="item.tag" @tap="goSearch({ tag: item.tag })">
        <text class="category-icon">{{ item.icon }}</text>
        <text class="category-name">{{ item.name }}</text>
      </view>
    </view>

    <view class="section">
      <text class="section-title">推荐别墅</text>
      <view class="villa-card" v-for="villa in villaList" :key="villa.id" @tap="goDetail(villa.id)">
        <image class="villa-cover" :src="villa.coverImage" mode="aspectFill" />
        <view class="villa-info">
          <text class="villa-name">{{ villa.name }}</text>
          <text class="villa-address">{{ villa.address }}</text>
          <view class="villa-tags">
            <text class="tag" v-for="tag in (villa.tags || '').split(',')" :key="tag">{{ tag }}</text>
          </view>
          <view class="villa-bottom">
            <text class="villa-price">¥{{ villa.basePrice }}<text class="price-unit">/晚</text></text>
            <text class="villa-guests">可住{{ villa.maxGuests }}人</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listVillas } from '../../api/villa';

const categories = [
  { name: '团建', tag: '团建', icon: '🏢' },
  { name: '生日', tag: '生日', icon: '🎂' },
  { name: '聚会', tag: '聚会', icon: '🎉' },
  { name: '全部', tag: '', icon: '🏡' },
];

const villaList = ref<any[]>([]);

onMounted(async () => {
  try {
    const res = await listVillas({ page: 1, pageSize: 10 });
    villaList.value = res.list;
  } catch (e) {
    console.error(e);
  }
});

function goSearch(params?: any) {
  const query = params?.tag ? `?tag=${params.tag}` : '';
  uni.navigateTo({ url: `/pages/search/index${query}` });
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/villa/index?id=${id}` });
}
</script>

<style lang="scss">
.page { padding: 20rpx; background: #f5f5f5; min-height: 100vh; }
.search-bar { background: #fff; border-radius: 40rpx; padding: 20rpx 30rpx; margin-bottom: 30rpx; }
.search-placeholder { color: #999; font-size: 28rpx; }
.categories { display: flex; justify-content: space-around; margin-bottom: 30rpx; }
.category-item { display: flex; flex-direction: column; align-items: center; }
.category-icon { font-size: 48rpx; }
.category-name { font-size: 24rpx; color: #333; margin-top: 8rpx; }
.section-title { font-size: 32rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; display: block; }
.villa-card { background: #fff; border-radius: 16rpx; overflow: hidden; margin-bottom: 20rpx; }
.villa-cover { width: 100%; height: 360rpx; }
.villa-info { padding: 20rpx; }
.villa-name { font-size: 30rpx; font-weight: bold; color: #333; display: block; }
.villa-address { font-size: 24rpx; color: #999; margin-top: 8rpx; display: block; }
.villa-tags { margin-top: 12rpx; }
.tag { display: inline-block; background: #fff3ed; color: #ff6b35; font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 20rpx; margin-right: 12rpx; }
.villa-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 16rpx; }
.villa-price { color: #ff6b35; font-size: 36rpx; font-weight: bold; }
.price-unit { font-size: 22rpx; color: #999; font-weight: normal; }
.villa-guests { font-size: 24rpx; color: #666; }
</style>
