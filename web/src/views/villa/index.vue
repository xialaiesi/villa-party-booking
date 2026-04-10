<template>
  <div class="container villa-detail" v-if="villa">
    <!-- 图片画廊 -->
    <div class="gallery">
      <div class="main-image" @mousedown="onDragStart" @mousemove="onDragMove" @mouseup="onDragEnd" @mouseleave="onDragEnd">
        <el-image
          :src="resolveImg(currentImage || '')"
          fit="cover"
          :preview-src-list="allImages"
          :initial-index="currentIndex"
          preview-teleported
          style="width: 100%; height: 500px; border-radius: 12px; user-select: none;"
        />
        <!-- 左右箭头 -->
        <button class="gallery-arrow left" @click.stop="prevImage" v-if="totalImages > 1">‹</button>
        <button class="gallery-arrow right" @click.stop="nextImage" v-if="totalImages > 1">›</button>
        <!-- 计数器 -->
        <div class="gallery-counter" v-if="totalImages > 1">{{ currentIndex + 1 }} / {{ totalImages }}</div>
      </div>
      <div class="thumbnails">
        <div
          v-for="(img, i) in villa.images?.slice(0, 5)"
          :key="img.id"
          class="thumb"
          :class="{ active: currentIndex === i }"
          @click="currentIndex = Number(i)"
        >
          <img :src="thumbUrl(img.url)" />
        </div>
        <div class="thumb view-all" v-if="villa.images?.length > 5" @click="currentIndex = 5">
          <span>+{{ villa.images.length - 5 }}</span>
        </div>
      </div>
    </div>

    <!-- 两栏布局 -->
    <div class="detail-body">
      <div class="main-col">
        <!-- 标题区 -->
        <div class="card">
          <div class="title-row">
            <h1>{{ villa.name }}</h1>
            <div class="rating-badge" v-if="villa.ratingAvg">
              <span class="rating-score">{{ villa.ratingAvg }}</span>
              <span class="rating-label">{{ villa.ratingCount }}条评价</span>
            </div>
            <div class="rating-badge no-rating" v-else>
              <span class="rating-label">暂无评分（{{ villa.ratingCount || 0 }}条）</span>
            </div>
          </div>
          <div class="merchant-row" v-if="villa.merchant">
            <span class="badge merchant-badge">{{ villa.merchant.name }}</span>
            <span class="badge verify-badge">官方认证</span>
          </div>
          <div class="villa-meta">
            <span class="meta-item"><b>{{ villa.maxGuests }}</b>人</span>
            <span class="meta-dot">·</span>
            <span class="meta-item"><b>{{ villa.bedrooms }}</b>卧</span>
            <span class="meta-dot">·</span>
            <span class="meta-item"><b>{{ villa.area }}</b>㎡</span>
          </div>
          <div class="villa-address">📍 {{ villa.address }}</div>
        </div>

        <!-- 设施 -->
        <div class="card">
          <h3>设施配套</h3>
          <div class="facility-grid">
            <div class="facility-chip" v-for="f in villa.facilities" :key="f.id">
              {{ f.name }}
            </div>
          </div>
        </div>

        <!-- 介绍 -->
        <div class="card">
          <h3>别墅介绍</h3>
          <p class="description">{{ villa.description }}</p>
        </div>

        <!-- 美篇式图集 -->
        <div class="card" v-if="villa.images?.length">
          <h3>🏡 别墅实景</h3>
          <div class="image-gallery">
            <div class="gallery-item" v-for="img in villa.images" :key="img.id">
              <el-image
                :src="resolveImg(img.url)"
                fit="cover"
                :preview-src-list="allImages"
                preview-teleported
                style="width: 100%; border-radius: 8px; cursor: pointer;"
              />
              <div class="caption" v-if="img.caption">{{ img.caption }}</div>
            </div>
          </div>
        </div>

        <!-- 评价 -->
        <div class="card">
          <h3>💬 用户评价 ({{ reviewStats.total }})</h3>
          <div v-if="reviews.length">
            <div class="review" v-for="r in reviews" :key="r.id">
              <img :src="r.user?.avatar || '/vite.svg'" class="avatar" />
              <div class="review-body">
                <div class="review-header">
                  <span class="review-name">{{ r.user?.nickname || '用户' }}</span>
                  <span class="review-stars">
                    <span v-for="n in 5" :key="n" :class="n <= r.rating ? 'star-f' : 'star-e'">★</span>
                  </span>
                </div>
                <div class="review-content">{{ r.content }}</div>
                <div class="review-date">{{ formatDate(r.createdAt) }}</div>
                <div class="review-reply-box" v-if="r.reply">
                  <b>商家回复：</b>{{ r.reply }}
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无评价" :image-size="80" />
        </div>
      </div>

      <!-- 右侧预订栏 -->
      <div class="side-col">
        <div class="booking-card">
          <div class="price-row">
            <span class="price">¥{{ villa.basePrice }}</span>
            <span class="unit">起/晚</span>
          </div>
          <div class="price-note">
            <div>平日 ¥{{ villa.basePrice }} · 周末 ¥{{ villa.weekendPrice }}</div>
            <div v-if="villa.deposit > 0">押金 ¥{{ villa.deposit }}（退房后退还）</div>
          </div>
          <div class="discount-info" v-if="villa.discount3d || villa.discount5d || villa.discount7d">
            <span v-if="villa.discount3d">连住 3 天 {{ (Number(villa.discount3d) * 10).toFixed(1) }}折</span>
            <span v-if="villa.discount5d">· 5 天 {{ (Number(villa.discount5d) * 10).toFixed(1) }}折</span>
            <span v-if="villa.discount7d">· 7 天 {{ (Number(villa.discount7d) * 10).toFixed(1) }}折</span>
          </div>
          <el-button type="primary" size="large" class="book-btn" @click="goBooking">
            立即预订
          </el-button>
          <el-button size="large" class="fav-btn">❤ 收藏</el-button>

          <div class="contact-info">
            <div class="contact-title">需要帮助？</div>
            <div class="contact-phone">📞 400-xxx-xxxx</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getVilla, getVillaReviews } from '../../api/villa';
