<template>
  <div class="container villa-detail villa-detail-loading" v-if="detailLoading">
    <div class="detail-loading-gallery skeleton-block"></div>
    <div class="detail-body">
      <div class="main-col">
        <div class="card loading-card">
          <div class="skeleton-line title"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
        <div class="card loading-card" v-for="n in 3" :key="n">
          <div class="skeleton-line card-title"></div>
          <div class="skeleton-line full"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
      <div class="side-col">
        <div class="booking-card loading-card">
          <div class="skeleton-line price-loader"></div>
          <div class="skeleton-line full"></div>
          <div class="skeleton-button"></div>
        </div>
      </div>
    </div>
  </div>

  <div class="container villa-detail" v-else-if="villa">
    <!-- 图片画廊 -->
    <div class="gallery">
      <div class="main-image" @mousedown="onDragStart" @mousemove="onDragMove" @mouseup="onDragEnd" @mouseleave="onDragEnd">
        <div class="img-skeleton" v-if="mainImageLoading"></div>
        <el-image
          class="main-gallery-image"
          :src="resolveImg(currentImage || '')"
          fit="cover"
          :preview-src-list="allImages"
          :initial-index="currentIndex"
          preview-teleported
          loading="lazy"
          @load="mainImageLoading = false"
          @error="mainImageLoading = false; mainImageError = true"
          v-show="!mainImageError"
        />
        <div class="img-error-placeholder main-gallery-placeholder" v-if="mainImageError">
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

    <!-- 首屏决策卡 -->
    <div class="decision-card">
      <div class="decision-main">
        <div class="decision-kicker">适合{{ primaryScene }} · 整栋出租</div>
        <h1>{{ villa.name }}</h1>
        <div class="decision-address">📍 {{ villa.address }}</div>
        <div class="decision-tags">
          <span v-for="t in villaTags" :key="t">{{ t }}</span>
          <span v-if="villa.merchant">{{ villa.merchant.name }}</span>
        </div>
      </div>
      <div class="decision-side">
        <div class="decision-price">
          <span class="decision-price-main">¥{{ villa.basePrice }}</span>
          <span class="decision-price-unit">起/晚</span>
        </div>
        <div class="decision-per">满员约 ¥{{ perPersonPrice }}/人</div>
        <div class="decision-metrics">
          <div><b>{{ villa.maxGuests }}</b><span>可住人数</span></div>
          <div><b>{{ villa.bedrooms }}</b><span>卧室</span></div>
          <div><b>{{ villa.ratingAvg || '新' }}</b><span>{{ villa.ratingAvg ? '评分' : '上架' }}</span></div>
        </div>
        <div class="decision-facilities" v-if="topFacilities.length">
          <span v-for="f in topFacilities" :key="f">{{ f }}</span>
        </div>
        <div class="decision-actions">
          <button class="decision-consult" @click="openWechatConsult('decision_card')">微信咨询</button>
          <button class="decision-book" @click="goBooking">立即预订</button>
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
          <div class="wechat-consult" @click="openWechatConsult('side_card')">
            <span>不确定？先微信聊聊</span>
          </div>
        </div>

        <!-- 微信弹窗 -->
        <div class="wechat-overlay" v-if="showWechat" @click.self="showWechat = false">
          <div class="wechat-popup">
            <div class="wechat-popup-close" @click="showWechat = false">&times;</div>
            <h3>微信咨询</h3>
            <p>复制下面这段话，发给管家更快确认档期</p>
            <div class="wechat-consult-text">{{ detailConsultText }}</div>
            <p class="wechat-popup-id">微信号：villa_service</p>
            <button class="wechat-copy-btn" @click="copyWechat">复制咨询话术</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 移动端底部转化栏 -->
    <div class="mobile-action-bar">
      <button class="mobile-consult-btn" @click="openWechatConsult('mobile_bar')">
        <span>微信咨询</span>
      </button>
      <div class="mobile-price-box">
        <span class="mobile-price">¥{{ villa.basePrice }}</span>
        <span class="mobile-unit">起/晚 · 满员约 ¥{{ perPersonPrice }}/人</span>
      </div>
      <button class="mobile-book-btn" @click="goBooking">立即预订</button>
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
  <div class="container villa-detail" v-else>
    <el-empty description="别墅信息加载失败，请稍后重试" />
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
const detailLoading = ref(true);
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

