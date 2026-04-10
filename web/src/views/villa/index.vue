<template>
  <div class="container villa-detail" v-if="villa">
    <!-- 图片画廊 -->
    <div class="gallery">
      <div class="main-image">
        <el-image
          :src="resolveImg(currentImage || '')"
          fit="cover"
          :preview-src-list="allImages"
          :initial-index="currentIndex"
          preview-teleported
          style="width: 100%; height: 500px; border-radius: 12px;"
        />
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
        <div class="thumb view-all" v-if="villa.images?.length > 5">
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
            <div class="rating" v-if="reviewStats.avgRating !== '0.0'">
              ⭐ {{ reviewStats.avgRating }} ({{ reviewStats.total }}条评价)
            </div>
          </div>
          <div class="merchant-row" v-if="villa.merchant">
            <el-tag size="small" type="warning">{{ villa.merchant.name }}</el-tag>
            <el-tag size="small">官方认证</el-tag>
          </div>
          <div class="villa-meta">
            {{ villa.maxGuests }}人 · {{ villa.bedrooms }}卧 · {{ villa.area }}㎡
          </div>
          <div class="villa-address">📍 {{ villa.address }}</div>
        </div>

        <!-- 设施 -->
        <div class="card">
          <h3>设施配套</h3>
          <div class="facility-grid">
            <div class="facility" v-for="f in villa.facilities" :key="f.id">
              <span>✓</span>{{ f.name }}
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
import { ref, computed, onMounted } from 'vue';
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
.main-image { margin-bottom: 12px; }
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
.card h3 { font-size: 18px; color: #333; margin-bottom: 16px; }

.title-row { display: flex; justify-content: space-between; align-items: flex-start; }
.title-row h1 { font-size: 28px; color: #333; }
.rating { font-size: 14px; color: #666; }
.merchant-row { display: flex; gap: 8px; margin: 12px 0; }
.villa-meta { font-size: 14px; color: #666; margin: 8px 0; }
.villa-address { font-size: 14px; color: #999; }

.facility-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
}
.facility {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; color: #666;
}
.facility span { color: #27ae60; font-weight: bold; }

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
