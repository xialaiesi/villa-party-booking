<template>
  <view class="page">
    <!-- 搜索栏 -->
    <view class="search-bar" @tap="goSearch">
      <text class="search-icon">🔍</text>
      <text class="search-placeholder">搜索别墅、地点、场景...</text>
    </view>

    <!-- Banner 轮播 -->
    <swiper v-if="banners.length" class="banner" indicator-dots autoplay circular interval="4000">
      <swiper-item v-for="b in banners" :key="b.id" @tap="goBanner(b)">
        <view class="banner-item">
          <image :src="b.coverImage || '/static/logo.png'" class="banner-img" mode="aspectFill" />
          <view class="banner-overlay">
            <text class="banner-title">{{ b.name }}</text>
            <text class="banner-desc" v-if="b.discount">立减 ¥{{ b.discount }}</text>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <!-- 功能金刚区 -->
    <view class="grid">
      <view class="grid-item" v-for="item in gridItems" :key="item.name" @tap="goPage(item.url)">
        <text class="grid-icon">{{ item.icon }}</text>
        <text class="grid-name">{{ item.name }}</text>
      </view>
    </view>

    <!-- 智能选墅入口卡 -->
    <view class="ai-card" @tap="goPage('/pages/planner/index')">
      <view class="ai-left">
        <text class="ai-title">🤖 AI 趴体策划师</text>
        <text class="ai-desc">告诉我你的需求，一键搞定别墅+活动+氛围</text>
      </view>
      <view class="ai-arrow">→</view>
    </view>

    <!-- 正在拼团 -->
    <view class="section" v-if="groupBuys.length">
      <view class="section-header">
        <text class="section-title">🔥 正在拼团</text>
        <text class="section-more" @tap="goPage('/pages/index/index')">更多</text>
      </view>
      <scroll-view scroll-x class="scroll-x">
        <view class="group-card" v-for="g in groupBuys" :key="g.id" @tap="goGroup(g.id)">
          <image :src="g.coverImage" class="group-img" mode="aspectFill" />
          <view class="group-body">
            <text class="group-name">{{ g.villaName }}</text>
            <text class="group-discount">立减 ¥{{ g.discount }}</text>
            <view class="group-progress">
              <text class="progress-text">还差 {{ g.targetCount - g.currentCount }} 人</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 精选氛围包 -->
    <view class="section" v-if="themePacks.length">
      <view class="section-header">
        <text class="section-title">✨ 氛围包</text>
        <text class="section-more" @tap="goPage('/pages/theme-pack/index')">更多</text>
      </view>
      <scroll-view scroll-x class="scroll-x">
        <view class="pack-card" v-for="p in themePacks" :key="p.id" @tap="goPage('/pages/theme-pack/index')">
          <image v-if="p.coverImage" :src="p.coverImage" class="pack-img" mode="aspectFill" />
          <view class="pack-body">
            <text class="pack-name">{{ p.name }}</text>
            <text class="pack-price">¥{{ p.price }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 推荐别墅 -->
    <view class="section">
      <text class="section-title">🏡 推荐别墅</text>
      <Skeleton v-if="loading" type="list" :count="3" />
      <template v-else>
        <view class="villa-card" v-for="villa in villas" :key="villa.id" @tap="goDetail(villa.id)">
          <image class="villa-cover" :src="villa.coverImage" mode="aspectFill" lazy-load />
          <view class="villa-info">
            <view class="villa-header">
              <text class="villa-name">{{ villa.name }}</text>
              <text class="villa-badge" v-if="villa.merchantName">{{ villa.merchantName }}</text>
            </view>
            <text class="villa-address">📍 {{ villa.address }}</text>
            <view class="villa-tags">
              <text class="tag" v-for="tag in (villa.tags || '').split(',').filter(Boolean)" :key="tag">{{ tag }}</text>
            </view>
            <view class="villa-bottom">
              <text class="villa-price">¥{{ villa.basePrice }}<text class="price-unit">/晚起</text></text>
              <text class="villa-guests">可住 {{ villa.maxGuests }} 人</text>
            </view>
          </view>
        </view>
      </template>
    </view>

    <!-- 趴友圈精选 -->
    <view class="section" v-if="posts.length">
      <view class="section-header">
        <text class="section-title">💬 趴友圈</text>
        <text class="section-more" @tap="goPage('/pages/community/index')">更多</text>
      </view>
      <view class="post-grid">
        <view class="post-item" v-for="p in posts" :key="p.id" @tap="goPage('/pages/community/index')">
          <image v-if="p.images?.[0]" :src="p.images[0]" class="post-img" mode="aspectFill" lazy-load />
          <view v-else class="post-img post-placeholder"></view>
          <view class="post-footer">
            <text class="post-user">{{ p.user?.nickname || '用户' }}</text>
            <text class="post-like">❤ {{ p.likeCount }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getHomeData } from '../../api/home';
import Skeleton from '../../components/Skeleton.vue';

const banners = ref<any[]>([]);
const villas = ref<any[]>([]);
const groupBuys = ref<any[]>([]);
const posts = ref<any[]>([]);
const themePacks = ref<any[]>([]);
const loading = ref(true);

const gridItems = [
  { name: '智能选墅', icon: '🎯', url: '/pages/smart/index' },
  { name: '活动方案', icon: '🎭', url: '/pages/plan/index' },
  { name: '氛围包', icon: '✨', url: '/pages/theme-pack/index' },
  { name: '周边服务', icon: '🍳', url: '/pages/service/index' },
  { name: '趴友圈', icon: '💬', url: '/pages/community/index' },
  { name: '限定活动', icon: '🎉', url: '/pages/seasonal/index' },
  { name: 'AI策划', icon: '🤖', url: '/pages/planner/index' },
  { name: '我的相册', icon: '📸', url: '/pages/album/index' },
];

onShow(async () => {
  loading.value = true;
  try {
    const data = await getHomeData();
    banners.value = data.banners || [];
    villas.value = data.villas || [];
    groupBuys.value = data.groupBuys || [];
    posts.value = data.posts || [];
    themePacks.value = data.themePacks || [];
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

function goSearch() {
  uni.navigateTo({ url: '/pages/search/index' });
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/villa/index?id=${id}` });
}

const TAB_PAGES = ['/pages/index/index', '/pages/community/index', '/pages/order/index', '/pages/mine/index'];

function goPage(url: string) {
  const path = url.split('?')[0];
  if (TAB_PAGES.includes(path)) {
    uni.switchTab({ url: path });
  } else {
    uni.navigateTo({ url });
  }
}

function goBanner(b: any) {
  if (b.villaId) goDetail(b.villaId);
  else goPage('/pages/seasonal/index');
}

function goGroup(id: number) {
  uni.navigateTo({ url: `/pages/group/index?id=${id}` });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; min-height: 100vh; padding-bottom: 40rpx; }

.search-bar {
  display: flex; align-items: center; gap: 12rpx;
  background: #fff; margin: 20rpx; padding: 20rpx 30rpx;
  border-radius: 40rpx; box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.04);
}
.search-icon { font-size: 28rpx; }
.search-placeholder { color: #999; font-size: 26rpx; flex: 1; }

.banner { height: 320rpx; margin: 0 20rpx; border-radius: 16rpx; overflow: hidden; }
.banner-item { position: relative; height: 100%; }
.banner-img { width: 100%; height: 100%; }
.banner-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 30rpx; color: #fff;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
}
.banner-title { font-size: 34rpx; font-weight: bold; color: #fff; display: block; }
.banner-desc { font-size: 26rpx; color: #ffd700; display: block; margin-top: 6rpx; }

.grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  background: #fff; margin: 20rpx; padding: 30rpx 0;
  border-radius: 16rpx; gap: 20rpx 0;
}
.grid-item { display: flex; flex-direction: column; align-items: center; gap: 10rpx; }
.grid-icon { font-size: 52rpx; }
.grid-name { font-size: 22rpx; color: #333; }

.ai-card {
  display: flex; align-items: center;
  margin: 20rpx; padding: 30rpx;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(102,126,234,0.3);
}
.ai-left { flex: 1; }
.ai-title { font-size: 30rpx; font-weight: bold; color: #fff; display: block; }
.ai-desc { font-size: 22rpx; color: rgba(255,255,255,0.85); display: block; margin-top: 6rpx; }
.ai-arrow { color: #fff; font-size: 36rpx; }

.section { margin: 30rpx 20rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.section-title { font-size: 32rpx; font-weight: bold; color: #333; }
.section-more { font-size: 24rpx; color: #999; }

.scroll-x { white-space: nowrap; display: flex; }

.group-card {
  display: inline-block; width: 340rpx; margin-right: 16rpx;
  background: #fff; border-radius: 12rpx; overflow: hidden; vertical-align: top;
}
.group-img { width: 100%; height: 200rpx; }
.group-body { padding: 16rpx; }
.group-name { font-size: 26rpx; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.group-discount { font-size: 24rpx; color: #ff6b35; font-weight: bold; display: block; margin-top: 6rpx; }
.group-progress { margin-top: 8rpx; }
.progress-text { font-size: 22rpx; color: #999; }

.pack-card {
  display: inline-block; width: 260rpx; margin-right: 16rpx;
  background: #fff; border-radius: 12rpx; overflow: hidden; vertical-align: top;
}
.pack-img { width: 100%; height: 160rpx; }
.pack-body { padding: 12rpx; }
.pack-name { font-size: 24rpx; color: #333; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pack-price { font-size: 26rpx; color: #ff6b35; font-weight: bold; display: block; margin-top: 6rpx; }

.villa-card { background: #fff; border-radius: 16rpx; overflow: hidden; margin-bottom: 20rpx; }
.villa-cover { width: 100%; height: 360rpx; }
.villa-info { padding: 24rpx; }
.villa-header { display: flex; justify-content: space-between; align-items: center; }
.villa-name { font-size: 32rpx; font-weight: bold; color: #333; }
.villa-badge { font-size: 20rpx; color: #ff6b35; background: #fff3ed; padding: 4rpx 12rpx; border-radius: 10rpx; }
.villa-address { font-size: 22rpx; color: #999; display: block; margin-top: 8rpx; }
.villa-tags { margin-top: 12rpx; }
.tag {
  display: inline-block; background: #fff3ed; color: #ff6b35;
  font-size: 20rpx; padding: 4rpx 14rpx; border-radius: 20rpx; margin-right: 10rpx;
}
.villa-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 16rpx; }
.villa-price { color: #ff6b35; font-size: 34rpx; font-weight: bold; }
.price-unit { font-size: 20rpx; color: #999; font-weight: normal; }
.villa-guests { font-size: 22rpx; color: #666; }

.post-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16rpx; }
.post-item { background: #fff; border-radius: 12rpx; overflow: hidden; }
.post-img { width: 100%; height: 280rpx; }
.post-placeholder { background: #f0f0f0; }
.post-footer {
  padding: 12rpx 16rpx;
  display: flex; justify-content: space-between; align-items: center;
}
.post-user { font-size: 22rpx; color: #666; }
.post-like { font-size: 22rpx; color: #ff6b35; }
</style>
