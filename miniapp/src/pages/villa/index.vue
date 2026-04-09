<template>
  <view class="page" v-if="villa">
    <!-- 顶部轮播图（前 5 张） -->
    <swiper class="swiper" indicator-dots autoplay circular>
      <swiper-item v-for="(img, i) in topImages" :key="img.id" @tap="previewImage(i)">
        <image :src="resolveImg(img.url)" mode="aspectFill" class="swiper-img" />
      </swiper-item>
      <swiper-item v-if="!villa.images?.length">
        <image :src="resolveImg(villa.coverImage) || '/static/logo.png'" mode="aspectFill" class="swiper-img" />
      </swiper-item>
    </swiper>
    <view class="img-count" v-if="villa.images?.length">
      共 {{ villa.images.length }} 张图片
    </view>

    <!-- 基本信息 -->
    <view class="info-card">
      <view class="name-row">
        <text class="villa-name">{{ villa.name }}</text>
        <view class="rating-block" v-if="reviewStats.avgRating !== '0.0'">
          <text class="star">★</text>
          <text class="rating">{{ reviewStats.avgRating }}</text>
          <text class="rating-count">({{ reviewStats.total }})</text>
        </view>
      </view>
      <view class="merchant-row" v-if="villa.merchant">
        <image v-if="villa.merchant.logo" :src="villa.merchant.logo" class="merchant-logo" />
        <text class="merchant-name">{{ villa.merchant.name }}</text>
        <text class="merchant-badge">官方认证</text>
      </view>
      <view class="villa-meta">
        <text>{{ villa.maxGuests }}人 · {{ villa.bedrooms }}卧 · {{ villa.area }}㎡</text>
      </view>
      <view class="address-row" @tap="openLocation">
        <text class="villa-address">📍 {{ villa.address }}</text>
        <text class="nav-icon">导航 ›</text>
      </view>
      <view class="price-row">
        <text class="price">¥{{ villa.basePrice }}</text>
        <text class="price-label">平日/晚</text>
        <text class="price weekend">¥{{ villa.weekendPrice }}</text>
        <text class="price-label">周末/晚</text>
      </view>
      <view class="deposit" v-if="villa.deposit > 0">
        <text>押金 ¥{{ villa.deposit }}（退房后退还）</text>
      </view>
    </view>

    <!-- 设施 -->
    <view class="info-card">
      <text class="card-title">设施配套</text>
      <view class="facility-list">
        <view class="facility-item" v-for="f in villa.facilities" :key="f.id">
          <text>{{ f.name }}</text>
        </view>
      </view>
    </view>

    <!-- 描述 -->
    <view class="info-card">
      <text class="card-title">别墅介绍</text>
      <text class="description">{{ villa.description }}</text>
    </view>

    <!-- 美篇式图集（所有图片大图 + 说明） -->
    <view class="gallery" v-if="villa.images?.length">
      <view class="gallery-title">
        <text class="card-title">🏡 别墅实景</text>
        <text class="gallery-sub">滑动查看全部 {{ villa.images.length }} 张</text>
      </view>
      <view
        class="gallery-item"
        v-for="(img, i) in villa.images"
        :key="img.id"
        @tap="previewImage(i)"
      >
        <image :src="resolveImg(img.url)" mode="widthFix" class="gallery-img" lazy-load />
        <view class="gallery-caption" v-if="img.caption">
          <text>{{ img.caption }}</text>
        </view>
      </view>
    </view>

    <!-- 相关活动方案 -->
    <view class="info-card" v-if="plans.length">
      <view class="title-row">
        <text class="card-title">🎭 推荐活动方案</text>
        <text class="more-link" @tap="goPlanList">更多</text>
      </view>
      <scroll-view scroll-x class="scroll-x">
        <view class="plan-card" v-for="p in plans" :key="p.id" @tap="goPlan(p.id)">
          <image v-if="p.coverImage" :src="resolveImg(p.coverImage)" class="plan-img" mode="aspectFill" />
          <view class="plan-body">
            <text class="plan-name">{{ p.name }}</text>
            <text class="plan-meta">{{ p.scene }} · {{ p.minGuests }}-{{ p.maxGuests }}人</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 评价 -->
    <view class="info-card">
      <view class="title-row">
        <text class="card-title">💬 用户评价 ({{ reviewStats.total }})</text>
        <text class="more-link" v-if="reviews.length > 3" @tap="showAllReviews = true">查看全部</text>
      </view>
      <view v-if="reviews.length">
        <view class="review-item" v-for="r in reviews.slice(0, showAllReviews ? reviews.length : 3)" :key="r.id">
          <view class="review-header">
            <image :src="r.user?.avatar || '/static/logo.png'" class="avatar" />
            <view class="review-user">
              <text class="review-name">{{ r.user?.nickname || '用户' }}</text>
              <view class="review-rating">
                <text v-for="n in 5" :key="n" :class="{ 'star-filled': n <= r.rating, 'star-empty': n > r.rating }">★</text>
              </view>
            </view>
            <text class="review-date">{{ formatDate(r.createdAt) }}</text>
          </view>
          <text class="review-content">{{ r.content }}</text>
        </view>
      </view>
      <view v-else class="no-review">
        <text>暂无评价，成为第一个评价的用户吧</text>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="bottom-bar">
      <view class="bottom-icons">
        <view class="icon-btn" @tap="toggleFavorite">
          <text>{{ isFavorite ? '❤' : '🤍' }}</text>
          <text class="icon-label">收藏</text>
        </view>
      </view>
      <view class="price-info">
        <text class="bottom-price">¥{{ villa.basePrice }}起</text>
        <text class="price-desc">/晚 · 连住享优惠</text>
      </view>
      <view class="book-btn" @tap="goBooking">
        <text>立即预订</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getVilla, getVillaReviews, getVillaPlans } from '../../api/villa';
