<template>
  <view class="page">
    <!-- 搜索栏 -->
    <view class="search-header">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input v-model="keyword" class="search-input" placeholder="搜索别墅名" @confirm="loadData" />
      </view>
      <view class="filter-btn" @tap="showFilter = true">筛选</view>
    </view>

    <!-- 排序 tab -->
    <view class="sort-tabs">
      <view class="sort-tab" :class="{ active: sort === '' }" @tap="changeSort('')">综合</view>
      <view class="sort-tab" :class="{ active: sort === 'price_asc' }" @tap="changeSort('price_asc')">价格 ↑</view>
      <view class="sort-tab" :class="{ active: sort === 'price_desc' }" @tap="changeSort('price_desc')">价格 ↓</view>
      <view class="sort-tab" :class="{ active: sort === 'rating' }" @tap="changeSort('rating')">好评</view>
    </view>

    <!-- 别墅列表 -->
    <view class="villa-list" v-if="!loading && villaList.length">
      <view class="villa-card" v-for="villa in villaList" :key="villa.id" @tap="goDetail(villa.id)">
        <image class="villa-cover" :src="villa.coverImage" mode="aspectFill" lazy-load />
        <view class="villa-info">
          <text class="villa-name">{{ villa.name }}</text>
          <view class="villa-meta">
            <text>{{ villa.maxGuests }}人 · {{ villa.bedrooms }}卧</text>
          </view>
          <text class="villa-price">¥{{ villa.basePrice }}/晚起</text>
        </view>
      </view>
    </view>

    <Skeleton v-else-if="loading" type="list" :count="4" />
    <Empty v-else icon="🏡" text="暂无符合条件的别墅" />

    <!-- 筛选抽屉 -->
    <view v-if="showFilter" class="filter-mask" @tap="showFilter = false">
      <view class="filter-drawer" @tap.stop>
        <view class="filter-header">
          <text class="filter-title">筛选条件</text>
          <text class="close-btn" @tap="showFilter = false">✕</text>
        </view>

        <scroll-view scroll-y class="filter-body">
          <!-- 场景 -->
          <view class="filter-section">
            <text class="filter-label">场景</text>
            <view class="chip-group">
              <view
                v-for="t in ['团建', '生日', '聚会', '亲子']"
                :key="t"
                class="chip"
                :class="{ active: tag === t }"
                @tap="tag = tag === t ? '' : t"
              >{{ t }}</view>
            </view>
          </view>

          <!-- 人数 -->
          <view class="filter-section">
            <text class="filter-label">人数</text>
            <view class="chip-group">
              <view
                v-for="g in [5, 10, 15, 20, 30]"
                :key="g"
                class="chip"
                :class="{ active: guests === g }"
                @tap="guests = guests === g ? 0 : g"
              >{{ g }}人+</view>
            </view>
          </view>

          <!-- 价格 -->
          <view class="filter-section">
            <text class="filter-label">价格区间</text>
            <view class="chip-group">
              <view
                v-for="p in priceRanges"
                :key="p.label"
                class="chip"
                :class="{ active: minPrice === p.min && maxPrice === p.max }"
                @tap="setPriceRange(p)"
              >{{ p.label }}</view>
            </view>
          </view>

          <!-- 设施 -->
          <view class="filter-section">
            <text class="filter-label">设施</text>
            <view class="chip-group">
              <view
                v-for="f in facilities"
                :key="f.id"
                class="chip"
                :class="{ active: selectedFacilities.includes(f.id) }"
                @tap="toggleFacility(f.id)"
              >{{ f.name }}</view>
            </view>
          </view>
        </scroll-view>

        <view class="filter-footer">
          <view class="reset-btn" @tap="resetFilter">重置</view>
          <view class="confirm-btn" @tap="applyFilter">确定</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { listVillas, listFacilities } from '../../api/villa';
import Skeleton from '../../components/Skeleton.vue';
import Empty from '../../components/Empty.vue';

const keyword = ref('');
const sort = ref('');
const villaList = ref<any[]>([]);
const loading = ref(false);

const showFilter = ref(false);
const tag = ref('');
const guests = ref(0);
const minPrice = ref(0);
const maxPrice = ref(0);
const selectedFacilities = ref<number[]>([]);
const facilities = ref<any[]>([]);

const priceRanges = [
  { label: '1000以下', min: 0, max: 1000 },
  { label: '1000-2000', min: 1000, max: 2000 },
  { label: '2000-3000', min: 2000, max: 3000 },
  { label: '3000-5000', min: 3000, max: 5000 },
  { label: '5000+', min: 5000, max: 99999 },
];

