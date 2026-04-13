<template>
  <div class="home-page">
    <!-- Hero -->
    <div class="hero" :style="heroStyle">
      <div class="hero-overlay" />
      <div class="container hero-content">
        <h1>{{ siteConfig.hero_title || '找到你的完美别墅趴场地' }}</h1>
        <p>{{ siteConfig.hero_subtitle || '团建 · 生日 · 聚会 · 亲子 · 一站式解决' }}</p>
        <div class="search-box">
          <el-input v-model="keyword" placeholder="搜索别墅名、地点..." size="large" class="search-input" @keyup.enter="goSearch">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-button type="primary" size="large" @click="goSearch">搜索</el-button>
        </div>
        <div class="scene-tags">
          <span v-for="(t, i) in scenes" :key="t" :class="'tag-' + (Number(i) % 6)" @click="goSearch(t)">{{ t }}</span>
        </div>
      </div>
    </div>

    <!-- 精选别墅（上提到第一位置） -->
    <div class="section-wrap">
      <div class="container section">
        <div class="section-header">
          <h2>精选别墅</h2>
          <router-link to="/search" class="more-link">查看全部 →</router-link>
        </div>
        <div class="villa-grid" v-if="villas.length">
          <div class="villa-card" v-for="v in villas" :key="v.id" @click="goDetail(v.id)">
            <div class="villa-img-wrap">
              <img :src="resolveImg(v.coverImage) || '/vite.svg'" loading="lazy" @error="onImgError" />
              <span class="villa-merchant" v-if="v.merchantName">{{ v.merchantName }}</span>
            </div>
            <div class="villa-body">
              <div class="villa-name">{{ v.name }}</div>
              <div class="villa-address">{{ v.address }}</div>
              <div class="villa-tags">
                <span v-for="t in (v.tags || '').split(',').filter(Boolean)" :key="t">{{ t }}</span>
              </div>
              <div class="villa-footer">
                <div class="villa-price"><b>¥{{ v.basePrice }}</b><small>起/晚</small></div>
                <div class="villa-footer-right">
                  <div class="villa-rating" v-if="v.ratingAvg">
                    <span class="rating-star">★</span>
                    <span class="rating-val">{{ v.ratingAvg }}</span>
                    <span class="rating-cnt">({{ v.ratingCount }})</span>
                  </div>
                  <div class="villa-guests">可住 {{ v.maxGuests }} 人</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <el-skeleton v-else :rows="5" animated />
      </div>
    </div>

    <!-- 限时活动 + 拼团合并展示 -->
    <div class="section-wrap bg-warm" v-if="banners.length || groupBuys.length">
      <div class="container section section-compact">
        <div class="section-header"><h2>优惠活动</h2></div>
        <div class="promo-scroll">
          <div class="promo-card" v-for="b in banners" :key="'b-' + b.id" @click="goBanner(b)">
            <img :src="resolveImg(b.coverImage) || '/vite.svg'" loading="lazy" @error="onImgError" />
            <div class="promo-info">
              <div class="promo-name">{{ b.name }}</div>
              <div class="promo-tag" v-if="b.discount">立减 ¥{{ b.discount }}</div>
            </div>
          </div>
          <div class="promo-card" v-for="g in groupBuys" :key="'g-' + g.id">
            <img :src="resolveImg(g.coverImage) || '/vite.svg'" loading="lazy" @error="onImgError" />
            <div class="promo-info">
              <div class="promo-name">{{ g.villaName }}</div>
              <div class="promo-tag">拼团立减 ¥{{ g.discount }}</div>
              <div class="promo-sub">还差 {{ g.targetCount - g.currentCount }} 人</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 轰趴方案 -->
    <div class="section-wrap bg-cool" v-if="activityPlans.length">
      <div class="container section section-compact">
        <div class="section-header">
          <h2>轰趴方案</h2>
          <span class="collapse-toggle" @click="showPlans = !showPlans">{{ showPlans ? '收起' : '展开' }}</span>
        </div>
        <div class="plan-scroll" v-show="showPlans">
          <div class="plan-card-h" v-for="p in activityPlans" :key="p.id">
            <img :src="resolveImg(p.coverImage) || '/vite.svg'" loading="lazy" @error="onImgError" />
            <div class="plan-body-h">
              <div class="plan-name">{{ p.name }}</div>
              <div class="plan-meta">{{ p.scene }} · {{ p.minGuests }}-{{ p.maxGuests }}人</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 氛围包 + 周边服务（横向滚动，紧凑展示） -->
    <div class="section-wrap" v-if="themePacks.length || localServices.length">
      <div class="container section section-compact">
        <div class="section-header">
          <h2>增值服务</h2>
          <span class="collapse-toggle" @click="showServices = !showServices">{{ showServices ? '收起' : '展开' }}</span>
        </div>
        <div v-show="showServices">
          <!-- 氛围包横向滚动 -->
          <div class="addon-scroll" v-if="themePacks.length">
            <div class="addon-label">氛围包</div>
            <div class="addon-list">
              <div class="addon-card" v-for="t in themePacks" :key="t.id">
                <img :src="resolveImg(t.coverImage) || '/vite.svg'" loading="lazy" @error="onImgError" />
                <div class="addon-body">
                  <div class="addon-name">{{ t.name }}</div>
                  <div class="addon-price"><b>¥{{ t.price }}</b><del v-if="t.originalPrice">¥{{ t.originalPrice }}</del></div>
                </div>
              </div>
            </div>
          </div>
          <!-- 周边服务横向滚动 -->
          <div class="addon-scroll" v-if="localServices.length" style="margin-top: 16px;">
            <div class="addon-label">周边服务</div>
            <div class="addon-list">
              <div class="addon-card" v-for="s in localServices" :key="s.id">
                <img :src="resolveImg(s.coverImage) || '/vite.svg'" loading="lazy" @error="onImgError" />
                <div class="addon-body">
                  <div class="addon-name">{{ s.name }}</div>
                  <div class="addon-price"><b>¥{{ s.price }}</b><small>/{{ s.unit }}</small></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 页脚 -->
    <footer class="site-footer">
      <div class="container">
        <div>{{ siteConfig.footer_text || '别墅轰趴 — 让每一次聚会都值得回忆' }}</div>
        <div class="footer-links">
          <router-link to="/help">帮助中心</router-link>
        </div>
      </div>
    </footer>

    <!-- 返回顶部 -->
    <el-backtop :visibility-height="300" :right="40" :bottom="40" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search } from '@element-plus/icons-vue';
