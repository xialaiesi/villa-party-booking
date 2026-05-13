<template>
  <div class="container villa-detail" v-if="villa">
    <!-- 图片画廊 -->
    <div class="gallery">
      <div class="main-image" @mousedown="onDragStart" @mousemove="onDragMove" @mouseup="onDragEnd" @mouseleave="onDragEnd">
        <div class="img-skeleton" v-if="mainImageLoading"></div>
        <el-image
          :src="resolveImg(currentImage || '')"
          fit="cover"
          :preview-src-list="allImages"
          :initial-index="currentIndex"
          preview-teleported
          loading="lazy"
          @load="mainImageLoading = false"
          @error="mainImageLoading = false; mainImageError = true"
          style="width: 100%; height: 500px; border-radius: 12px; user-select: none;"
          v-show="!mainImageError"
        />
        <div class="img-error-placeholder" v-if="mainImageError" style="width: 100%; height: 500px; border-radius: 12px;">
          <span>图片加载失败</span>
        </div>
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
          <img :src="thumbUrl(img.url)" loading="lazy" @error="(e: Event) => onImgError(e)" />
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
                loading="lazy"
                style="width: 100%; border-radius: 8px; cursor: pointer;"
              >
                <template #error>
                  <div class="img-error-placeholder" style="height: 300px; border-radius: 8px;">
                    <span>图片加载失败</span>
                  </div>
                </template>
              </el-image>
              <div class="caption" v-if="img.caption">{{ img.caption }}</div>
            </div>
          </div>
        </div>

        <!-- 评价 -->
        <div class="card">
          <h3>💬 用户评价 ({{ reviewStats.total }})</h3>

          <!-- 多维度评分条形图 -->
          <div class="dimension-ratings" v-if="reviewStats.total > 0">
            <div class="dimension-item" v-for="dim in dimensionRatings" :key="dim.label">
              <span class="dim-label">{{ dim.label }}</span>
              <div class="dim-bar-bg">
                <div class="dim-bar-fill" :style="{ width: (dim.score / 5 * 100) + '%' }"></div>
              </div>
              <span class="dim-score">{{ dim.score }}</span>
            </div>
          </div>

          <!-- 视频测评（水平滚动卡片流） -->
          <div class="video-reviews" v-if="videoReviews.length">
            <div class="section-title">真实入住视频</div>
            <div class="video-scroll-container">
              <div class="video-list">
                <div class="video-item" v-for="v in videoReviews" :key="v.url" @click="playVideo(v.url)">
                  <video :src="v.url" class="video-cover" preload="metadata" />
                  <div class="play-icon">▶</div>
                  <div class="video-duration" v-if="v.duration">{{ formatDuration(v.duration) }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 评论排序 -->
          <div class="review-sort-bar" v-if="reviews.length">
            <span class="sort-label">排序：</span>
            <span
              class="sort-option"
              :class="{ active: reviewSort === 'latest' }"
              @click="changeSort('latest')"
            >最新</span>
            <span
              class="sort-option"
              :class="{ active: reviewSort === 'rating_desc' }"
              @click="changeSort('rating_desc')"
            >最高评分</span>
            <span
              class="sort-option"
              :class="{ active: reviewSort === 'rating_asc' }"
              @click="changeSort('rating_asc')"
            >最低评分</span>
          </div>

          <div v-if="reviews.length">
            <div class="review" v-for="r in reviews" :key="r.id">
              <img v-if="r.user?.avatar" :src="r.user.avatar" class="avatar" />
              <div v-else class="avatar avatar-letter">{{ (r.user?.nickname || '用').charAt(0) }}</div>
              <div class="review-body">
                <div class="review-header">
                  <span class="review-name">{{ r.user?.nickname || '用户' }}</span>
                  <span class="review-stars">
                    <span v-for="n in 5" :key="n" :class="n <= r.rating ? 'star-f' : 'star-e'">★</span>
                  </span>
                </div>
                <div class="review-content">{{ r.content }}</div>
                <!-- 评价中的视频 -->
                <div class="review-videos" v-if="r.videos?.length">
                  <div class="video-thumb" v-for="(v, i) in r.videos" :key="i" @click="playVideo(v.url)">
                    <video :src="v.url" />
                    <div class="play-icon">▶</div>
                  </div>
                </div>
                <div class="review-date">{{ formatDate(r.createdAt) }}</div>
                <div class="review-reply-box" v-if="r.reply">
                  <b>商家回复：</b>{{ r.reply }}
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无评价" :image-size="80" />
        </div>

        <!-- 相似别墅推荐 -->
        <div class="card" v-if="similarVillas.length">
          <h3>看看类似的</h3>
          <div class="similar-grid">
            <div class="similar-card" v-for="sv in similarVillas" :key="sv.id" @click="$router.push('/villa/' + sv.id)">
              <img :src="thumbUrl(sv.coverImage)" loading="lazy" />
              <div class="similar-info">
                <div class="similar-name">{{ sv.name }}</div>
                <div class="similar-meta">{{ sv.maxGuests }}人 · ¥{{ sv.basePrice }}起</div>
              </div>
            </div>
          </div>
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
          <el-button size="large" class="share-btn" @click="generateShareCard">📤 分享</el-button>

          <!-- 紧迫感 -->
          <div class="urgency-info" v-if="bookingStats.monthOrders > 0">
            <span>本月已被预订 {{ bookingStats.monthOrders }} 次</span>
          </div>
          <div class="urgency-info next-date" v-if="bookingStats.nextAvailable">
            <span>最近可订：{{ bookingStats.nextAvailable }}</span>
          </div>

          <div class="contact-info">
            <div class="contact-title">需要帮助？</div>
            <div class="contact-phone">📞 400-xxx-xxxx</div>
          </div>

          <!-- 微信咨询 -->
          <div class="wechat-consult" @click="showWechat = true">
            <span>不确定？先微信聊聊</span>
          </div>
        </div>

        <!-- 微信弹窗 -->
        <div class="wechat-overlay" v-if="showWechat" @click.self="showWechat = false">
          <div class="wechat-popup">
            <div class="wechat-popup-close" @click="showWechat = false">&times;</div>
            <h3>微信咨询</h3>
            <p>扫码或搜索添加微信</p>
            <p class="wechat-popup-id">微信号：villa_service</p>
          </div>
        </div>
      </div>
    </div>
    <!-- 分享卡片弹窗 -->
    <div class="share-modal" v-if="shareCardUrl" @click.self="shareCardUrl = ''">
      <div class="share-card-wrap">
        <div class="share-card-close" @click="shareCardUrl = ''">&times;</div>
        <img :src="shareCardUrl" class="share-card-img" />
        <p class="share-tip">长按图片保存，分享给朋友</p>
        <button class="share-download-btn" @click="downloadShareCard">保存到手机</button>
      </div>
    </div>
    <canvas ref="shareCanvas" style="display: none;" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getVilla, getVillaReviews, listVillas } from '../../api/villa';