import { detailUrl, thumbUrl } from '../../utils/request';
import { useUserStore } from '../../store/user';
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const resolveImg = detailUrl;

const villa = ref<any>(null);
const reviews = ref<any[]>([]);
const reviewStats = ref({ avgRating: '0.0', total: 0 });
const currentIndex = ref(0);

const totalImages = computed(() => villa.value?.images?.length || 0);

function prevImage() {
  if (totalImages.value > 0) {
    currentIndex.value = (currentIndex.value - 1 + totalImages.value) % totalImages.value;
  }
}
function nextImage() {
  if (totalImages.value > 0) {
    currentIndex.value = (currentIndex.value + 1) % totalImages.value;
  }
}

// 键盘左右切换
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') prevImage();
  if (e.key === 'ArrowRight') nextImage();
}
onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));

// 鼠标拖动切换
let dragStartX = 0;
let isDragging = false;
function onDragStart(e: MouseEvent) { dragStartX = e.clientX; isDragging = true; }
function onDragMove(e: MouseEvent) { if (isDragging) e.preventDefault(); }
function onDragEnd(e: MouseEvent) {
  if (!isDragging) return;
  isDragging = false;
  const diff = e.clientX - dragStartX;
  if (Math.abs(diff) > 60) {
    if (diff > 0) prevImage(); else nextImage();
  }
}

const currentImage = computed(() => {
  if (!villa.value?.images?.length) return villa.value?.coverImage;
  return villa.value.images[currentIndex.value]?.url;
});

const allImages = computed(() =>
  (villa.value?.images || []).map((img: any) => detailUrl(img.url)),
);

onMounted(async () => {
  const id = parseInt(route.params.id as string);
  try {
    villa.value = await getVilla(id);
    const res: any = await getVillaReviews(id);
    reviews.value = res.list || [];
    reviewStats.value = { avgRating: res.avgRating || '0.0', total: res.total || 0 };
  } catch (e) { console.error(e); }
});

function goBooking() {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录');
    router.push(`/login?redirect=/booking/${route.params.id}`);
    return;
  }
  router.push(`/booking/${route.params.id}`);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString();
}
</script>

<style scoped>
.villa-detail { padding: 30px 0 60px; }

.gallery { margin-bottom: 30px; }
.main-image { margin-bottom: 12px; position: relative; cursor: grab; }
.main-image:active { cursor: grabbing; }

.gallery-arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(0,0,0,0.45); color: #fff;
  border: none; font-size: 28px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; opacity: 0; z-index: 2;
  line-height: 1;
}
.main-image:hover .gallery-arrow { opacity: 1; }
.gallery-arrow:hover { background: rgba(0,0,0,0.7); transform: translateY(-50%) scale(1.1); }
.gallery-arrow.left { left: 16px; }
.gallery-arrow.right { right: 16px; }

.gallery-counter {
  position: absolute; bottom: 16px; right: 16px;
  background: rgba(0,0,0,0.5); color: #fff;
  padding: 4px 14px; border-radius: 16px;
  font-size: 13px; font-weight: 500; z-index: 2;
}
.thumbnails { display: flex; gap: 12px; }
.thumb {
  width: 120px; height: 80px; border-radius: 8px;
  overflow: hidden; cursor: pointer;
  border: 3px solid transparent; transition: all 0.2s;
}
.thumb.active { border-color: #ff6b35; }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.thumb.view-all {
  background: rgba(0,0,0,0.6); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: bold;
}

