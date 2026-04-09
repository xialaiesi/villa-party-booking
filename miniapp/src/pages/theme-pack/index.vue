<template>
  <view class="page">
    <view class="theme-tabs">
      <view class="tab" :class="{ active: currentTheme === '' }" @tap="switchTheme('')">全部</view>
      <view class="tab" :class="{ active: currentTheme === t }" v-for="t in themes" :key="t" @tap="switchTheme(t)">{{ t }}</view>
    </view>

    <view class="pack-list">
      <view class="pack-card" v-for="pack in packs" :key="pack.id">
        <image v-if="pack.coverImage" :src="pack.coverImage" class="pack-cover" mode="aspectFill" />
        <view class="pack-body">
          <view class="pack-header">
            <text class="pack-name">{{ pack.name }}</text>
            <text class="pack-theme">{{ pack.theme }}</text>
          </view>
          <text class="pack-desc">{{ pack.description }}</text>
          <view class="pack-items" v-if="pack.items?.length">
            <text class="item" v-for="(item, i) in pack.items.slice(0, 5)" :key="i">{{ item }}</text>
            <text class="item more" v-if="pack.items.length > 5">+{{ pack.items.length - 5 }}项</text>
          </view>
          <view class="pack-footer">
            <view class="price-group">
              <text class="pack-price">¥{{ pack.price }}</text>
              <text class="original-price" v-if="pack.originalPrice">¥{{ pack.originalPrice }}</text>
            </view>
            <view class="add-btn" @tap="addPack(pack)">加入订单</view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="packs.length === 0" class="empty"><text>暂无氛围包</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { listThemePacks } from '../../api/theme-pack';

const themes = ['赛博朋克', '复古', '露营', 'ins风', '派对'];
const currentTheme = ref('');
const packs = ref<any[]>([]);

onMounted(() => loadPacks());

async function loadPacks() {
  try {
    packs.value = await listThemePacks(currentTheme.value || undefined);
  } catch (e) { console.error(e); }
}

function switchTheme(t: string) {
  currentTheme.value = t;
  loadPacks();
}

function addPack(pack: any) {
  uni.setStorageSync('selectedThemePack', JSON.stringify(pack));
  uni.showToast({ title: '已选择氛围包', icon: 'success' });
  setTimeout(() => uni.navigateBack(), 500);
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; }
.theme-tabs { display: flex; background: #fff; padding: 20rpx; gap: 12rpx; overflow-x: auto; }
.tab { padding: 12rpx 24rpx; border-radius: 30rpx; font-size: 24rpx; color: #666; background: #f5f5f5; white-space: nowrap; }
.tab.active { background: #ff6b35; color: #fff; }
.pack-list { padding: 20rpx; }
.pack-card { background: #fff; border-radius: 12rpx; overflow: hidden; margin-bottom: 20rpx; }
.pack-cover { width: 100%; height: 320rpx; }
.pack-body { padding: 24rpx; }
.pack-header { display: flex; justify-content: space-between; align-items: center; }
.pack-name { font-size: 32rpx; font-weight: bold; color: #333; }
.pack-theme { font-size: 22rpx; color: #ff6b35; background: #fff3ed; padding: 4rpx 16rpx; border-radius: 20rpx; }
.pack-desc { font-size: 26rpx; color: #666; margin-top: 12rpx; display: block; }
.pack-items { display: flex; flex-wrap: wrap; gap: 8rpx; margin-top: 16rpx; }
.item { font-size: 22rpx; color: #666; background: #f5f5f5; padding: 6rpx 16rpx; border-radius: 6rpx; }
.item.more { color: #999; }
.pack-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; }
.price-group { display: flex; align-items: baseline; gap: 12rpx; }
.pack-price { font-size: 36rpx; color: #ff6b35; font-weight: bold; }
.original-price { font-size: 24rpx; color: #ccc; text-decoration: line-through; }
.add-btn { background: #ff6b35; color: #fff; padding: 12rpx 32rpx; border-radius: 30rpx; font-size: 26rpx; }
.empty { text-align: center; padding: 200rpx 0; color: #999; }
</style>
