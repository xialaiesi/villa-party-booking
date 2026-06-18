<template>
  <div class="home-page">
    <!-- Hero -->
    <div class="hero" :style="heroStyle">
      <video
        v-if="siteConfig.hero_video"
        class="hero-video"
        :src="siteConfig.hero_video"
        autoplay muted loop playsinline
      />
      <div class="hero-overlay" />
      <div class="container hero-content">
        <h1>{{ siteConfig.hero_title || '找到你的完美别墅趴场地' }}</h1>
        <p>{{ siteConfig.hero_subtitle || '团建 · 生日 · 聚会 · 亲子 · 一站式解决' }}</p>
        <div class="mobile-hero-points">
          <span>{{ siteConfig.landing_city || '深圳' }}周边</span>
          <span>整栋出租</span>
          <span>管家推荐</span>
        </div>
        <div class="quick-match-panel">
          <div class="quick-match-head">
            <div>
              <div class="quick-match-title">30 秒帮我选墅</div>
              <div class="quick-match-sub">选场景、人数和预算，直接看合适房源</div>
            </div>
            <span class="quick-match-badge">管家推荐</span>
          </div>
          <div class="quick-match-row">
            <div class="quick-match-group">
              <span class="quick-match-label">场景</span>
              <div class="quick-match-options">
                <button
                  v-for="opt in quickScenes"
                  :key="opt.value"
                  :class="{ active: quickScene === opt.value }"
                  @click="quickScene = opt.value"
                >{{ opt.label }}</button>
              </div>
            </div>
            <div class="quick-match-group">
              <span class="quick-match-label">人数</span>
              <div class="quick-match-options">
                <button
                  v-for="opt in quickGuests"
                  :key="opt.value"
                  :class="{ active: quickGuest === opt.value }"
                  @click="quickGuest = opt.value"
                >{{ opt.label }}</button>
              </div>
            </div>
            <div class="quick-match-group">
              <span class="quick-match-label">人均预算</span>
              <div class="quick-match-options">
                <button
                  v-for="opt in quickBudgets"
                  :key="opt.value"
                  :class="{ active: quickBudget === opt.value }"
                  @click="quickBudget = opt.value"
                >{{ opt.label }}</button>
              </div>
            </div>
            <div class="quick-match-group quick-date-group">
              <span class="quick-match-label">日期</span>
              <input v-model="quickDate" type="date" class="quick-date-input" />
            </div>
          </div>
          <button class="quick-match-submit" @click="goQuickMatch">立即匹配别墅</button>
        </div>
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

    <!-- 数据信任条 -->
    <div class="trust-bar" v-if="homeLoading || homeStats.villaCount">
      <div class="container trust-inner" v-if="!homeLoading">
        <div class="trust-item">
          <b ref="statVilla">{{ homeStats.villaCount }}+</b>
          <span>精选别墅</span>
        </div>
        <div class="trust-item">
          <b>{{ homeStats.orderCount }}+</b>
          <span>成功活动</span>
        </div>
        <div class="trust-item">
          <b>{{ homeStats.reviewCount }}+</b>
          <span>真实好评</span>
        </div>
      </div>
      <div class="container trust-inner trust-skeleton" v-else>
        <div class="trust-item" v-for="n in 3" :key="n">
          <div class="skeleton-line stat"></div>
          <div class="skeleton-line label"></div>
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
        <div class="villa-grid" v-if="homeLoading">
          <div class="villa-card villa-card-skeleton" v-for="n in 6" :key="n">
            <div class="villa-img-wrap skeleton-block"></div>
            <div class="villa-body">
              <div class="skeleton-line title"></div>
              <div class="skeleton-line medium"></div>
              <div class="skeleton-tags"><span></span><span></span><span></span></div>
              <div class="skeleton-line footer"></div>
            </div>
          </div>
        </div>
        <div class="villa-grid" v-else-if="villas.length">
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
      </div>
    </div>

    <!-- 真实案例 -->
    <div class="section-wrap bg-warm" v-if="homeLoading || featuredCases.length">
      <div class="container section section-compact">
        <div class="section-header"><h2>看看上周的趴体</h2></div>
        <div class="cases-scroll" v-if="homeLoading">
          <div class="case-card case-card-skeleton" v-for="n in 4" :key="n">
            <div class="case-media skeleton-block"></div>
            <div class="case-body">
              <div class="skeleton-line title"></div>
              <div class="skeleton-line short"></div>
            </div>
          </div>
        </div>
        <div class="cases-scroll" v-else>
          <div class="case-card" v-for="c in featuredCases" :key="c.id" @click="goDetail(c.villaId)">
            <div class="case-media">
              <img :src="resolveImg(c.cover)" loading="lazy" @error="onImgError" />
              <div class="case-play" v-if="c.hasVideo">&#9654;</div>
            </div>
            <div class="case-body">
              <div class="case-quote">"{{ c.content }}"</div>
              <div class="case-meta">
                <span class="case-rating">{{ '★'.repeat(c.rating) }}</span>
                <span class="case-user">{{ c.nickname }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 限时活动 + 拼团合并展示 -->
    <div class="section-wrap bg-warm" v-if="homeLoading || banners.length || groupBuys.length">
      <div class="container section section-compact">
        <div class="section-header"><h2>优惠活动</h2></div>
        <div class="promo-scroll" v-if="homeLoading">
          <div class="promo-card promo-card-skeleton" v-for="n in 4" :key="n">
            <div class="promo-media skeleton-block"></div>
            <div class="promo-info">
              <div class="skeleton-line title"></div>
              <div class="skeleton-line short"></div>
            </div>
          </div>
        </div>
        <div class="promo-scroll" v-else>
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
    <div class="section-wrap bg-cool" v-if="homeLoading || activityPlans.length">
      <div class="container section section-compact">
        <div class="section-header">
          <h2>轰趴方案</h2>
          <span class="collapse-toggle" @click="showPlans = !showPlans">{{ showPlans ? '收起' : '展开' }}</span>
        </div>
        <div class="plan-scroll" v-if="homeLoading" v-show="showPlans">
          <div class="plan-card-h plan-card-skeleton" v-for="n in 4" :key="n">
            <div class="plan-media skeleton-block"></div>
            <div class="plan-body-h">
              <div class="skeleton-line title"></div>
              <div class="skeleton-line short"></div>
            </div>
          </div>
        </div>
        <div class="plan-scroll" v-else v-show="showPlans">
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
    <div class="section-wrap" v-if="homeLoading || themePacks.length || localServices.length">
      <div class="container section section-compact">
        <div class="section-header">
          <h2>增值服务</h2>
          <span class="collapse-toggle" @click="showServices = !showServices">{{ showServices ? '收起' : '展开' }}</span>
        </div>
        <div v-if="homeLoading" v-show="showServices">
          <div class="addon-scroll">
            <div class="addon-label"><div class="skeleton-line label"></div></div>
            <div class="addon-list">
              <div class="addon-card addon-card-skeleton" v-for="n in 4" :key="n">
                <div class="addon-media skeleton-block"></div>
                <div class="addon-body">
                  <div class="skeleton-line title"></div>
                  <div class="skeleton-line short"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else v-show="showServices">
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

    <!-- 微信咨询浮动按钮 -->
    <div class="wechat-fab" @click="openWechat('floating_fab')" v-if="siteConfig.landing_wechat_id || siteConfig.landing_wechat_qr">
      <div class="wechat-fab-icon">微信</div>
    </div>
    <div class="wechat-modal-overlay" v-if="showWechatModal" @click.self="showWechatModal = false">
      <div class="wechat-modal-card">
        <div class="wechat-modal-close" @click="showWechatModal = false">&times;</div>
        <h3>微信咨询</h3>
        <p>扫码或搜索微信号添加</p>
        <img v-if="siteConfig.landing_wechat_qr" :src="siteConfig.landing_wechat_qr" class="wechat-qr" />
        <p class="wechat-id">微信号：{{ siteConfig.landing_wechat_id || 'villa_service' }}</p>
        <button class="wechat-copy-btn" @click="copyWechat">复制微信号</button>
      </div>
    </div>

    <!-- H5 移动端底部转化栏 -->
    <div class="mobile-home-bar">
      <button class="mobile-home-consult" @click="openWechat('mobile_bar')">微信咨询</button>
      <button class="mobile-home-main" @click="goSearch()">立即找别墅</button>
    </div>

    <!-- 返回顶部 -->
    <el-backtop :visibility-height="300" :right="40" :bottom="40" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search } from '@element-plus/icons-vue';