const villaTags = computed(() =>
  (villa.value?.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean).slice(0, 4),
);
const topFacilities = computed(() =>
  (villa.value?.facilities || []).map((f: any) => f.name).filter(Boolean).slice(0, 4),
);
const primaryScene = computed(() => {
  const tags = villaTags.value;
  const scene = ['团建', '生日', '聚会', '亲子', '泳池', 'KTV'].find(t => tags.includes(t));
  return scene || '多人聚会';
});
const perPersonPrice = computed(() => {
  if (!villa.value) return 0;
  return Math.max(1, Math.ceil(Number(villa.value.basePrice || 0) / Math.max(Number(villa.value.maxGuests || 1), 1)));
});
const queryGuests = computed(() => route.query.guests ? Number(route.query.guests) : null);
const queryBudget = computed(() => route.query.per_budget ? Number(route.query.per_budget) : null);
const queryDate = computed(() => (route.query.check_in as string) || '');
const queryScene = computed(() => (route.query.scene as string) || primaryScene.value);
const detailConsultText = computed(() => {
  if (!villa.value) return '你好，我想咨询这栋别墅，麻烦帮我确认一下档期和价格。';
  const parts = [`你好，我想咨询「${villa.value.name}」`];
  if (queryDate.value) parts.push(`${queryDate.value}入住`);
  if (queryGuests.value) parts.push(`${queryGuests.value}人左右`);
  if (queryScene.value) parts.push(`适合${queryScene.value}`);
  if (queryBudget.value) parts.push(`人均预算${queryBudget.value}元内`);
  parts.push(`页面价格¥${villa.value.basePrice}起/晚`);
  return parts.join('，') + '，麻烦帮我确认是否合适。';
});

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
  } catch (e) {
    console.error(e);
  } finally {
    detailLoading.value = false;
  }
});

function goBooking() {
  trackEvent('booking_click', {
    targetId: Number(route.params.id),
    targetType: 'villa',
    metadata: { page: 'villa_detail' },
  });
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录');
    router.push(`/login?redirect=/booking/${route.params.id}`);
    return;
  }
  router.push(`/booking/${route.params.id}`);
}

function openWechatConsult(source: string) {
  showWechat.value = true;
  trackEvent('wechat_click', {
    targetId: Number(route.params.id),
    targetType: 'villa',
    metadata: { page: 'villa_detail', source },
  });
}

function copyWechat() {
  const wechat = `${detailConsultText.value} 微信号：villa_service`;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(wechat).catch(() => {});
  } else {
    const ta = document.createElement('textarea');
    ta.value = wechat;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  trackEvent('wechat_copy', {
    targetId: Number(route.params.id),
    targetType: 'villa',
    metadata: { page: 'villa_detail', text: detailConsultText.value },
  });
  ElMessage.success('咨询话术已复制');
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
.main-gallery-image,
.main-gallery-placeholder {
  width: 100%;
  height: 500px;
  border-radius: 12px;
  user-select: none;
}

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
.decision-card {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  margin-bottom: 24px;
  padding: 26px;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 4px 22px rgba(15,23,42,0.06);
}
.decision-kicker {
  display: inline-flex;
  padding: 5px 12px;
  border-radius: 16px;
  background: #fff3ed;
  color: #ff6b35;
  font-size: 12px;
  font-weight: 800;
}
.decision-main h1 {
  margin-top: 12px;
  color: #1e293b;
  font-size: 30px;
  line-height: 1.25;
  font-weight: 900;
}
.decision-address {
  margin-top: 10px;
  color: #64748b;
  font-size: 14px;
}
.decision-tags,
.decision-facilities {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
.decision-tags span,
.decision-facilities span {
  padding: 5px 10px;
  border-radius: 14px;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-size: 12px;
  font-weight: 700;
}
.decision-side {
  padding-left: 24px;
  border-left: 1px solid #f1f5f9;
}
.decision-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.decision-price-main {
  color: #ff6b35;
  font-size: 34px;
  font-weight: 900;
}
.decision-price-unit {
  color: #94a3b8;
  font-size: 13px;
}
.decision-per {
  margin-top: 2px;
  color: #16a34a;
  font-size: 14px;
  font-weight: 800;
}
.decision-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 14px;
}
.decision-metrics div {
  padding: 10px 8px;
  border-radius: 10px;
  background: #f8fafc;
  text-align: center;
}
.decision-metrics b {
  display: block;
  color: #1e293b;
  font-size: 18px;
}
.decision-metrics span {
  display: block;
  margin-top: 2px;
  color: #94a3b8;
  font-size: 11px;
}
.decision-actions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}
.decision-consult,
.decision-book {
  flex: 1;
  height: 44px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}