onLoad((query: any) => {
  if (query?.tag) tag.value = query.tag;
  loadData();
  loadFacilities();
});

async function loadData() {
  loading.value = true;
  try {
    const res = await listVillas({
      tag: tag.value || undefined,
      guests: guests.value || undefined,
      min_price: minPrice.value || undefined,
      max_price: maxPrice.value || undefined,
      facilities: selectedFacilities.value.length ? selectedFacilities.value.join(',') : undefined,
      sort: sort.value || undefined,
    });
    villaList.value = res.list;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

async function loadFacilities() {
  try {
    facilities.value = await listFacilities();
  } catch (e) { console.error(e); }
}

function changeSort(s: string) {
  sort.value = s;
  loadData();
}

function setPriceRange(p: any) {
  if (minPrice.value === p.min && maxPrice.value === p.max) {
    minPrice.value = 0; maxPrice.value = 0;
  } else {
    minPrice.value = p.min; maxPrice.value = p.max;
  }
}

function toggleFacility(id: number) {
  const idx = selectedFacilities.value.indexOf(id);
  if (idx >= 0) selectedFacilities.value.splice(idx, 1);
  else selectedFacilities.value.push(id);
}

function resetFilter() {
  tag.value = ''; guests.value = 0;
  minPrice.value = 0; maxPrice.value = 0;
  selectedFacilities.value = [];
}

function applyFilter() {
  showFilter.value = false;
  loadData();
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/villa/index?id=${id}` });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }

.search-header { display: flex; background: #fff; padding: 20rpx; gap: 16rpx; align-items: center; }
.search-input-wrap {
  flex: 1; display: flex; align-items: center; gap: 12rpx;
  background: #f5f5f5; border-radius: 40rpx; padding: 16rpx 24rpx;
}
.search-icon { font-size: 26rpx; }
.search-input { flex: 1; font-size: 26rpx; }
.filter-btn {
  background: #fff3ed; color: #ff6b35; padding: 16rpx 28rpx;
  border-radius: 30rpx; font-size: 26rpx;
}

.sort-tabs { display: flex; background: #fff; border-top: 1rpx solid #f5f5f5; }
.sort-tab {
  flex: 1; text-align: center; padding: 24rpx 0;
  font-size: 26rpx; color: #666;
}
.sort-tab.active { color: #ff6b35; font-weight: bold; }

.villa-list { padding: 20rpx; }
.villa-card { display: flex; background: #fff; border-radius: 12rpx; overflow: hidden; margin-bottom: 20rpx; }
.villa-cover { width: 240rpx; height: 200rpx; }
.villa-info { flex: 1; padding: 20rpx; display: flex; flex-direction: column; justify-content: space-between; }
.villa-name { font-size: 28rpx; font-weight: bold; color: #333; }
.villa-meta { font-size: 24rpx; color: #999; }
.villa-price { font-size: 30rpx; color: #ff6b35; font-weight: bold; }

.filter-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); z-index: 100;
  display: flex; justify-content: flex-end;
}
.filter-drawer {
  width: 80%; background: #fff; height: 100%;
  display: flex; flex-direction: column;
}
.filter-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 30rpx; border-bottom: 1rpx solid #f0f0f0;
}
.filter-title { font-size: 32rpx; font-weight: bold; color: #333; }
.close-btn { font-size: 40rpx; color: #999; padding: 0 10rpx; }

.filter-body { flex: 1; padding: 20rpx 30rpx; }
.filter-section { margin-bottom: 40rpx; }
.filter-label { font-size: 26rpx; color: #333; font-weight: bold; display: block; margin-bottom: 16rpx; }
.chip-group { display: flex; flex-wrap: wrap; gap: 16rpx; }
.chip {
  padding: 12rpx 24rpx; background: #f5f5f5; color: #666;
  border-radius: 30rpx; font-size: 24rpx;
}
.chip.active { background: #ff6b35; color: #fff; }

.filter-footer {
  display: flex; gap: 16rpx; padding: 20rpx 30rpx;
  border-top: 1rpx solid #f0f0f0;
}
.reset-btn {
  flex: 1; text-align: center; padding: 24rpx;
  border: 1rpx solid #ddd; border-radius: 40rpx;
  font-size: 26rpx; color: #666;
}
.confirm-btn {
  flex: 2; text-align: center; padding: 24rpx;
  background: #ff6b35; color: #fff; border-radius: 40rpx;
  font-size: 26rpx; font-weight: bold;
}
</style>
