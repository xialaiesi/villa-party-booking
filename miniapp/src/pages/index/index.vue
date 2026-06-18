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
          <image :src="resolveImg(b.coverImage) || '/static/logo.png'" class="banner-img" mode="aspectFill" />
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
          <image :src="resolveImg(g.coverImage)" class="group-img" mode="aspectFill" />
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
          <image v-if="p.coverImage" :src="resolveImg(p.coverImage)" class="pack-img" mode="aspectFill" />
          <view class="pack-body">
            <text class="pack-name">{{ p.name }}</text>
            <text class="pack-price">¥{{ p.price }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 推荐别墅 -->
    <view class="section">
      <text class="section-title">推荐别墅</text>
      <Skeleton v-if="loading" type="list" :count="3" />
      <view v-else class="villa-grid">
        <view class="villa-card" v-for="villa in villas" :key="villa.id" @tap="goDetail(villa.id)">
          <view class="villa-cover-wrap">
            <image class="villa-cover" :src="resolveImg(villa.coverImage)" mode="aspectFill" lazy-load />
            <text class="villa-price-tag">¥{{ villa.basePrice }}<text class="price-unit">/晚</text></text>
          </view>
          <view class="villa-info">
            <text class="villa-name">{{ villa.name }}</text>
            <text class="villa-address">{{ villa.address }}</text>
            <view class="villa-meta">
              <text class="villa-guests">{{ villa.maxGuests }}人</text>
              <view class="villa-tags">
                <text class="tag" v-for="tag in (villa.tags || '').split(',').filter(Boolean).slice(0, 2)" :key="tag">{{ tag }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 趴友圈精选 -->
    <view class="section" v-if="posts.length">
      <view class="section-header">
        <text class="section-title">💬 趴友圈</text>
        <text class="section-more" @tap="goPage('/pages/community/index')">更多</text>
      </view>
      <view class="post-grid">
        <view class="post-item" v-for="p in posts" :key="p.id" @tap="goPage('/pages/community/index')">
          <image v-if="p.images?.[0]" :src="resolveImg(p.images[0])" class="post-img" mode="aspectFill" lazy-load />
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
import { resolveImageUrl } from '../../utils/request';
import Skeleton from '../../components/Skeleton.vue';

const resolveImg = resolveImageUrl;

const banners = ref<any[]>([]);
const villas = ref<any[]>([]);
const groupBuys = ref<any[]>([]);
const posts = ref<any[]>([]);
const themePacks = ref<any[]>([]);
const loading = ref(true);

const gridItems = [
  { name: '智能选墅', icon: '🏠', url: '/pages/smart/index' },
  { name: '活动方案', icon: '🎭', url: '/pages/plan/index' },
  { name: '氛围包', icon: '🎨', url: '/pages/theme-pack/index' },
  { name: '周边服务', icon: '🛎️', url: '/pages/service/index' },
  { name: '趴友圈', icon: '👥', url: '/pages/community/index' },
  { name: '限定活动', icon: '🎪', url: '/pages/seasonal/index' },
  { name: 'AI策划', icon: '💡', url: '/pages/planner/index' },
  { name: '我的相册', icon: '🖼️', url: '/pages/album/index' },
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
  background: #fff; margin: 16rpx 20rpx; padding: 18rpx 28rpx;
  border-radius: 40rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}
.search-icon { font-size: 28rpx; }
.search-placeholder { color: #bbb; font-size: 26rpx; flex: 1; }

.banner { height: 300rpx; margin: 0 20rpx; border-radius: 16rpx; overflow: hidden; }
.banner-item { position: relative; height: 100%; }
.banner-img { width: 100%; height: 100%; }
.banner-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 24rpx; color: #fff;
  background: linear-gradient(transparent, rgba(0,0,0,0.55));
}
.banner-title { font-size: 32rpx; font-weight: bold; color: #fff; display: block; }
.banner-desc { font-size: 24rpx; color: #ffd700; display: block; margin-top: 4rpx; }

.grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  background: #fff; margin: 16rpx 20rpx; padding: 24rpx 0 20rpx;
  border-radius: 16rpx; gap: 16rpx 0;
}
.grid-item { display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.grid-icon { font-size: 48rpx; }
.grid-name { font-size: 22rpx; color: #555; }

.ai-card {
  display: flex; align-items: center;
  margin: 0 20rpx 16rpx; padding: 20rpx 24rpx;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12rpx;
}
.ai-left { flex: 1; }
.ai-title { font-size: 26rpx; font-weight: bold; color: #fff; display: block; }
.ai-desc { font-size: 20rpx; color: rgba(255,255,255,0.8); display: block; margin-top: 4rpx; }
.ai-arrow { color: rgba(255,255,255,0.7); font-size: 32rpx; }

.section { margin: 20rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.section-title { font-size: 30rpx; font-weight: bold; color: #333; }
.section-more { font-size: 24rpx; color: #999; }

.scroll-x { white-space: nowrap; display: flex; }

.group-card {
  display: inline-block; width: 300rpx; margin-right: 12rpx;
  background: #fff; border-radius: 12rpx; overflow: hidden; vertical-align: top;
}
.group-img { width: 100%; height: 180rpx; }
.group-body { padding: 12rpx; }
.group-name { font-size: 24rpx; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.group-discount { font-size: 24rpx; color: #ff6b35; font-weight: bold; display: block; margin-top: 4rpx; }
.group-progress { margin-top: 6rpx; }
.progress-text { font-size: 20rpx; color: #999; }

.pack-card {
  display: inline-block; width: 240rpx; margin-right: 12rpx;
  background: #fff; border-radius: 12rpx; overflow: hidden; vertical-align: top;
}
.pack-img { width: 100%; height: 150rpx; }
.pack-body { padding: 10rpx 12rpx; }
.pack-name { font-size: 22rpx; color: #333; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pack-price { font-size: 24rpx; color: #ff6b35; font-weight: bold; display: block; margin-top: 4rpx; }

/* 别墅双列卡片 */
.villa-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12rpx; }
.villa-card { background: #fff; border-radius: 12rpx; overflow: hidden; }
.villa-cover-wrap { position: relative; }
.villa-cover { width: 100%; height: 220rpx; display: block; }
.villa-price-tag {
  position: absolute; bottom: 8rpx; left: 8rpx;
  background: rgba(255, 107, 53, 0.9); color: #fff;
  font-size: 24rpx; font-weight: bold; padding: 4rpx 12rpx; border-radius: 6rpx;
}
.villa-price-tag .price-unit { font-size: 18rpx; font-weight: normal; opacity: 0.85; }
.villa-info { padding: 12rpx; }
.villa-name {
  font-size: 26rpx; font-weight: bold; color: #333; display: block;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.villa-address {
  font-size: 20rpx; color: #999; display: block; margin-top: 4rpx;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.villa-meta { display: flex; align-items: center; gap: 8rpx; margin-top: 8rpx; }
.villa-guests {
  font-size: 18rpx; color: #666; background: #f5f5f5;
  padding: 2rpx 10rpx; border-radius: 4rpx; flex-shrink: 0;
}
.villa-tags { display: flex; gap: 6rpx; flex: 1; overflow: hidden; }
.tag {
  background: #fff3ed; color: #ff6b35;
  font-size: 18rpx; padding: 2rpx 10rpx; border-radius: 4rpx;
  white-space: nowrap; flex-shrink: 0;
}

.post-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12rpx; }
.post-item { background: #fff; border-radius: 12rpx; overflow: hidden; }
.post-img { width: 100%; height: 240rpx; }
.post-placeholder { background: #f0f0f0; }
.post-footer {
  padding: 10rpx 12rpx;
  display: flex; justify-content: space-between; align-items: center;
}
.post-user { font-size: 20rpx; color: #666; }
.post-like { font-size: 20rpx; color: #ff6b35; }
</style>