.decision-consult {
  border: 1px solid #bbf7d0;
  color: #16a34a;
  background: #f0fdf4;
}
.decision-book {
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #ff6b35, #ff4500);
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
.wechat-consult-text {
  margin: 14px 0;
  padding: 12px;
  border-radius: 10px;
  background: #f8fafc;
  color: #334155;
  font-size: 13px;
  line-height: 1.7;
  text-align: left;
}
.wechat-popup-id { font-size: 16px !important; color: #1e293b !important; font-weight: 600; margin-top: 12px !important; }
.wechat-copy-btn {
  margin-top: 16px;
  border: none;
  border-radius: 22px;
  padding: 10px 28px;
  color: #fff;
  background: linear-gradient(135deg, #ff6b35, #ff4500);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.mobile-action-bar { display: none; }
.mobile-consult-btn,
.mobile-book-btn {
  border: none;
  border-radius: 24px;
  height: 44px;
  padding: 0 18px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.mobile-consult-btn {
  color: #16a34a;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}
.mobile-book-btn {
  color: #fff;
  background: linear-gradient(135deg, #ff6b35, #ff4500);
  min-width: 112px;
}
.mobile-price-box {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.mobile-price { color: #ff6b35; font-size: 22px; font-weight: 900; line-height: 1; }
.mobile-unit { color: #94a3b8; font-size: 11px; margin-top: 3px; }

/* 骨架屏 */
.villa-detail-loading {
  pointer-events: none;
}
.detail-loading-gallery {
  width: 100%;
  height: 500px;
  border-radius: 12px;
  margin-bottom: 30px;
}
.loading-card {
  cursor: default;
}
.skeleton-block,
.skeleton-line,
.skeleton-button {
  position: relative;
  overflow: hidden;
  background: #eef2f7;
}
.skeleton-block::after,
.skeleton-line::after,
.skeleton-button::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.68), transparent);
  animation: skeleton-shimmer 1.3s infinite;
}
.skeleton-line {
  height: 12px;
  border-radius: 999px;
}
.skeleton-line.title {
  width: 62%;
  height: 28px;
  margin-bottom: 16px;
}
.skeleton-line.card-title {
  width: 140px;
  height: 18px;
  margin-bottom: 18px;
}
.skeleton-line.full {
  width: 100%;
  margin-bottom: 12px;
}
.skeleton-line.medium {
  width: 76%;
  margin-bottom: 12px;
}
.skeleton-line.short {
  width: 42%;
}
.skeleton-line.price-loader {
  width: 130px;
  height: 34px;
  margin-bottom: 18px;
}
.skeleton-button {
  height: 48px;
  border-radius: 24px;
  margin-top: 20px;
}
.img-skeleton {
  position: absolute; inset: 0; z-index: 1;
  border-radius: 12px; background: #e2e8f0;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
@keyframes skeleton-shimmer {
  100% { transform: translateX(100%); }
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

@media (max-width: 768px) {
  .villa-detail {
    padding: 0 0 calc(92px + env(safe-area-inset-bottom));
  }
  .gallery {
    margin: 0 -12px 16px;
  }
  .main-image {
    margin-bottom: 8px;
  }
  .main-gallery-image,
  .main-gallery-placeholder {
    height: 260px;
    border-radius: 0;
  }
  .detail-loading-gallery {
    height: 260px;
    border-radius: 0;
    margin-bottom: 16px;
  }
  .villa-detail-loading .side-col {
    display: none;
  }
  .gallery-counter {
    bottom: 12px;
    right: 12px;
  }
  .gallery-arrow {
    opacity: 1;
    width: 36px;
    height: 36px;
    font-size: 22px;
  }
  .thumbnails {
    overflow-x: auto;
    padding: 0 12px 4px;
  }
  .thumb {
    width: 76px;
    height: 56px;
    flex-shrink: 0;
  }
  .decision-card {
    display: block;
    margin: 0 0 12px;
    padding: 18px;
    border-radius: 10px;
  }
  .decision-main h1 {
    font-size: 22px;
  }
  .decision-side {
    padding-left: 0;
    margin-top: 16px;
    border-left: none;
    border-top: 1px solid #f1f5f9;
    padding-top: 14px;
  }
  .decision-tags,
  .decision-facilities {
    flex-wrap: nowrap;
    overflow-x: auto;
  }
  .decision-tags span,
  .decision-facilities span {
    flex-shrink: 0;
  }
  .decision-price-main {
    font-size: 28px;
  }
  .decision-actions {
    display: none;
  }
  .detail-body {
    display: block;
  }
  .side-col {
    display: none;
  }
  .card {
    padding: 18px;
    border-radius: 10px;
    margin-bottom: 12px;
  }
  .title-row {
    display: block;
  }
  .title-row h1 {
    font-size: 22px;
    line-height: 1.3;
  }
  .rating-badge {
    display: inline-flex;
    flex-direction: row;
    gap: 6px;
    align-items: center;
    margin-top: 12px;
    padding: 6px 12px;
  }
  .rating-score {
    font-size: 18px;
  }
  .merchant-row,
  .villa-meta {
    flex-wrap: wrap;
  }
  .facility-grid {
    gap: 8px;
  }
  .facility-chip {
    padding: 7px 12px;
  }
  .description {
    font-size: 14px;
    line-height: 1.7;
  }
  .image-gallery {
    gap: 12px;
  }
  .review {
    gap: 10px;
    padding: 16px 0;
  }
  .avatar {
    width: 38px;
    height: 38px;
  }
  .review-header {
    flex-wrap: wrap;
    gap: 6px;
  }
  .similar-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .share-card-wrap,
  .wechat-popup {
    width: calc(100% - 32px);
    padding: 24px 20px;
  }
  .mobile-action-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 120;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    padding-bottom: max(10px, env(safe-area-inset-bottom));
    background: rgba(255,255,255,0.96);
    box-shadow: 0 -4px 18px rgba(15,23,42,0.12);
    backdrop-filter: blur(12px);
  }
}
</style>