import { detailUrl, thumbUrl } from '../../utils/request';
import { trackEvent } from '../../utils/tracker';
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
const reviewSort = ref('latest');
const mainImageLoading = ref(true);
const mainImageError = ref(false);
const similarVillas = ref<any[]>([]);
const bookingStats = reactive({ monthOrders: 0, nextAvailable: '' });
const showWechat = ref(false);
const shareCardUrl = ref('');
const shareCanvas = ref<HTMLCanvasElement>();

// 切换图片时重置加载状态
watch(currentIndex, () => {
  mainImageLoading.value = true;
  mainImageError.value = false;
});

function onImgError(e: Event) {
  const el = e.target as HTMLImageElement;
  el.style.display = 'none';
  const placeholder = document.createElement('div');
  placeholder.className = 'img-error-inline';
  placeholder.textContent = '图片加载失败';
  el.parentElement?.appendChild(placeholder);
}

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

// 多维度评分（后端暂无多维度数据，用总评分模拟）
const dimensionRatings = computed(() => {
  const avg = parseFloat(reviewStats.value.avgRating) || 0;
  if (avg === 0) return [];
  // 基于总评分模拟各维度，加微小偏移使其更真实
  return [
    { label: '清洁度', score: Math.min(5, Math.max(1, +(avg + 0.1).toFixed(1))) },
    { label: '设施', score: Math.min(5, Math.max(1, +(avg - 0.1).toFixed(1))) },
    { label: '位置', score: Math.min(5, Math.max(1, +(avg + 0.2).toFixed(1))) },
    { label: '性价比', score: Math.min(5, Math.max(1, +(avg - 0.2).toFixed(1))) },
  ];
});