.detail-body {
  display: grid; grid-template-columns: 1fr 380px; gap: 30px;
}
.card {
  background: #fff; padding: 30px; border-radius: 12px;
  margin-bottom: 20px;
}
.card h3 { font-size: 18px; color: #1e293b; margin-bottom: 16px; font-weight: 700; }

.title-row { display: flex; justify-content: space-between; align-items: flex-start; }
.title-row h1 { font-size: 28px; color: #1e293b; font-weight: 800; }
.rating-badge {
  display: flex; flex-direction: column; align-items: center;
  padding: 8px 16px; border-radius: 10px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
}
.rating-badge.no-rating { background: #f1f5f9; }
.rating-score { font-size: 24px; font-weight: 800; color: #d97706; line-height: 1; }
.rating-label { font-size: 11px; color: #92400e; margin-top: 2px; }
.no-rating .rating-label { color: #94a3b8; }
.merchant-row { display: flex; gap: 8px; margin: 12px 0; }
.badge {
  display: inline-block; padding: 4px 12px; border-radius: 16px;
  font-size: 12px; font-weight: 600;
}
.merchant-badge {
  background: linear-gradient(135deg, #fff3ed, #ffe8d6); color: #ff6b35;
  border: 1px solid #ffd4b8;
}
.verify-badge {
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9); color: #2e7d32;
  border: 1px solid #a5d6a7;
}
.villa-meta {
  font-size: 15px; color: #64748b; margin: 10px 0;
  display: flex; align-items: center; gap: 6px;
}
.meta-item b { color: #1e293b; font-weight: 700; font-size: 17px; }
.meta-dot { color: #cbd5e1; }
.villa-address { font-size: 14px; color: #94a3b8; }

.facility-grid {
  display: flex; flex-wrap: wrap; gap: 10px;
}
.facility-chip {
  padding: 8px 18px; border-radius: 20px; font-size: 13px; font-weight: 500;
  background: #f8fafc; color: #475569; border: 1px solid #e2e8f0;
  transition: all 0.2s;
}
.facility-chip:hover { background: #f0f7ff; color: #3b82f6; border-color: #bfdbfe; }

.description { font-size: 14px; color: #666; line-height: 1.8; }

.image-gallery { display: grid; gap: 16px; }
.gallery-item .caption {
  padding: 12px 0; font-size: 14px; color: #666;
  text-align: center;
}

.review { display: flex; gap: 16px; padding: 20px 0; border-bottom: 1px solid #f5f5f5; }
.review:last-child { border-bottom: none; }
.avatar { width: 48px; height: 48px; border-radius: 50%; }
.review-body { flex: 1; }
.review-header { display: flex; gap: 12px; align-items: center; }
.review-name { font-weight: bold; color: #333; }
.review-stars .star-f { color: #ffc107; }
.review-stars .star-e { color: #ddd; }
.review-content { font-size: 14px; color: #666; margin: 8px 0; line-height: 1.6; }
.review-date { font-size: 12px; color: #999; }
.review-reply-box {
  margin-top: 10px; padding: 10px 14px; background: #f8fafc; border-radius: 8px;
  font-size: 13px; color: #64748b; line-height: 1.6; border-left: 3px solid #3b82f6;
}
.review-reply-box b { color: #3b82f6; }

.side-col { position: sticky; top: 100px; align-self: start; }
.booking-card {
  background: #fff; padding: 30px; border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}
.price-row { display: flex; align-items: baseline; gap: 8px; }
.price { font-size: 36px; color: #ff6b35; font-weight: bold; }
.unit { font-size: 14px; color: #999; }
.price-note { font-size: 13px; color: #666; margin: 12px 0; line-height: 1.8; }
.discount-info {
  background: #fff3ed; color: #ff6b35;
  padding: 10px 14px; border-radius: 8px;
  font-size: 13px; margin: 16px 0;
}
.book-btn {
  width: 100%; height: 50px; font-size: 16px;
  background: linear-gradient(135deg, #ff6b35, #ff8f65); border: none;
  margin-bottom: 12px;
}
.fav-btn { width: 100%; }
.contact-info {
  margin-top: 24px; padding-top: 20px; border-top: 1px solid #f5f5f5;
  text-align: center;
}
.contact-title { font-size: 13px; color: #999; }
.contact-phone { font-size: 18px; color: #ff6b35; font-weight: bold; margin-top: 6px; }
</style>