import { resolveImageUrl } from '../../utils/request';

const villa = ref<any>(null);
const reviews = ref<any[]>([]);
const reviewStats = ref({ avgRating: '0.0', total: 0 });
const plans = ref<any[]>([]);
const showAllReviews = ref(false);
const isFavorite = ref(false);
let villaId = 0;

const resolveImg = resolveImageUrl;

const topImages = computed(() => (villa.value?.images || []).slice(0, 5));

function previewImage(index: number) {
  const urls = (villa.value?.images || []).map((img: any) => resolveImg(img.url));
  if (!urls.length) return;
  uni.previewImage({
    urls,
    current: urls[index],
  });
}

onLoad(async (query: any) => {
  villaId = parseInt(query.id);
  await Promise.all([loadVilla(), loadReviews(), loadPlans()]);
});

async function loadVilla() {
  try {
    villa.value = await getVilla(villaId);
  } catch (e) { console.error(e); }
}

async function loadReviews() {
  try {
    const res: any = await getVillaReviews(villaId);
    reviews.value = res.list || [];
    reviewStats.value = { avgRating: res.avgRating || '0.0', total: res.total || 0 };
  } catch (e) { console.error(e); }
}

async function loadPlans() {
  try {
    plans.value = await getVillaPlans();
  } catch (e) { console.error(e); }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString();
}

function openLocation() {
  if (villa.value?.latitude && villa.value?.longitude) {
    uni.openLocation({
      latitude: Number(villa.value.latitude),
      longitude: Number(villa.value.longitude),
      name: villa.value.name,
      address: villa.value.address,
    });
  } else {
    uni.showToast({ title: '暂无定位', icon: 'none' });
  }
}

function toggleFavorite() {
  isFavorite.value = !isFavorite.value;
  uni.showToast({
    title: isFavorite.value ? '已收藏' : '已取消',
    icon: 'none',
  });
}

function goBooking() {
  uni.navigateTo({ url: `/pages/booking/index?id=${villaId}` });
}

function goPlan(id: number) {
  uni.navigateTo({ url: `/pages/plan/detail?id=${id}` });
}

function goPlanList() {
  uni.navigateTo({ url: '/pages/plan/index' });
}
</script>