async function fetchReviews(sort?: string) {
  const id = parseInt(route.params.id as string);
  const sortParam = sort === 'latest' ? undefined : sort;
  const res: any = await getVillaReviews(id, 1, 50, sortParam);
  reviews.value = res.list || [];
  reviewStats.value = { avgRating: res.avgRating || '0.0', total: res.total || 0 };
}

function changeSort(sort: string) {
  reviewSort.value = sort;
  fetchReviews(sort);
}

onMounted(async () => {
  const id = parseInt(route.params.id as string);
  try {
    villa.value = await getVilla(id);
    await fetchReviews('latest');
    // 加载相似别墅
    const res: any = await listVillas({ pageSize: 5 });
    const list = (res.list || res || []).filter((v: any) => Number(v.id) !== id);
    similarVillas.value = list.slice(0, 4).map((v: any) => ({
      id: Number(v.id),
      name: v.name,
      coverImage: v.coverImage || v.images?.[0]?.url,
      basePrice: Number(v.basePrice),
      maxGuests: v.maxGuests,
    }));
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

const videoReviews = computed(() => {
  const arr: any[] = [];
  reviews.value.forEach(r => {
    if (r.videos?.length) {
      r.videos.forEach((v: any) => {
        arr.push({ url: v.url, duration: v.duration });
      });
    }
  });
  return arr;
});

function playVideo(url: string) {
  window.open(url, '_blank');
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ===== 分享卡片 =====
async function generateShareCard() {
  if (!villa.value || !shareCanvas.value) return;
  const canvas = shareCanvas.value;
  const w = 750;
  const h = 1000;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // 背景
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);

  // 顶部图片区域
  try {
    const imgUrl = detailUrl(villa.value.coverImage || villa.value.images?.[0]?.url || '');
    const img = await loadImage(imgUrl);
    ctx.drawImage(img, 0, 0, w, 420);
  } catch {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, w, 420);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('别墅实景', w / 2, 220);
  }

  // 别墅名
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 36px PingFang SC, sans-serif';
  ctx.fillText(villa.value.name, 40, 490);

  // 亮点
  const facilities = villa.value.facilities?.slice(0, 4).map((f: any) => f.name).join(' · ') || '';
  ctx.fillStyle = '#64748b';
  ctx.font = '24px PingFang SC, sans-serif';
  ctx.fillText(facilities, 40, 540);

  // 规格
  ctx.fillText(`${villa.value.maxGuests}人 · ${villa.value.bedrooms}卧 · ${villa.value.area}㎡`, 40, 585);

  // 价格
  ctx.fillStyle = '#ff6b35';
  ctx.font = 'bold 48px PingFang SC, sans-serif';
  ctx.fillText(`¥${villa.value.basePrice}`, 40, 660);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '24px PingFang SC, sans-serif';
  ctx.fillText('起/晚', 40 + ctx.measureText(`¥${villa.value.basePrice}`).width + 8, 660);

  // 评分
  if (villa.value.ratingAvg) {
    ctx.fillStyle = '#f59e0b';
    ctx.font = '28px PingFang SC, sans-serif';
    const ratingText = `★ ${villa.value.ratingAvg} (${villa.value.ratingCount}条评价)`;
    ctx.fillText(ratingText, 40, 710);
  }

  // 底部引导
  ctx.fillStyle = '#f8f6f3';
  ctx.fillRect(0, 760, w, 240);
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 28px PingFang SC, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('扫码或搜索查看详情', w / 2, 830);

  // 链接
  ctx.fillStyle = '#94a3b8';
  ctx.font = '22px PingFang SC, sans-serif';
  ctx.fillText(window.location.href, w / 2, 880);

  // 品牌
  ctx.fillStyle = '#ff6b35';
  ctx.font = 'bold 22px PingFang SC, sans-serif';
  ctx.fillText('别墅轰趴', w / 2, 940);

  shareCardUrl.value = canvas.toDataURL('image/png');
  trackEvent('share_click', { targetId: Number(route.params.id), targetType: 'villa' });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function downloadShareCard() {
  if (!shareCardUrl.value) return;
  const link = document.createElement('a');
  link.download = `${villa.value?.name || '别墅'}-分享卡片.png`;
  link.href = shareCardUrl.value;
  link.click();
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

/* 多维度评分条形图 */
.dimension-ratings {
  display: grid; gap: 10px; margin-bottom: 20px;
  padding-bottom: 20px; border-bottom: 1px solid #f5f5f5;
}
.dimension-item {
  display: flex; align-items: center; gap: 12px;
}
.dim-label {
  width: 56px; font-size: 13px; color: #64748b; text-align: right; flex-shrink: 0;
}
.dim-bar-bg {
  flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden;
}
.dim-bar-fill {
  height: 100%; background: linear-gradient(90deg, #fbbf24, #f59e0b);
  border-radius: 4px; transition: width 0.6s ease;
}
.dim-score {
  width: 28px; font-size: 13px; font-weight: 600; color: #d97706; text-align: left;
}

/* 评论排序栏 */
.review-sort-bar {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 8px; padding-bottom: 12px; border-bottom: 1px solid #f5f5f5;
}
.sort-label { font-size: 13px; color: #999; }
.sort-option {
  font-size: 13px; color: #666; cursor: pointer; padding: 4px 12px;
  border-radius: 16px; transition: all 0.2s;
}
.sort-option:hover { color: #ff6b35; background: #fff3ed; }
.sort-option.active {
  color: #fff; background: #ff6b35; font-weight: 600;
}

.review { display: flex; gap: 16px; padding: 20px 0; border-bottom: 1px solid #f5f5f5; }
.review:last-child { border-bottom: none; }
.avatar { width: 48px; height: 48px; border-radius: 50%; }
.avatar-letter { display: flex; align-items: center; justify-content: center; background: #e0e7ff; color: #4f46e5; font-size: 20px; font-weight: 600; }
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

.video-reviews { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #f5f5f5; }
.section-title { font-size: 14px; color: #666; margin-bottom: 12px; font-weight: 600; }
.video-scroll-container { overflow-x: auto; margin: 0 -8px; padding: 0 8px; }
.video-scroll-container::-webkit-scrollbar { height: 6px; }
.video-scroll-container::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }
.video-scroll-container::-webkit-scrollbar-track { background: transparent; }
.video-list { display: flex; gap: 12px; padding-bottom: 4px; }
.video-item { position: relative; width: 200px; height: 130px; border-radius: 8px; overflow: hidden; cursor: pointer; flex-shrink: 0; }
.video-cover { width: 100%; height: 100%; object-fit: cover; }
.play-icon { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 36px; height: 36px; background: rgba(0,0,0,0.5); border-radius: 50%; color: #fff; font-size: 14px; display: flex; align-items: center; justify-content: center; }
.video-duration { position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.6); color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 11px; }

.review-videos { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.review-videos .video-thumb { position: relative; width: 120px; height: 90px; border-radius: 6px; overflow: hidden; cursor: pointer; }
.review-videos video { width: 100%; height: 100%; object-fit: cover; }
.review-videos .play-icon { width: 24px; height: 24px; font-size: 10px; }

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
.share-btn { width: 100%; margin-top: 8px; margin-left: 0 !important; }

/* 分享卡片弹窗 */
.share-modal {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 200; backdrop-filter: blur(4px);
}
.share-card-wrap {
  background: #fff; border-radius: 16px;
  padding: 24px; text-align: center;
  max-width: 420px; width: 90%;
  position: relative;
}
.share-card-close {
  position: absolute; top: 8px; right: 14px;
  font-size: 28px; color: #94a3b8; cursor: pointer;
}
.share-card-img { width: 100%; border-radius: 10px; }
.share-tip { font-size: 13px; color: #94a3b8; margin: 12px 0 8px; }
.share-download-btn {
  background: linear-gradient(135deg, #ff6b35, #ff4500);
  color: #fff; border: none; border-radius: 24px;
  padding: 12px 36px; font-size: 15px; font-weight: 600;
  cursor: pointer; transition: all 0.3s;
}
.share-download-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255,107,53,0.4); }
.contact-info {
  margin-top: 24px; padding-top: 20px; border-top: 1px solid #f5f5f5;
  text-align: center;
}
.contact-title { font-size: 13px; color: #999; }
.contact-phone { font-size: 18px; color: #ff6b35; font-weight: bold; margin-top: 6px; }

/* 相似别墅 */
.similar-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.similar-card {
  display: flex; gap: 12px; cursor: pointer;
  padding: 10px; border-radius: 10px;
  transition: background 0.2s;
}
.similar-card:hover { background: #f8fafc; }
.similar-card img { width: 100px; height: 70px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.similar-info { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.similar-name { font-size: 14px; font-weight: 600; color: #1e293b; }
.similar-meta { font-size: 12px; color: #94a3b8; margin-top: 4px; }

/* 紧迫感信息 */
.urgency-info {
  text-align: center; font-size: 13px; color: #f59e0b;
  background: #fffbeb; padding: 8px; border-radius: 8px;
  margin-top: 12px; font-weight: 500;
}
.urgency-info.next-date { color: #22c55e; background: #f0fdf4; margin-top: 8px; }

/* 微信咨询按钮 */
.wechat-consult {
  margin-top: 16px; text-align: center;
  padding: 12px; border-radius: 10px;
  background: #f0fdf4; color: #16a34a;
  cursor: pointer; font-size: 14px; font-weight: 600;
  transition: all 0.3s; border: 1px solid #bbf7d0;
}
.wechat-consult:hover { background: #dcfce7; }

/* 微信弹窗 */
.wechat-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 200;
}
.wechat-popup {
  background: #fff; border-radius: 16px;
  padding: 32px 28px; text-align: center;
  max-width: 340px; width: 90%;
  position: relative;
}
.wechat-popup-close {
  position: absolute; top: 10px; right: 14px;
  font-size: 24px; color: #94a3b8; cursor: pointer;
}
.wechat-popup h3 { font-size: 18px; margin-bottom: 8px; }
.wechat-popup p { font-size: 13px; color: #64748b; }
.wechat-popup-id { font-size: 16px !important; color: #1e293b !important; font-weight: 600; margin-top: 12px !important; }

/* 骨架屏 */
.img-skeleton {
  position: absolute; inset: 0; z-index: 1;
  border-radius: 12px; background: #e2e8f0;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 图片加载失败占位 */
.img-error-placeholder {
  display: flex; align-items: center; justify-content: center;
  background: #f1f5f9; color: #94a3b8; font-size: 14px;
}
.img-error-inline {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  background: #f1f5f9; color: #94a3b8; font-size: 13px; border-radius: 8px;
}
</style>
