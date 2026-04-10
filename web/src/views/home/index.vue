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

    <!-- 轮播图 -->
    <div class="section-wrap carousel-wrap" v-if="customBanners.length">
      <div class="container">
        <el-carousel height="380px" :interval="5000" arrow="hover">
          <el-carousel-item v-for="(b, i) in customBanners" :key="i">
            <div class="carousel-item" @click="handleBannerClick(b)">
              <img :src="b.image" />
              <div class="carousel-caption" v-if="b.title">{{ b.title }}</div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>
    </div>

    <!-- 精选别墅 -->
    <div class="section-wrap">
      <div class="container section">
        <div class="section-header">
          <h2>🏡 精选别墅</h2>
          <router-link to="/search" class="more-link">查看全部 →</router-link>
        </div>
        <div class="villa-grid" v-if="villas.length">
          <div class="villa-card" v-for="v in villas" :key="v.id" @click="goDetail(v.id)">
            <div class="villa-img-wrap">
              <img :src="resolveImg(v.coverImage) || '/vite.svg'" />
              <span class="villa-merchant" v-if="v.merchantName">{{ v.merchantName }}</span>
            </div>
            <div class="villa-body">
              <div class="villa-name">{{ v.name }}</div>
              <div class="villa-address">📍 {{ v.address }}</div>
              <div class="villa-tags">
                <span v-for="t in (v.tags || '').split(',').filter(Boolean)" :key="t">{{ t }}</span>
              </div>
              <div class="villa-footer">
                <div class="villa-price"><b>¥{{ v.basePrice }}</b><small>起/晚</small></div>
                <div class="villa-guests">可住 {{ v.maxGuests }} 人</div>
              </div>
            </div>
          </div>
        </div>
        <el-skeleton v-else :rows="5" animated />
      </div>
    </div>

    <!-- 限时活动 -->
    <div class="section-wrap bg-warm" v-if="banners.length">
      <div class="container section">
        <div class="section-header"><h2>🎉 限时活动</h2></div>
        <div class="banner-grid">
          <div class="banner-card" v-for="b in banners" :key="b.id" @click="goBanner(b)">
            <img :src="resolveImg(b.coverImage) || '/vite.svg'" />
            <div class="banner-info">
              <div class="banner-name">{{ b.name }}</div>
              <div class="banner-tag" v-if="b.discount">立减 ¥{{ b.discount }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 活动方案 -->
    <div class="section-wrap bg-cool" v-if="activityPlans.length">
      <div class="container section">
        <div class="section-header"><h2>📋 轰趴方案</h2></div>
        <div class="plan-grid">
          <div class="plan-card" v-for="p in activityPlans" :key="p.id">
            <div class="plan-img"><img :src="resolveImg(p.coverImage) || '/vite.svg'" /></div>
            <div class="plan-body">
              <div class="plan-name">{{ p.name }}</div>
              <div class="plan-meta">
                <span>🎭 {{ p.scene }}</span>
                <span>👥 {{ p.minGuests }}-{{ p.maxGuests }}人</span>
                <span v-if="p.duration">⏱ {{ p.duration }}</span>
              </div>
              <div class="plan-desc">{{ p.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 氛围包 -->
    <div class="section-wrap" v-if="themePacks.length">
      <div class="container section">
        <div class="section-header"><h2>🎨 氛围包</h2></div>
        <div class="theme-grid">
          <div class="theme-card" v-for="t in themePacks" :key="t.id">
            <div class="theme-img"><img :src="resolveImg(t.coverImage) || '/vite.svg'" /></div>
            <div class="theme-body">
              <div class="theme-name">{{ t.name }}</div>
              <div class="theme-tag">{{ t.theme }}</div>
              <div class="theme-price">
                <b>¥{{ t.price }}</b>
                <del v-if="t.originalPrice">¥{{ t.originalPrice }}</del>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 周边服务 -->
    <div class="section-wrap bg-warm" v-if="localServices.length">
      <div class="container section">
        <div class="section-header"><h2>🍳 周边服务</h2></div>
        <div class="service-grid">
          <div class="service-card" v-for="s in localServices" :key="s.id">
            <div class="service-img"><img :src="resolveImg(s.coverImage) || '/vite.svg'" /></div>
            <div class="service-body">
              <div class="service-name">{{ s.name }}</div>
              <div class="service-category">{{ s.category }} · {{ s.provider }}</div>
              <div class="service-price">¥{{ s.price }}<small>/{{ s.unit }}</small></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 正在拼团 -->
    <div class="section-wrap bg-cool" v-if="groupBuys.length">
      <div class="container section">
        <div class="section-header"><h2>🔥 正在拼团</h2></div>
        <div class="group-grid">
          <div class="group-card" v-for="g in groupBuys" :key="g.id">
            <img :src="resolveImg(g.coverImage) || '/vite.svg'" />
            <div class="group-body">
              <div class="group-name">{{ g.villaName }}</div>
              <div class="group-discount">立减 ¥{{ g.discount }}</div>
              <div class="group-progress">还差 {{ g.targetCount - g.currentCount }} 人成团</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 页脚 -->
    <footer class="site-footer">
      <div class="container">{{ siteConfig.footer_text || '别墅轰趴 — 让每一次聚会都值得回忆' }}</div>
    </footer>
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
function handleBannerClick(b: any) { if (b.link) window.open(b.link, '_blank'); }
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
/* 6 种颜色的场景标签 */
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
.carousel-wrap { padding-top: 20px; margin-top: -40px; position: relative; z-index: 3; }
.section { padding: 48px 0; }
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

/* ===== 轮播图 ===== */
.carousel-item { position: relative; height: 100%; border-radius: 16px; overflow: hidden; cursor: pointer; box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
.carousel-item img { width: 100%; height: 100%; object-fit: cover; }
.carousel-caption {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 24px 28px; color: #fff; font-size: 20px; font-weight: 600;
  background: linear-gradient(transparent, rgba(0,0,0,0.6)); letter-spacing: 1px;
}

/* ===== 限时活动 ===== */
.banner-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.banner-card {
  position: relative; border-radius: 12px; overflow: hidden;
  cursor: pointer; transition: transform 0.25s; height: 180px;
}
.banner-card:hover { transform: translateY(-4px); }
.banner-card img { width: 100%; height: 100%; object-fit: cover; }
.banner-info {
  position: absolute; bottom: 0; left: 0; right: 0; padding: 16px;
  color: #fff; background: linear-gradient(transparent, rgba(0,0,0,0.7));
}
.banner-name { font-size: 16px; font-weight: 600; }
.banner-tag { color: #ffd700; font-size: 13px; margin-top: 4px; }

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
.villa-guests { font-size: 13px; color: #64748b; }

/* ===== 活动方案 ===== */
.plan-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.plan-card {
  background: #fff; border-radius: 14px; overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05); transition: all 0.3s;
}
.plan-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.plan-img { height: 180px; }
.plan-img img { width: 100%; height: 100%; object-fit: cover; }
.plan-body { padding: 16px; }
.plan-name { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
.plan-meta { display: flex; gap: 12px; font-size: 12px; color: #64748b; margin-bottom: 8px; }
.plan-desc {
  font-size: 13px; color: #94a3b8; line-height: 1.6;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* ===== 氛围包 ===== */
.theme-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.theme-card {
  background: #fff; border-radius: 14px; overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05); transition: all 0.3s;
}
.theme-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.theme-img { height: 180px; }
.theme-img img { width: 100%; height: 100%; object-fit: cover; }
.theme-body { padding: 16px; }
.theme-name { font-size: 16px; font-weight: 700; color: #1e293b; }
.theme-tag {
  display: inline-block; margin-top: 6px;
  background: #f0f4ff; color: #3b82f6; padding: 2px 10px; border-radius: 10px; font-size: 11px;
}
.theme-price { margin-top: 10px; }
.theme-price b { font-size: 20px; color: #ff6b35; }
.theme-price del { font-size: 13px; color: #cbd5e1; margin-left: 6px; }

/* ===== 周边服务 ===== */
.service-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.service-card {
  background: #fff; border-radius: 12px; overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05); transition: all 0.3s;
}
.service-card:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }
.service-img { height: 140px; }
.service-img img { width: 100%; height: 100%; object-fit: cover; }
.service-body { padding: 14px; }
.service-name { font-size: 15px; font-weight: 600; color: #1e293b; }
.service-category { font-size: 12px; color: #94a3b8; margin-top: 4px; }
.service-price { margin-top: 8px; font-size: 18px; color: #ff6b35; font-weight: 700; }
.service-price small { font-size: 12px; color: #94a3b8; font-weight: 400; }

/* ===== 拼团 ===== */
.group-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.group-card {
  background: #fff; border-radius: 12px; overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.group-card img { width: 100%; height: 150px; object-fit: cover; }
.group-body { padding: 14px; }
.group-name { font-size: 14px; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.group-discount { color: #ff6b35; font-size: 16px; font-weight: 700; margin-top: 4px; }
.group-progress { font-size: 12px; color: #94a3b8; margin-top: 4px; }

/* ===== 页脚 ===== */
.site-footer {
  text-align: center; padding: 40px 0; color: #94a3b8; font-size: 13px;
  background: #1e293b; letter-spacing: 1px;
}

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
  .section-header h2 { font-size: 18px; }

  .carousel-wrap { margin-top: -20px; }

  .villa-grid { grid-template-columns: 1fr; gap: 16px; }
  .villa-img-wrap { height: 180px; }

  .banner-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .banner-card { height: 140px; }
  .banner-name { font-size: 13px; }

  .plan-grid { grid-template-columns: 1fr; gap: 14px; }
  .theme-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .service-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .group-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }

  .plan-img, .theme-img { height: 140px; }
  .service-img { height: 110px; }
}
</style>
