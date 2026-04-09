<template>
  <view class="page">
    <view class="filter-bar">
      <view class="filter-item" @tap="showDatePicker = true">
        <text>{{ checkIn || '入住日期' }}</text>
      </view>
      <view class="filter-item" @tap="showGuestPicker = true">
        <text>{{ guests ? guests + '人' : '人数' }}</text>
      </view>
      <view class="filter-item" @tap="showSort = !showSort">
        <text>排序</text>
      </view>
    </view>

    <view class="villa-list">
      <view class="villa-card" v-for="villa in villaList" :key="villa.id" @tap="goDetail(villa.id)">
        <image class="villa-cover" :src="villa.coverImage" mode="aspectFill" />
        <view class="villa-info">
          <text class="villa-name">{{ villa.name }}</text>
          <view class="villa-meta">
            <text>{{ villa.maxGuests }}人 · {{ villa.bedrooms }}卧</text>
          </view>
          <text class="villa-price">¥{{ villa.basePrice }}/晚起</text>
        </view>
      </view>
    </view>

    <view v-if="villaList.length === 0" class="empty">
      <text>暂无符合条件的别墅</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { listVillas } from '../../api/villa';

const villaList = ref<any[]>([]);
const checkIn = ref('');
const guests = ref(0);
const tag = ref('');
const showDatePicker = ref(false);
const showGuestPicker = ref(false);
const showSort = ref(false);

onLoad((query: any) => {
  if (query?.tag) tag.value = query.tag;
  loadData();
});

async function loadData() {
  try {
    const res = await listVillas({
      tag: tag.value || undefined,
      guests: guests.value || undefined,
      check_in: checkIn.value || undefined,
    });
    villaList.value = res.list;
  } catch (e) {
    console.error(e);
  }
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/villa/index?id=${id}` });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }
.filter-bar { display: flex; background: #fff; padding: 20rpx; gap: 16rpx; }
.filter-item { flex: 1; text-align: center; background: #f5f5f5; padding: 16rpx; border-radius: 8rpx; font-size: 26rpx; color: #333; }
.villa-list { padding: 20rpx; }
.villa-card { display: flex; background: #fff; border-radius: 12rpx; overflow: hidden; margin-bottom: 20rpx; }
.villa-cover { width: 240rpx; height: 200rpx; }
.villa-info { flex: 1; padding: 20rpx; display: flex; flex-direction: column; justify-content: space-between; }
.villa-name { font-size: 28rpx; font-weight: bold; color: #333; }
.villa-meta { font-size: 24rpx; color: #999; }
.villa-price { font-size: 30rpx; color: #ff6b35; font-weight: bold; }
.empty { text-align: center; padding: 100rpx 0; color: #999; font-size: 28rpx; }
</style>