import { getHome, getSiteConfig, getHomeStats, getLanding } from '../../api/villa';
import { thumbUrl } from '../../utils/request';
import { trackEvent } from '../../utils/tracker';


const router = useRouter();
const keyword = ref('');
const quickScene = ref('团建');
const quickGuest = ref(15);
const quickBudget = ref(300);
const quickDate = ref('');
const banners = ref<any[]>([]);
const villas = ref<any[]>([]);
const groupBuys = ref<any[]>([]);
const themePacks = ref<any[]>([]);
const activityPlans = ref<any[]>([]);
const localServices = ref<any[]>([]);
const homeLoading = ref(true);
const showPlans = ref(true);
const showServices = ref(false);
const showWechatModal = ref(false);
const resolveImg = thumbUrl;
const homeStats = reactive({ villaCount: 0, orderCount: 0, reviewCount: 0 });
const featuredCases = ref<any[]>([]);

const siteConfig = reactive<Record<string, string>>({
  hero_title: '', hero_subtitle: '', hero_bg: '', hero_image: '', hero_video: '',
  banners: '[]', scene_tags: '[]', footer_text: '',
  landing_wechat_qr: '', landing_wechat_id: '', landing_city: '',
});

// 显示名 → 搜索标签的映射
const sceneTagMap: Record<string, string> = {
  '团建聚会': '团建', '生日派对': '生日', '朋友聚会': '聚会',
  '亲子活动': '亲子', '毕业趴': '毕业趴', '闺蜜趴': '闺蜜趴',
};
const quickScenes = [
  { label: '团建', value: '团建' },
  { label: '生日', value: '生日' },
  { label: '聚会', value: '聚会' },
  { label: '亲子', value: '亲子' },
];
const quickGuests = [
  { label: '8-10人', value: 10 },
  { label: '10-15人', value: 15 },
  { label: '15-20人', value: 20 },
  { label: '20+人', value: 30 },
];
const quickBudgets = [
  { label: '¥200内', value: 200 },
  { label: '¥300内', value: 300 },
  { label: '¥500内', value: 500 },
];
const scenes = computed(() => {
  try { return JSON.parse(siteConfig.scene_tags || '[]'); }
  catch { return ['团建聚会', '生日派对', '朋友聚会', '亲子活动', '毕业趴', '闺蜜趴']; }
});
const heroStyle = computed(() => {
  if (siteConfig.hero_video) return {};
  if (siteConfig.hero_image) {
    return { backgroundImage: `url(${siteConfig.hero_image})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  return { backgroundImage: 'url(/images/hero-home.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' };
});

onMounted(async () => {
  try {
    const [cfg, home, statsRes, landingRes] = await Promise.allSettled([getSiteConfig(), getHome(), getHomeStats(), getLanding()]);
    if (cfg.status === 'fulfilled') Object.assign(siteConfig, cfg.value as any);
    if (statsRes.status === 'fulfilled') Object.assign(homeStats, statsRes.value as any);
    if (home.status === 'fulfilled') {
      const d = home.value as any;
      banners.value = d.banners || [];
      villas.value = d.villas || [];
      groupBuys.value = d.groupBuys || [];
      themePacks.value = d.themePacks || [];
      activityPlans.value = d.activityPlans || [];
      localServices.value = d.localServices || [];
    }
    // 真实案例（从 landing 数据中取）
    if (landingRes.status === 'fulfilled') {
      const ld = landingRes.value as any;
      featuredCases.value = (ld.cases || []).slice(0, 4).map((c: any) => ({
        id: c.id,
        villaId: c.villa?.id,
        cover: c.videos?.[0]?.cover || c.villa?.coverImage || c.images?.[0],
        hasVideo: c.videos?.length > 0,
        content: c.content ? (c.content.length > 50 ? c.content.slice(0, 50) + '...' : c.content) : '非常棒的体验！',
        rating: c.rating,
        nickname: c.user?.nickname || '匿名用户',
      }));
    }
  } finally {
    homeLoading.value = false;
  }
});

function goSearch(tag?: any) {
  const p: any = {};
  if (typeof tag === 'string') p.tag = sceneTagMap[tag] || tag;
  else if (keyword.value) p.keyword = keyword.value;
  router.push({ path: '/search', query: p });
}

function goQuickMatch() {
  const p: any = {
    tag: quickScene.value,
    guests: quickGuest.value,
    per_budget: quickBudget.value,
    max_price: quickGuest.value * quickBudget.value,
    source: 'quick_match',
  };
  if (quickDate.value) p.check_in = quickDate.value;
  trackEvent('quick_match_submit', {
    metadata: {
      page: 'home',
      scene: quickScene.value,
      guests: quickGuest.value,
      perBudget: quickBudget.value,
      date: quickDate.value,
    },
  });
  router.push({ path: '/search', query: p });
}
function goDetail(id: number) { router.push(`/villa/${id}`); }
function goBanner(b: any) { if (b.villaId) goDetail(b.villaId); }

function openWechat(source: string) {
  showWechatModal.value = true;
  trackEvent('wechat_click', { metadata: { page: 'home', source } });
}

function copyWechat() {
  const wechat = siteConfig.landing_wechat_id || 'villa_service';
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
  trackEvent('wechat_copy', { metadata: { page: 'home' } });
}

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
.mobile-hero-points { display: none; }
.quick-match-panel {
  max-width: 860px;
  margin: 0 auto 18px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(255,255,255,0.94);
  color: #1e293b;
  box-shadow: 0 10px 36px rgba(0,0,0,0.16);
  backdrop-filter: blur(14px);
}
.quick-match-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.quick-match-title {
  font-size: 18px;
  font-weight: 900;
}
.quick-match-sub {
  margin-top: 4px;
  color: #64748b;
  font-size: 13px;
}
.quick-match-badge {
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: 14px;
  color: #16a34a;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  font-size: 12px;
  font-weight: 800;
}
.quick-match-row {
  display: grid;
  grid-template-columns: 1.2fr 1.2fr 1.1fr 150px;
  gap: 12px;
  align-items: end;
}
.quick-match-label {
  display: block;
  margin-bottom: 8px;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
}
.quick-match-options {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.quick-match-options button {
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 7px 12px;
  background: #fff;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.quick-match-options button.active {
  border-color: #ff6b35;
  background: #fff3ed;
  color: #ff6b35;
}
.quick-date-input {
  width: 100%;
  height: 36px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 0 12px;
  color: #334155;
  background: #fff;
  font-size: 12px;
  font-weight: 700;
}
.quick-match-submit {
  width: 100%;
  height: 46px;
  margin-top: 14px;
  border: none;
  border-radius: 24px;
  color: #fff;
  background: linear-gradient(135deg, #ff6b35, #ff4500);
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 8px 22px rgba(255,107,53,0.28);
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

/* ===== Hero视频 ===== */
.hero-video {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover; z-index: 0;
}

/* ===== 信任条 ===== */
.trust-bar { background: #fff; padding: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.trust-inner { display: flex; justify-content: center; gap: 64px; }
.trust-item { text-align: center; }
.trust-item b { display: block; font-size: 28px; font-weight: 900; color: #ff6b35; }
.trust-item span { font-size: 13px; color: #94a3b8; }
.skeleton-block,
.skeleton-line,
.skeleton-tags span {
  position: relative;
  overflow: hidden;
  background: #eef2f7;
}
.skeleton-block::after,
.skeleton-line::after,
.skeleton-tags span::after {
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
.skeleton-line.stat {
  width: 58px;
  height: 28px;
  margin: 0 auto 8px;
}
.skeleton-line.label {
  width: 70px;
  margin: 0 auto;
}
.skeleton-line.title {
  width: 72%;
  height: 16px;
  margin-bottom: 12px;
}
.skeleton-line.medium {
  width: 86%;
  margin-bottom: 12px;
}
.skeleton-line.short {
  width: 46%;
}
.skeleton-line.footer {
  width: 100%;
  height: 22px;
  margin-top: 16px;
}
.skeleton-tags {
  display: flex;
  gap: 6px;
  margin-top: 12px;
}
.skeleton-tags span {
  width: 54px;
  height: 22px;
  border-radius: 11px;
}
.villa-card-skeleton,
.case-card-skeleton,
.promo-card-skeleton,
.plan-card-skeleton,
.addon-card-skeleton {
  pointer-events: none;
  cursor: default;
}
@keyframes skeleton-shimmer {
  100% { transform: translateX(100%); }
}

/* ===== 真实案例 ===== */
.cases-scroll {
  display: flex; gap: 16px; overflow-x: auto;
  padding-bottom: 8px; scroll-snap-type: x mandatory;
}
.cases-scroll::-webkit-scrollbar { height: 4px; }
.cases-scroll::-webkit-scrollbar-thumb { background: #e0d6cc; border-radius: 2px; }
.case-card {
  flex: 0 0 260px; scroll-snap-align: start;
  border-radius: 12px; overflow: hidden; background: #fff;
  cursor: pointer; transition: transform 0.25s;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}
.case-card:hover { transform: translateY(-3px); }
.case-media { position: relative; height: 160px; }
.case-media img { width: 100%; height: 100%; object-fit: cover; }
.case-play {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 44px; height: 44px;
  background: rgba(0,0,0,0.5); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 16px;
}
.case-body { padding: 12px; }
.case-quote { font-size: 13px; color: #475569; line-height: 1.5; margin-bottom: 8px; }
.case-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.case-rating { color: #f59e0b; }
.case-user { color: #94a3b8; }

/* ===== 微信浮动按钮 ===== */
.wechat-fab {
  position: fixed; right: 24px; bottom: 100px;
  width: 52px; height: 52px;
  background: #07c160; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 50;
  box-shadow: 0 4px 16px rgba(7,193,96,0.4);
  transition: transform 0.3s;
}
.wechat-fab:hover { transform: scale(1.1); }
.wechat-fab-icon { color: #fff; font-size: 13px; font-weight: 700; }
.wechat-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 200;
}
.wechat-modal-card {
  background: #fff; border-radius: 16px;
  padding: 32px 28px; text-align: center;
  max-width: 340px; width: 90%;
  position: relative;
}
.wechat-modal-close {
  position: absolute; top: 10px; right: 14px;
  font-size: 24px; color: #94a3b8; cursor: pointer;
}
.wechat-modal-card h3 { font-size: 18px; margin-bottom: 6px; }
.wechat-modal-card p { font-size: 13px; color: #64748b; margin-bottom: 12px; }
.wechat-qr { width: 180px; height: 180px; border-radius: 10px; }
.wechat-id { font-size: 14px; color: #1e293b; font-weight: 600; margin-top: 12px; }
.wechat-copy-btn {
  margin-top: 12px;
  border: none;
  border-radius: 22px;
  padding: 10px 28px;
  color: #fff;
  background: linear-gradient(135deg, #ff6b35, #ff4500);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.mobile-home-bar { display: none; }
.mobile-home-consult,
.mobile-home-main {
  border: none;
  height: 44px;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 800;
}
.mobile-home-consult {
  flex: 0 0 112px;
  color: #16a34a;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}
.mobile-home-main {
  flex: 1;
  color: #fff;
  background: linear-gradient(135deg, #ff6b35, #ff4500);
}

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
.promo-media { height: 130px; }
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
.plan-media { height: 120px; }
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
.addon-media { height: 100px; }
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
  .home-page { padding-bottom: calc(68px + env(safe-area-inset-bottom)); }
  .hero { padding: 56px 0 42px; }
  .hero-content h1 { font-size: 26px; letter-spacing: 2px; }
  .hero-content p { font-size: 14px; letter-spacing: 2px; margin-bottom: 14px; }
  .mobile-hero-points {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 18px;
  }
  .mobile-hero-points span {
    padding: 6px 10px;
    border-radius: 16px;
    color: #fff;
    background: rgba(255,255,255,0.18);
    border: 1px solid rgba(255,255,255,0.24);
    font-size: 12px;
    backdrop-filter: blur(8px);
  }
  .quick-match-panel {
    margin: 0 0 14px;
    padding: 14px;
    border-radius: 14px;
  }
  .quick-match-head {
    margin-bottom: 12px;
  }
  .quick-match-title {
    font-size: 16px;
  }
  .quick-match-sub {
    font-size: 12px;
  }
  .quick-match-badge {
    display: none;
  }
  .quick-match-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .quick-match-options {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 2px;
  }
  .quick-match-options button {
    flex-shrink: 0;
    min-width: 74px;
  }
  .quick-match-submit {
    height: 44px;
    margin-top: 12px;
  }
  .search-box { flex-direction: column; gap: 8px; border-radius: 12px; padding: 8px; }
  .search-box .el-button { border-radius: 12px; width: 100%; }
  .scene-tags { gap: 8px; }
  .scene-tags span { padding: 6px 14px; font-size: 12px; }
  .wechat-fab { display: none; }
  .mobile-home-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 120;
    display: flex;
    gap: 10px;
    padding: 10px 14px;
    padding-bottom: max(10px, env(safe-area-inset-bottom));
    background: rgba(255,255,255,0.96);
    box-shadow: 0 -4px 18px rgba(15,23,42,0.12);
    backdrop-filter: blur(12px);
  }
  .wechat-modal-card {
    width: calc(100% - 32px);
    padding: 26px 20px;
  }

  .trust-inner { gap: 24px; }
  .trust-item b { font-size: 20px; }
  .case-card { flex: 0 0 220px; }
  .case-media { height: 130px; }

  .section { padding: 24px 0; }
  .section-compact { padding: 18px 0; }
  .section-header h2 { font-size: 18px; }

  .villa-grid { grid-template-columns: 1fr; gap: 16px; }
  .villa-img-wrap { height: 180px; }

  .promo-card { flex: 0 0 180px; }
  .promo-card img { height: 100px; }
  .promo-media { height: 100px; }

  .plan-card-h { flex: 0 0 200px; }
  .plan-card-h img { height: 100px; }
  .plan-media { height: 100px; }

  .addon-card { flex: 0 0 140px; }
  .addon-card img { height: 80px; }
  .addon-media { height: 80px; }
}

/* 图片加载失败占位 */
.img-error-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: #f1f5f9; color: #94a3b8; font-size: 13px;
}
</style>