import { getHome, getSiteConfig } from '../../api/villa';
import { thumbUrl } from '../../utils/request';

const router = useRouter();
const keyword = ref('');
const banners = ref<any[]>([]);
const villas = ref<any[]>([]);
const groupBuys = ref<any[]>([]);
const themePacks = ref<any[]>([]);
const activityPlans = ref<any[]>([]);
const localServices = ref<any[]>([]);
const showPlans = ref(true);
const showServices = ref(false);
const resolveImg = thumbUrl;

const siteConfig = reactive<Record<string, string>>({
  hero_title: '', hero_subtitle: '', hero_bg: '', hero_image: '',
  banners: '[]', scene_tags: '[]', footer_text: '',
});

const scenes = computed(() => {
  try { return JSON.parse(siteConfig.scene_tags || '[]'); }
  catch { return ['团建聚会', '生日派对', '朋友聚会', '亲子活动', '毕业趴', '闺蜜趴']; }
});
const customBanners = computed(() => {
  try { return JSON.parse(siteConfig.banners || '[]').filter((b: any) => b.image); }
  catch { return []; }
});
const heroStyle = computed(() => {
  if (siteConfig.hero_image) {
    return { backgroundImage: `url(${siteConfig.hero_image})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  return { background: siteConfig.hero_bg || 'linear-gradient(135deg, #ff6b35, #ff8f65)' };
});

onMounted(async () => {
  const [cfg, home] = await Promise.allSettled([getSiteConfig(), getHome()]);
  if (cfg.status === 'fulfilled') Object.assign(siteConfig, cfg.value as any);
  if (home.status === 'fulfilled') {
    const d = home.value as any;
    banners.value = d.banners || [];
    villas.value = d.villas || [];
    groupBuys.value = d.groupBuys || [];
    themePacks.value = d.themePacks || [];
    activityPlans.value = d.activityPlans || [];
    localServices.value = d.localServices || [];
  }
});

function goSearch(tag?: any) {
  const p: any = {};
  if (typeof tag === 'string') p.tag = tag;
  else if (keyword.value) p.keyword = keyword.value;
  router.push({ path: '/search', query: p });
}
function goDetail(id: number) { router.push(`/villa/${id}`); }
function goBanner(b: any) { if (b.villaId) goDetail(b.villaId); }

function onImgError(e: Event) {
  const el = e.target as HTMLImageElement;
  el.style.display = 'none';
  const placeholder = document.createElement('div');
  placeholder.className = 'img-error-placeholder';
  placeholder.textContent = '图片加载失败';
  el.parentElement?.insertBefore(placeholder, el);
}
</script>

<style scoped>
.home-page { background: #f8f6f3; min-height: 100vh; }

/* ===== Hero ===== */
.hero { position: relative; padding: 110px 0 80px; color: #fff; overflow: hidden; }
.hero-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 60%, rgba(248,246,243,1) 100%);
  z-index: 1;
}
.hero-content { position: relative; z-index: 2; }
.hero-content h1 {
  font-size: 52px; font-weight: 900; text-align: center;
  margin-bottom: 18px;
  text-shadow: 0 4px 20px rgba(0,0,0,0.3);
  letter-spacing: 6px;
  font-family: 'PingFang SC', 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
}
.hero-content p {
  font-size: 22px; text-align: center; opacity: 0.92;
  margin-bottom: 44px; letter-spacing: 6px;
  font-weight: 300;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.search-box { display: flex; gap: 0; max-width: 700px; margin: 0 auto; background: #fff; border-radius: 28px; padding: 4px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
.search-input { border: none; flex: 1; }
.search-input :deep(.el-input__wrapper) { box-shadow: none !important; border-radius: 24px; padding-left: 20px; }
.search-box .el-button { border-radius: 24px; padding: 0 32px; font-weight: 600; background: linear-gradient(135deg, #ff6b35, #ff4500); border: none; }
.scene-tags { display: flex; justify-content: center; gap: 12px; margin-top: 32px; flex-wrap: wrap; }
.scene-tags span {
  padding: 10px 26px; border-radius: 24px; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.3s;
  border: none; backdrop-filter: blur(12px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.scene-tags span:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
.scene-tags .tag-0 { background: rgba(255,107,53,0.85); color: #fff; }
.scene-tags .tag-0:hover { background: #ff6b35; }
.scene-tags .tag-1 { background: rgba(233,30,99,0.8); color: #fff; }
.scene-tags .tag-1:hover { background: #e91e63; }
.scene-tags .tag-2 { background: rgba(76,175,80,0.8); color: #fff; }
.scene-tags .tag-2:hover { background: #4caf50; }
.scene-tags .tag-3 { background: rgba(33,150,243,0.8); color: #fff; }
.scene-tags .tag-3:hover { background: #2196f3; }
.scene-tags .tag-4 { background: rgba(156,39,176,0.8); color: #fff; }
.scene-tags .tag-4:hover { background: #9c27b0; }
.scene-tags .tag-5 { background: rgba(255,152,0,0.85); color: #fff; }
.scene-tags .tag-5:hover { background: #ff9800; }

/* ===== Section 通用 ===== */
.section-wrap { padding: 0; }
.section-wrap.bg-warm { background: linear-gradient(180deg, #f8f6f3, #fff4ed 30%, #fff4ed 70%, #f8f6f3); }
.section-wrap.bg-cool { background: linear-gradient(180deg, #f8f6f3, #eef4ff 30%, #eef4ff 70%, #f8f6f3); }
.section { padding: 48px 0; }
.section-compact { padding: 32px 0; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
.section-header h2 {
  font-size: 26px; color: #1e293b; font-weight: 800;
  font-family: 'PingFang SC', 'Noto Sans SC', sans-serif;
}
.more-link {
  color: #ff6b35; font-size: 14px; font-weight: 500;
  padding: 6px 16px; border: 1px solid #ff6b35; border-radius: 20px;
  transition: all 0.2s;
}
.more-link:hover { background: #ff6b35; color: #fff; }
.collapse-toggle {
  font-size: 13px; color: #94a3b8; cursor: pointer; padding: 4px 12px;
  border: 1px solid #e2e8f0; border-radius: 12px; transition: all 0.2s;
}
.collapse-toggle:hover { color: #ff6b35; border-color: #ff6b35; }

/* ===== 精选别墅 ===== */
.villa-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.villa-card {
  background: #fff; border-radius: 14px; overflow: hidden;
  cursor: pointer; transition: all 0.3s;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.villa-card:hover { transform: translateY(-6px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
.villa-img-wrap { position: relative; height: 220px; }
.villa-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
.villa-merchant {
  position: absolute; top: 12px; left: 12px;
  background: rgba(255,107,53,0.9); color: #fff;
  padding: 3px 10px; border-radius: 4px; font-size: 11px;
}
.villa-body { padding: 18px; }
.villa-name { font-size: 17px; font-weight: 700; color: #1e293b; }
.villa-address { font-size: 13px; color: #94a3b8; margin-top: 6px; }
.villa-tags { margin-top: 10px; display: flex; gap: 6px; flex-wrap: wrap; }
.villa-tags span { background: #fff3ed; color: #ff6b35; padding: 2px 10px; border-radius: 12px; font-size: 11px; }
.villa-footer {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 14px; padding-top: 14px; border-top: 1px solid #f1f5f9;
}
.villa-price b { font-size: 22px; color: #ff6b35; }
.villa-price small { font-size: 12px; color: #94a3b8; margin-left: 2px; }
.villa-footer-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.villa-rating { display: flex; align-items: center; gap: 2px; }
.rating-star { color: #f59e0b; font-size: 14px; }
.rating-val { font-size: 14px; font-weight: 700; color: #f59e0b; }
.rating-cnt { font-size: 12px; color: #94a3b8; }
.villa-guests { font-size: 13px; color: #64748b; }

/* ===== 优惠活动（横向滚动，合并限时活动+拼团） ===== */
.promo-scroll {
  display: flex; gap: 16px; overflow-x: auto;
  padding-bottom: 8px; scroll-snap-type: x mandatory;
}
.promo-scroll::-webkit-scrollbar { height: 4px; }
.promo-scroll::-webkit-scrollbar-thumb { background: #e0d6cc; border-radius: 2px; }
.promo-card {
  flex: 0 0 220px; scroll-snap-align: start;
  border-radius: 12px; overflow: hidden; background: #fff;
  cursor: pointer; transition: transform 0.25s;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.promo-card:hover { transform: translateY(-3px); }
.promo-card img { width: 100%; height: 130px; object-fit: cover; }
.promo-info { padding: 12px; }
.promo-name { font-size: 14px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.promo-tag { color: #ff6b35; font-size: 13px; font-weight: 700; margin-top: 4px; }
.promo-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }

/* ===== 轰趴方案（横向滚动） ===== */
.plan-scroll {
  display: flex; gap: 16px; overflow-x: auto;
  padding-bottom: 8px; scroll-snap-type: x mandatory;
}
.plan-scroll::-webkit-scrollbar { height: 4px; }
.plan-scroll::-webkit-scrollbar-thumb { background: #c8d6e5; border-radius: 2px; }
.plan-card-h {
  flex: 0 0 240px; scroll-snap-align: start;
  border-radius: 12px; overflow: hidden; background: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05); transition: transform 0.25s;
}
.plan-card-h:hover { transform: translateY(-3px); }
.plan-card-h img { width: 100%; height: 120px; object-fit: cover; }
.plan-body-h { padding: 12px; }
.plan-name { font-size: 14px; font-weight: 700; color: #1e293b; }
.plan-meta { font-size: 12px; color: #64748b; margin-top: 4px; }

/* ===== 增值服务（氛围包 + 周边服务横向滚动） ===== */
.addon-scroll { }
.addon-label { font-size: 13px; color: #94a3b8; font-weight: 500; margin-bottom: 10px; }
.addon-list {
  display: flex; gap: 14px; overflow-x: auto;
  padding-bottom: 6px; scroll-snap-type: x mandatory;
}
.addon-list::-webkit-scrollbar { height: 4px; }
.addon-list::-webkit-scrollbar-thumb { background: #e0d6cc; border-radius: 2px; }
.addon-card {
  flex: 0 0 170px; scroll-snap-align: start;
  border-radius: 10px; overflow: hidden; background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.2s;
}
.addon-card:hover { transform: translateY(-2px); }
.addon-card img { width: 100%; height: 100px; object-fit: cover; }
.addon-body { padding: 10px; }
.addon-name { font-size: 13px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.addon-price { margin-top: 4px; }
.addon-price b { font-size: 16px; color: #ff6b35; }
.addon-price del { font-size: 12px; color: #cbd5e1; margin-left: 4px; }
.addon-price small { font-size: 11px; color: #94a3b8; }

/* ===== 页脚 ===== */
.site-footer {
  text-align: center; padding: 40px 0; color: #94a3b8; font-size: 13px;
  background: #1e293b; letter-spacing: 1px;
}
.footer-links { margin-top: 12px; }
.footer-links a { color: #93c5fd; transition: color 0.2s; }
.footer-links a:hover { color: #fff; }

/* ===== 移动端适配 ===== */
@media (max-width: 768px) {
  .hero { padding: 60px 0 50px; }
  .hero-content h1 { font-size: 26px; letter-spacing: 2px; }
  .hero-content p { font-size: 14px; letter-spacing: 2px; margin-bottom: 24px; }
  .search-box { flex-direction: column; gap: 8px; border-radius: 12px; padding: 8px; }
  .search-box .el-button { border-radius: 12px; width: 100%; }
  .scene-tags { gap: 8px; }
  .scene-tags span { padding: 6px 14px; font-size: 12px; }

  .section { padding: 24px 0; }
  .section-compact { padding: 18px 0; }
  .section-header h2 { font-size: 18px; }

  .villa-grid { grid-template-columns: 1fr; gap: 16px; }
  .villa-img-wrap { height: 180px; }

  .promo-card { flex: 0 0 180px; }
  .promo-card img { height: 100px; }

  .plan-card-h { flex: 0 0 200px; }
  .plan-card-h img { height: 100px; }

  .addon-card { flex: 0 0 140px; }
  .addon-card img { height: 80px; }
}

/* 图片加载失败占位 */
.img-error-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: #f1f5f9; color: #94a3b8; font-size: 13px;
}
</style>