<style lang="scss">
.page { background: #f5f5f5; padding-bottom: 140rpx; }
.swiper { height: 500rpx; }
.swiper-img { width: 100%; height: 100%; }
.info-card { background: #fff; margin: 20rpx; padding: 30rpx; border-radius: 16rpx; }

.name-row { display: flex; justify-content: space-between; align-items: flex-start; }
.villa-name { font-size: 36rpx; font-weight: bold; color: #333; flex: 1; }
.rating-block { display: flex; align-items: center; gap: 4rpx; }
.star { color: #ffc107; font-size: 26rpx; }
.rating { font-size: 28rpx; color: #333; font-weight: bold; }
.rating-count { font-size: 22rpx; color: #999; }

.merchant-row { display: flex; align-items: center; gap: 12rpx; margin-top: 12rpx; }
.merchant-logo { width: 40rpx; height: 40rpx; border-radius: 50%; }
.merchant-name { font-size: 24rpx; color: #666; }
.merchant-badge { font-size: 20rpx; color: #ff6b35; background: #fff3ed; padding: 2rpx 12rpx; border-radius: 10rpx; }
.villa-meta { font-size: 26rpx; color: #666; margin-top: 12rpx; }

.address-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 8rpx; padding: 12rpx 0;
}
.villa-address { font-size: 24rpx; color: #666; flex: 1; }
.nav-icon { font-size: 24rpx; color: #ff6b35; }

.price-row { margin-top: 20rpx; display: flex; align-items: baseline; gap: 12rpx; }
.price { font-size: 36rpx; color: #ff6b35; font-weight: bold; }
.price.weekend { color: #e74c3c; }
.price-label { font-size: 22rpx; color: #999; }
.deposit { margin-top: 12rpx; font-size: 24rpx; color: #e67e22; }

.card-title { font-size: 30rpx; font-weight: bold; color: #333; }
.title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.more-link { font-size: 24rpx; color: #ff6b35; }

.facility-list { display: flex; flex-wrap: wrap; gap: 16rpx; margin-top: 16rpx; }
.facility-item { background: #f5f5f5; padding: 10rpx 24rpx; border-radius: 8rpx; font-size: 24rpx; color: #666; }
.description { font-size: 26rpx; color: #666; line-height: 1.8; display: block; }

.img-count {
  position: relative; margin: -60rpx 20rpx 10rpx auto;
  display: inline-block; padding: 8rpx 20rpx;
  background: rgba(0,0,0,0.6); color: #fff;
  border-radius: 30rpx; font-size: 22rpx;
  align-self: flex-end; float: right; z-index: 10;
}

.gallery { background: #fff; margin: 20rpx; padding: 30rpx 20rpx; border-radius: 16rpx; }
.gallery-title {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 24rpx; padding: 0 10rpx;
}
.gallery-sub { font-size: 22rpx; color: #999; }
.gallery-item {
  margin-bottom: 24rpx; border-radius: 12rpx; overflow: hidden;
  background: #f5f5f5;
}
.gallery-item:last-child { margin-bottom: 0; }
.gallery-img { width: 100%; display: block; min-height: 200rpx; }
.gallery-caption {
  padding: 16rpx 24rpx; background: #fff; border-top: 1rpx solid #f5f5f5;
}
.gallery-caption text { font-size: 26rpx; color: #333; line-height: 1.6; }

.scroll-x { white-space: nowrap; }
.plan-card {
  display: inline-block; width: 300rpx; margin-right: 16rpx;
  background: #fafafa; border-radius: 10rpx; overflow: hidden; vertical-align: top;
}
.plan-img { width: 100%; height: 160rpx; }
.plan-body { padding: 16rpx; }
.plan-name { font-size: 26rpx; color: #333; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.plan-meta { font-size: 22rpx; color: #999; margin-top: 4rpx; display: block; }

.review-item { padding: 20rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.review-item:last-child { border-bottom: none; }
.review-header { display: flex; align-items: center; gap: 12rpx; }
.avatar { width: 56rpx; height: 56rpx; border-radius: 50%; }
.review-user { flex: 1; }
.review-name { font-size: 26rpx; color: #333; display: block; }
.review-rating { display: flex; gap: 2rpx; margin-top: 4rpx; }
.star-filled { color: #ffc107; font-size: 20rpx; }
.star-empty { color: #ddd; font-size: 20rpx; }
.review-date { font-size: 22rpx; color: #999; }
.review-content { font-size: 26rpx; color: #666; line-height: 1.6; margin-top: 12rpx; display: block; }
.no-review { text-align: center; padding: 30rpx 0; color: #999; font-size: 24rpx; }

.bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0; background: #fff;
  display: flex; align-items: center; padding: 16rpx 30rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
  gap: 16rpx;
}
.bottom-icons { display: flex; gap: 20rpx; }
.icon-btn { display: flex; flex-direction: column; align-items: center; font-size: 32rpx; }
.icon-label { font-size: 18rpx; color: #666; margin-top: 2rpx; }
.price-info { flex: 1; display: flex; flex-direction: column; margin-left: 12rpx; }
.bottom-price { font-size: 34rpx; color: #ff6b35; font-weight: bold; }
.price-desc { font-size: 20rpx; color: #999; }
.book-btn {
  background: linear-gradient(135deg, #ff6b35, #ff8f65);
  color: #fff; padding: 20rpx 48rpx; border-radius: 40rpx;
  font-size: 28rpx; font-weight: bold;
}
</style>
