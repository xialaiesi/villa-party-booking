<template>
  <div class="landing-page">
    <!-- 第一屏：Hero 多图轮播 + 动态文案 -->
    <section class="hero-section">
      <video
        v-if="siteConfig.landing_hero_video"
        class="hero-video"
        :src="siteConfig.landing_hero_video"
        autoplay muted loop playsinline
      />
      <template v-else>
        <div
          v-for="(slide, i) in heroSlides" :key="i"
          class="hero-slide"
          :class="{ active: heroIndex === i }"
          :style="{ backgroundImage: `url(${slide.img})` }"
        />
      </template>
      <div class="hero-overlay" />
      <div class="hero-body">
        <h1 :key="heroIndex" class="hero-title-anim">{{ currentHeroTitle }}</h1>
        <p class="hero-sub">{{ currentHeroSub }}</p>
        <!-- #7 本周咨询数 -->
        <div class="hero-trust" v-if="stats.villaCount">
          本周已有 <b>{{ weeklyConsults }}</b> 人咨询预订
        </div>
        <div class="scene-tabs">
          <span
            v-for="s in sceneTabs" :key="s.key"
            :class="['scene-tab', { active: activeScene === s.key }]"
            @click="activeScene = s.key"
          >{{ s.label }}</span>
        </div>
        <div class="hero-cta">
          <button class="btn-primary" @click="openWechat()">微信咨询，免费推荐</button>
          <button class="btn-ghost" @click="scrollTo('villas')">先看看别墅</button>
        </div>
      </div>
      <!-- #2 向下滚动提示 -->
      <div class="scroll-hint" @click="scrollTo('cases')">
        <span></span>
      </div>
    </section>

    <!-- #3 实时滚动通知条 -->
    <div class="notify-bar">
      <div class="notify-item" :key="notifyIndex">
        {{ notifications[notifyIndex] }}
      </div>
    </div>

    <!-- 第二屏：真实案例 -->
    <section class="cases-section fade-section" ref="casesRef">
      <div class="section-inner">
        <h2>看看他们的别墅趴</h2>
        <div class="cases-scroll">
          <div class="case-card" v-for="c in filteredCases" :key="c.id">
            <div class="case-media">
              <img v-if="!c.videos?.length" :src="resolveImg(c.villa?.coverImage || c.images?.[0])" loading="lazy" />
              <div v-else class="case-video-wrap" @click="playVideo(c.videos[0])">
                <img :src="resolveImg(c.videos[0].cover || c.villa?.coverImage)" loading="lazy" />
                <div class="play-icon">&#9654;</div>
              </div>
            </div>
            <div class="case-body">
              <!-- #4 活动类型图标 -->
              <div class="case-tag">
                <span class="case-icon">{{ caseIcon(c) }}</span>
                {{ c.guests || '?' }}人{{ guessCaseType(c) }}
              </div>
              <div class="case-quote">"{{ truncate(c.content, 60) }}"</div>
              <div class="case-user">
                <div class="case-avatar">{{ (c.user?.nickname || '?')[0] }}</div>
                <span>{{ c.user?.nickname || '匿名用户' }}</span>
                <span class="case-rating">{{ '★'.repeat(c.rating) }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- #11 图片对比滑块（占位版） -->
        <div class="compare-section" v-if="false">
          <h3>布置前 vs 布置后</h3>
          <div class="compare-slider">
            <div class="compare-before">布置前</div>
            <div class="compare-after">布置后</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 第三屏：精选别墅 -->
    <section class="villas-section fade-section" ref="villasRef">
      <div class="section-inner">
        <h2>精选别墅</h2>
        <!-- #10 帮我选 快速匹配器 -->
        <div class="matcher">
          <div class="matcher-row">
            <div class="matcher-group">
              <span class="matcher-label">人数</span>
              <div class="matcher-options">
                <span
                  v-for="opt in matcherGuests" :key="opt.value"
                  :class="['m-opt', { active: matchGuests === opt.value }]"
                  @click="matchGuests = matchGuests === opt.value ? '' : opt.value"
                >{{ opt.label }}</span>
              </div>
            </div>
            <div class="matcher-group">
              <span class="matcher-label">预算</span>
              <div class="matcher-options">
                <span
                  v-for="opt in matcherBudget" :key="opt.value"
                  :class="['m-opt', { active: matchBudget === opt.value }]"
                  @click="matchBudget = matchBudget === opt.value ? '' : opt.value"
                >{{ opt.label }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="villa-grid">
          <div
            class="villa-card"
            v-for="(v, vi) in matchedVillas"
            :key="v.id"
            @click="goVilla(v.id)"
          >
            <div class="villa-img">
              <img :src="resolveImg(v.coverImage)" loading="lazy" />
              <!-- #8 热度标签 -->
              <span class="hot-tag" v-if="vi < 2">热门</span>
              <!-- #6 悬浮设施图标 -->
              <div class="villa-facilities-overlay">
                <span v-for="f in (v.facilities || []).slice(0, 4)" :key="f">{{ f }}</span>
              </div>
            </div>
            <div class="villa-info">
              <div class="villa-name">{{ v.name }}</div>
              <!-- #5 一句话卖点 -->
              <div class="villa-highlights">
                {{ villaHighlight(v) }}
              </div>
              <div class="villa-bottom">
                <span class="villa-guests">{{ v.maxGuests }}人</span>
                <span class="villa-price">¥{{ v.basePrice }}<small>起/晚</small></span>
              </div>
              <div class="villa-rating-row" v-if="v.ratingAvg">
                <span class="stars">★ {{ v.ratingAvg }}</span>
                <span class="cnt">{{ v.ratingCount }}条评价</span>
              </div>
            </div>
          </div>
        </div>
        <div class="more-wrap">
          <button class="btn-outline" @click="$router.push('/search')">查看全部别墅</button>
        </div>
      </div>
    </section>

    <!-- 第四屏：价格透明 -->
    <section class="price-section fade-section">
      <div class="section-inner">
        <h2>人均多少钱？</h2>
        <div class="price-grid">
          <div class="price-card" v-for="(tier, ti) in priceTiers" :key="tier.label">
            <!-- #9 限时优惠倒计时 (品质档) -->
            <div class="price-countdown" v-if="ti === 1">
              新客立减 ¥200 · 剩余 {{ countdownStr }}
            </div>
            <div class="price-tier-label">{{ tier.label }}</div>
            <div class="price-tier-price">人均 <b>¥{{ tier.perPerson }}</b> 起</div>
            <div class="price-tier-desc">{{ tier.desc }}</div>
            <ul class="price-tier-includes">
              <li v-for="item in tier.includes" :key="item">{{ item }}</li>
            </ul>
            <button class="btn-primary btn-sm" @click="openWechat()">了解这个档位</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 第五屏：FAQ + 联系 -->
    <section class="faq-section fade-section">
      <div class="section-inner">
        <h2>常见问题</h2>
        <div class="faq-list">
          <div class="faq-item" v-for="(f, i) in faqs" :key="i" @click="f.open = !f.open">
            <div class="faq-q">
              <span>{{ f.q }}</span>
              <span class="faq-arrow" :class="{ open: f.open }">&#9660;</span>
            </div>
            <div class="faq-a" v-show="f.open">{{ f.a }}</div>
          </div>
        </div>
        <div class="contact-card">
          <div class="contact-stats">
            <div class="stat-item"><b>{{ stats.villaCount }}+</b><span>精选别墅</span></div>
            <div class="stat-item"><b>{{ stats.orderCount }}+</b><span>成功活动</span></div>
            <div class="stat-item"><b>{{ stats.reviewCount }}+</b><span>真实好评</span></div>
          </div>
          <button class="btn-primary btn-lg" @click="openWechat()">微信咨询</button>
          <p class="contact-phone" v-if="siteConfig.landing_phone">
            或致电 <a :href="'tel:' + siteConfig.landing_phone">{{ siteConfig.landing_phone }}</a>
          </p>
        </div>
      </div>
    </section>

    <!-- #13 小红书笔记入口 -->
    <section class="xhs-section fade-section">
      <div class="section-inner">
        <h2>关注我们的小红书</h2>
        <p class="xhs-desc">更多别墅实拍、活动花絮、优惠信息</p>
        <div class="xhs-grid">
          <div class="xhs-card" v-for="n in xhsNotes" :key="n.title">
            <div class="xhs-img" :style="{ backgroundImage: `url(${n.cover})` }"></div>
            <div class="xhs-body">
              <div class="xhs-title">{{ n.title }}</div>
              <div class="xhs-meta">{{ n.likes }} 赞 · {{ n.date }}</div>
            </div>
          </div>
        </div>
        <div class="xhs-follow">
          <span class="xhs-id">小红书号：villa_party</span>
          <span class="xhs-tag">搜索关注，获取更多灵感</span>
        </div>
      </div>
    </section>

    <!-- 浮动底部栏 -->
    <div class="floating-bar">
      <div class="bar-left" @click="openWechat()">
        <span class="bar-icon">💬</span>
        <span class="bar-text">咨询</span>
      </div>
      <button class="bar-main" @click="$router.push('/search')">立即预订</button>
      <div class="bar-left" @click="openWechat()">
        <span class="bar-icon">📞</span>
        <span class="bar-text">电话</span>
      </div>
    </div>

    <!-- 微信弹窗 -->
    <div class="wechat-modal" v-if="showWechat" @click.self="showWechat = false">
      <div class="wechat-card">
        <div class="wechat-close" @click="showWechat = false">&times;</div>
        <h3>扫码添加微信</h3>
        <p>免费推荐最适合你的别墅</p>
        <img v-if="siteConfig.landing_wechat_qr" :src="siteConfig.landing_wechat_qr" class="qr-img" />
        <div v-else class="qr-placeholder">
          <p>微信号：{{ siteConfig.landing_wechat_id || 'villa_service' }}</p>
          <p class="qr-tip">截图后微信扫一扫添加</p>
        </div>
        <p class="wechat-phone" v-if="siteConfig.landing_phone">
          或致电 <a :href="'tel:' + siteConfig.landing_phone">{{ siteConfig.landing_phone }}</a>
        </p>
      </div>
    </div>

    <!-- 视频播放弹窗 -->
    <div class="video-modal" v-if="currentVideo" @click.self="currentVideo = null">
      <div class="video-wrap">
        <div class="video-close" @click="currentVideo = null">&times;</div>
        <video :src="resolveImg(currentVideo.url)" controls autoplay />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getLanding, getSiteConfig } from '../../api/villa';
import { thumbUrl } from '../../utils/request';
import { trackEvent } from '../../utils/tracker';

const router = useRouter();
const route = useRoute();
const resolveImg = thumbUrl;

const siteConfig = reactive<Record<string, string>>({});
const cases = ref<any[]>([]);
const villas = ref<any[]>([]);
const stats = reactive({ villaCount: 0, orderCount: 0, reviewCount: 0 });
const activeScene = ref((route.query.scene as string) || 'all');
const showWechat = ref(false);
function openWechat() {
  showWechat.value = true;
  trackEvent('wechat_click', { metadata: { page: 'landing' } });
}
const currentVideo = ref<any>(null);
const villasRef = ref<HTMLElement>();
const casesRef = ref<HTMLElement>();

// ===== #1 Hero 多图轮播 + 动态文案 =====
const heroSlides = [
  { img: '/images/hero-landing.jpg', title: '把周末还给自己', sub: '私人泳池 · 星空晚宴 · 只属于你们的时光' },
  { img: '/images/hero-home.jpg', title: '一栋别墅，装下所有人', sub: '不用分房、不用拼桌，整栋都是你们的' },
  { img: '/images/hero-pool.jpg', title: '醒来就是度假', sub: '推开门是花园，抬起头是星空' },
  { img: '/images/hero-villa-night.jpg', title: '聚在一起，才叫生活', sub: 'KTV · 泳池 · BBQ · 从日落玩到日出' },
];
const heroIndex = ref(0);
let heroTimer: ReturnType<typeof setInterval>;

// #12 场景化文案
const sceneHeroMap: Record<string, { title: string; sub: string }> = {
  birthday: { title: '这次生日，值得被记住', sub: '专属布置 · 惊喜策划 · 让TA感动到哭' },
  teambuilding: { title: '好的团建，不需要PPT', sub: '泳池对抗 · 花园烧烤 · 真正玩到一起' },
  friends: { title: '想见的人，都在这里', sub: '包下整栋别墅 · 通宵畅聊 · 不被打扰' },
  family: { title: '给孩子一个撒野的周末', sub: '大花园 · 安全私密 · 大人也能放松' },
};

const currentHeroTitle = computed(() => {
  if (activeScene.value !== 'all' && sceneHeroMap[activeScene.value]) {
    return sceneHeroMap[activeScene.value].title;
  }
  return heroSlides[heroIndex.value].title;
});
const currentHeroSub = computed(() => {
  if (activeScene.value !== 'all' && sceneHeroMap[activeScene.value]) {
    return sceneHeroMap[activeScene.value].sub;
  }
  return heroSlides[heroIndex.value].sub;
});

const currentCity = computed(() => siteConfig.landing_city || '深圳');

// #7 本周咨询数
const weeklyConsults = computed(() => Math.max(23, stats.orderCount * 3 + 15));

const sceneTabs = [
  { key: 'all', label: '全部' },
  { key: 'birthday', label: '生日趴' },
  { key: 'teambuilding', label: '团建' },
  { key: 'friends', label: '朋友聚会' },
  { key: 'family', label: '家庭亲子' },
];

const sceneTagMap: Record<string, string> = {
  birthday: '生日',
  teambuilding: '团建',
  friends: '聚会',
  family: '亲子',
};

// #12 场景化案例筛选
const filteredCases = computed(() => {
  if (activeScene.value === 'all') return cases.value;
  const tag = sceneTagMap[activeScene.value] || '';
  if (!tag) return cases.value;
  const filtered = cases.value.filter(c => (c.villa?.tags || '').includes(tag));
  return filtered.length ? filtered : cases.value;
});

// ===== #10 帮我选匹配器 =====
const matchGuests = ref('');
const matchBudget = ref('');
const matcherGuests = [
  { label: '8-10人', value: '10' },
  { label: '10-15人', value: '15' },
  { label: '15-20人', value: '20' },
  { label: '20+人', value: '30' },
];
const matcherBudget = [
  { label: '人均200内', value: '200' },
  { label: '200-400', value: '400' },
  { label: '400+', value: '999' },
];

const filteredVillas = computed(() => {
  if (activeScene.value === 'all') return villas.value;
  const tag = sceneTagMap[activeScene.value] || '';
  if (!tag) return villas.value;
  const filtered = villas.value.filter(v => (v.tags || '').includes(tag));
  return filtered.length ? filtered : villas.value;
});

const matchedVillas = computed(() => {
  let list = filteredVillas.value;
  if (matchGuests.value) {
    const max = parseInt(matchGuests.value);
    list = list.filter(v => v.maxGuests >= max - 5 && v.maxGuests <= max + 10);
    if (!list.length) list = filteredVillas.value;
  }
  if (matchBudget.value) {
    const budget = parseInt(matchBudget.value);
    list = list.filter(v => {
      const perPerson = v.basePrice / Math.max(v.maxGuests, 1);
      return budget >= 999 ? perPerson >= 400 : perPerson <= budget;
    });
    if (!list.length) list = filteredVillas.value;
  }
  return list;
});

// ===== #5 一句话卖点 =====
function villaHighlight(v: any): string {
  const facilities = v.facilities || [];
  const tags = v.tags || '';
  if (facilities.includes('泳池') || facilities.includes('私人泳池')) return '自带私人泳池，拍照绝了';
  if (facilities.includes('KTV')) return '自带KTV，嗨唱不扰民';
  if (tags.includes('海景') || tags.includes('山景')) return '绝美景观，推窗见山海';
  if (v.maxGuests >= 20) return v.maxGuests + '人超大空间，团建首选';
  if (facilities.includes('花园') || facilities.includes('BBQ')) return '花园BBQ，户外趴体绝佳';
  return facilities.slice(0, 3).join(' · ') || '精选品质别墅';
}

// ===== #4 案例类型图标 =====
function caseIcon(c: any): string {
  const type = guessCaseType(c);
  if (type.includes('生日')) return '🎂';
  if (type.includes('团建')) return '🤝';
  if (type.includes('亲子')) return '👨‍👩‍👧';
  if (type.includes('聚会')) return '🥂';
  return '🎉';
}

// ===== #3 实时滚动通知 =====
const notifications = reactive([
  '深圳南山 · 12人生日趴 · 3天前',
  '东莞松山湖 · 20人公司团建 · 昨天',
  '惠州双月湾 · 8人闺蜜趴 · 今天',
  '深圳龙华 · 15人同学聚会 · 2天前',
  '广州从化 · 25人年会趴 · 昨天',
]);
const notifyIndex = ref(0);
let notifyTimer: ReturnType<typeof setInterval>;

// ===== #9 倒计时 =====
const countdownStr = ref('');
let countdownTimer: ReturnType<typeof setInterval>;
function updateCountdown() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // 月底
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) { countdownStr.value = '即将结束'; return; }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  countdownStr.value = `${d}天${h}小时`;
}

const priceTiers = reactive([
  { label: '经济档', perPerson: 200, desc: '适合8-10人，性价比之选', includes: ['独栋别墅', '厨房自助', '基础设施', '停车位'] },
  { label: '品质档', perPerson: 350, desc: '适合10-15人，设施齐全', includes: ['泳池/花园', 'KTV/投影', 'BBQ烧烤', '管家服务'] },
  { label: '豪华档', perPerson: 500, desc: '适合15-30人，高端体验', includes: ['私人泳池', '全套娱乐', '主题布置', '专属策划'] },
]);

const faqs = reactive([
  { q: '怎么预订？流程是什么？', a: '微信联系我们，告诉人数、日期和预算，我们免费推荐最合适的别墅。确认后支付定金即可锁定。', open: false },
  { q: '可以先看看别墅再决定吗？', a: '当然可以！我们提供实拍照片和视频，也可以安排实地看房。', open: false },
  { q: '价格包含哪些？还有额外费用吗？', a: '报价包含别墅住宿费用。BBQ食材、布置、活动道具等根据需求另算，都会提前报价，不会有隐藏费用。', open: false },
  { q: '取消订单怎么退款？', a: '入住前3天以上全额退款，3天内退50%，当天不退。特殊情况可协商处理。', open: false },
  { q: '别墅安全吗？有人管理吗？', a: '所有别墅都经过实地考察，入住期间有管家微信随时响应，紧急情况可上门处理。', open: false },
]);

// #13 小红书笔记
const xhsNotes = [
  { title: '人均300的泳池别墅趴！', cover: '/images/hero-landing.jpg', likes: '2.3k', date: '3天前' },
  { title: '深圳周末去哪玩？别墅趴攻略', cover: '/images/hero-pool.jpg', likes: '1.8k', date: '5天前' },
  { title: '20人团建别墅推荐合集', cover: '/images/hero-home.jpg', likes: '956', date: '1周前' },
  { title: '闺蜜生日趴布置全记录', cover: '/images/hero-villa-night.jpg', likes: '3.1k', date: '2天前' },
];

onMounted(async () => {
  const [cfgRes, landingRes] = await Promise.allSettled([getSiteConfig(), getLanding()]);
  if (cfgRes.status === 'fulfilled') Object.assign(siteConfig, cfgRes.value as any);
  if (landingRes.status === 'fulfilled') {
    const d = landingRes.value as any;
    cases.value = d.cases || [];
    villas.value = d.villas || [];
    if (d.stats) Object.assign(stats, d.stats);
  }
  if (route.query.scene) activeScene.value = route.query.scene as string;

  // Hero 轮播
  heroTimer = setInterval(() => {
    heroIndex.value = (heroIndex.value + 1) % heroSlides.length;
  }, 5000);

  // 通知轮播
  notifyTimer = setInterval(() => {
    notifyIndex.value = (notifyIndex.value + 1) % notifications.length;
  }, 3000);

  // 倒计时
  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 60000);

  // 滚动渐入动画
  const observer = new IntersectionObserver(
    (entries) => { entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }); },
    { threshold: 0.1 },
  );
  document.querySelectorAll('.fade-section').forEach((el) => observer.observe(el));
});

onUnmounted(() => {
  clearInterval(heroTimer);
  clearInterval(notifyTimer);
  clearInterval(countdownTimer);
});

function scrollTo(id: string) {
  const el = id === 'villas' ? villasRef.value : id === 'cases' ? casesRef.value : null;
  el?.scrollIntoView({ behavior: 'smooth' });
}

function goVilla(id: number) { router.push(`/villa/${id}`); }
function playVideo(video: any) { currentVideo.value = video; }

function guessCaseType(c: any) {
  const tags = c.villa?.tags || '';
  if (tags.includes('生日')) return '生日趴';
  if (tags.includes('团建')) return '团建';
  if (tags.includes('亲子')) return '亲子游';
  if (tags.includes('聚会')) return '聚会';
  return '别墅趴';
}

function truncate(s: string, len: number) {
  if (!s) return '非常棒的体验！';
  return s.length > len ? s.slice(0, len) + '...' : s;
}
</script>

<style scoped>
/* ===== 全局 ===== */
.landing-page {
  font-family: -apple-system, 'PingFang SC', 'Noto Sans SC', 'Helvetica Neue', sans-serif;
  color: #1e293b; background: #fff; padding-bottom: 64px; overflow-x: hidden;
}
.section-inner { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
h2 { font-size: 28px; font-weight: 800; text-align: center; margin-bottom: 32px; }

/* ===== 滚动渐入 ===== */
.fade-section { opacity: 0; transform: translateY(40px); transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1); }
.fade-section.visible { opacity: 1; transform: translateY(0); }

/* ===== 按钮 ===== */
.btn-primary { background: linear-gradient(135deg, #ff6b35, #ff4500); color: #fff; border: none; border-radius: 28px; padding: 14px 36px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(255,107,53,0.4); }
.btn-primary.btn-sm { padding: 10px 24px; font-size: 14px; }
.btn-primary.btn-lg { padding: 16px 48px; font-size: 18px; }
.btn-ghost { background: rgba(255,255,255,0.2); color: #fff; border: 2px solid rgba(255,255,255,0.6); border-radius: 28px; padding: 12px 32px; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.3s; backdrop-filter: blur(4px); }
.btn-ghost:hover { background: rgba(255,255,255,0.35); }
.btn-outline { background: transparent; color: #ff6b35; border: 2px solid #ff6b35; border-radius: 28px; padding: 12px 36px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s; }
.btn-outline:hover { background: #ff6b35; color: #fff; }

/* ===== Hero ===== */
.hero-section { position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.hero-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hero-slide { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0; transform: scale(1.08); transition: opacity 1.5s ease, transform 6s ease; }
.hero-slide.active { opacity: 1; transform: scale(1); }
.hero-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.6) 100%); z-index: 1; }
.hero-body { position: relative; z-index: 2; text-align: center; color: #fff; padding: 0 20px; max-width: 700px; }
.hero-body h1 { font-size: 38px; font-weight: 700; line-height: 1.3; margin-bottom: 14px; text-shadow: 0 2px 16px rgba(0,0,0,0.4); letter-spacing: 3px; font-family: 'PingFang SC', 'Noto Sans SC', sans-serif; }
.hero-title-anim { animation: fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1); }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.hero-sub { font-size: 16px; opacity: 0.85; margin-bottom: 18px; letter-spacing: 2px; font-weight: 300; }
.hero-trust { font-size: 13px; opacity: 0.7; margin-bottom: 28px; letter-spacing: 1px; }
.hero-trust b { color: #ffd700; font-size: 16px; font-weight: 700; }
.scene-tabs { display: flex; justify-content: center; gap: 10px; margin-bottom: 36px; flex-wrap: wrap; }
.scene-tab { padding: 8px 22px; border-radius: 20px; font-size: 14px; cursor: pointer; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); transition: all 0.3s; backdrop-filter: blur(4px); }
.scene-tab:hover, .scene-tab.active { background: rgba(255,255,255,0.3); border-color: #fff; }
.hero-cta { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }

/* #2 向下滚动提示 */
.scroll-hint { position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); z-index: 2; cursor: pointer; }
.scroll-hint span { display: block; width: 24px; height: 24px; border-right: 2px solid rgba(255,255,255,0.7); border-bottom: 2px solid rgba(255,255,255,0.7); transform: rotate(45deg); animation: scrollBounce 2s infinite; }
@keyframes scrollBounce { 0%, 20%, 50%, 80%, 100% { transform: rotate(45deg) translateY(0); } 40% { transform: rotate(45deg) translateY(10px); } 60% { transform: rotate(45deg) translateY(5px); } }

/* #3 通知条 */
.notify-bar { background: #fff9f5; padding: 10px 0; text-align: center; font-size: 13px; color: #94702c; border-bottom: 1px solid #fef0e0; overflow: hidden; height: 38px; }
.notify-item { animation: notifySlide 0.4s ease; }
@keyframes notifySlide { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }

/* ===== 案例 ===== */
.cases-section { padding: 64px 0; background: linear-gradient(rgba(250,249,247,0.92), rgba(250,249,247,0.92)), url('/images/bg-pool.jpg') center/cover; }
.cases-scroll { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 12px; scroll-snap-type: x mandatory; }
.cases-scroll::-webkit-scrollbar { height: 4px; }
.cases-scroll::-webkit-scrollbar-thumb { background: #e0d6cc; border-radius: 2px; }
.case-card { flex: 0 0 300px; scroll-snap-align: start; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease; }
.case-card:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 20px 48px rgba(0,0,0,0.15); }
.case-media { position: relative; height: 200px; }
.case-media img { width: 100%; height: 100%; object-fit: cover; }
.case-video-wrap { position: relative; height: 100%; cursor: pointer; }
.case-video-wrap img { width: 100%; height: 100%; object-fit: cover; }
.play-icon { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 56px; height: 56px; background: rgba(0,0,0,0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 20px; transition: background 0.3s; }
.case-video-wrap:hover .play-icon { background: rgba(255,107,53,0.9); }
.case-body { padding: 16px; }
.case-tag { display: inline-flex; align-items: center; gap: 4px; background: #fff3ed; color: #ff6b35; padding: 3px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
.case-icon { font-size: 14px; }
.case-quote { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 12px; }
.case-user { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; }
.case-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #ff6b35, #ff8f65); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
.case-rating { color: #f59e0b; }

/* ===== #10 帮我选匹配器 ===== */
.matcher { background: #f8f6f3; border-radius: 16px; padding: 20px 24px; margin-bottom: 28px; }
.matcher-row { display: flex; gap: 32px; flex-wrap: wrap; }
.matcher-group { flex: 1; min-width: 200px; }
.matcher-label { font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 8px; display: block; }
.matcher-options { display: flex; gap: 8px; flex-wrap: wrap; }
.m-opt { padding: 6px 16px; border-radius: 20px; font-size: 13px; cursor: pointer; background: #fff; border: 1px solid #e2e8f0; color: #475569; transition: all 0.25s; }
.m-opt:hover { border-color: #ff6b35; color: #ff6b35; }
.m-opt.active { background: #ff6b35; color: #fff; border-color: #ff6b35; }

/* ===== 别墅 ===== */
.villas-section { padding: 64px 0; }
.villa-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.villa-card { background: #fff; border-radius: 16px; overflow: hidden; cursor: pointer; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.villa-card:hover { transform: translateY(-8px); box-shadow: 0 16px 40px rgba(0,0,0,0.14); }
.villa-img { height: 200px; position: relative; overflow: hidden; }
.villa-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
.villa-card:hover .villa-img img { transform: scale(1.05); }
/* #8 热度标签 */
.hot-tag { position: absolute; top: 12px; left: 12px; background: linear-gradient(135deg, #ff4500, #ff6b35); color: #fff; padding: 3px 12px; border-radius: 10px; font-size: 11px; font-weight: 700; z-index: 1; }
/* #6 悬浮设施图标 */
.villa-facilities-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 8px 12px; background: linear-gradient(transparent, rgba(0,0,0,0.7)); display: flex; gap: 6px; flex-wrap: wrap; opacity: 0; transition: opacity 0.3s; }
.villa-card:hover .villa-facilities-overlay { opacity: 1; }
.villa-facilities-overlay span { background: rgba(255,255,255,0.9); color: #1e293b; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; }
.villa-info { padding: 16px; }
.villa-name { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.villa-highlights { font-size: 13px; color: #ff6b35; margin-bottom: 10px; font-weight: 500; }
.villa-bottom { display: flex; justify-content: space-between; align-items: center; }
.villa-guests { background: #f1f5f9; padding: 3px 10px; border-radius: 10px; font-size: 12px; color: #64748b; }
.villa-price { color: #ff6b35; font-size: 20px; font-weight: 800; }
.villa-price small { font-size: 12px; color: #94a3b8; font-weight: 400; }
.villa-rating-row { margin-top: 8px; font-size: 13px; }
.villa-rating-row .stars { color: #f59e0b; font-weight: 700; }
.villa-rating-row .cnt { color: #94a3b8; margin-left: 6px; }
.more-wrap { text-align: center; margin-top: 32px; }

/* ===== 价格（暗色+金色调） ===== */
.price-section { padding: 80px 0; background: #1a1a2e; position: relative; overflow: hidden; }
.price-section::before { content: ''; position: absolute; inset: 0; background: url('/images/bg-dining.jpg') center/cover; opacity: 0.12; }
.price-section h2 { color: #fff; position: relative; }
.price-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; position: relative; }
.price-card { background: rgba(255,255,255,0.06); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px 24px; text-align: center; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.3s; position: relative; }
.price-card:hover { transform: translateY(-6px); border-color: rgba(212,175,55,0.4); }
.price-card:nth-child(2) { border: 1.5px solid #d4af37; background: rgba(212,175,55,0.08); }
.price-card:nth-child(2)::before { content: '推荐'; position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #d4af37, #f5d060); color: #1a1a2e; padding: 3px 20px; border-radius: 10px; font-size: 12px; font-weight: 700; }
/* #9 倒计时 */
.price-countdown { background: linear-gradient(135deg, #d4af37, #f5d060); color: #1a1a2e; padding: 6px 16px; border-radius: 8px; font-size: 12px; font-weight: 700; margin-bottom: 16px; display: inline-block; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
.price-tier-label { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: #f0e6d3; }
.price-tier-price { font-size: 14px; color: #a0a0b0; margin-bottom: 8px; }
.price-tier-price b { font-size: 36px; color: #d4af37; font-weight: 900; }
.price-tier-desc { font-size: 13px; color: #8888a0; margin-bottom: 16px; }
.price-tier-includes { list-style: none; padding: 0; margin: 0 0 24px; text-align: left; }
.price-tier-includes li { padding: 8px 0; font-size: 14px; color: #c0c0d0; border-bottom: 1px solid rgba(255,255,255,0.06); }
.price-tier-includes li::before { content: '✓ '; color: #d4af37; font-weight: 700; }
.price-section .btn-primary.btn-sm { background: linear-gradient(135deg, #d4af37, #f5d060); color: #1a1a2e; }
.price-section .btn-primary.btn-sm:hover { box-shadow: 0 8px 24px rgba(212,175,55,0.4); }

/* ===== FAQ ===== */
.faq-section { padding: 64px 0; }
.faq-list { max-width: 700px; margin: 0 auto 40px; }
.faq-item { border-bottom: 1px solid #f1f5f9; cursor: pointer; }
.faq-q { display: flex; justify-content: space-between; align-items: center; padding: 18px 0; font-size: 15px; font-weight: 600; }
.faq-arrow { font-size: 10px; color: #94a3b8; transition: transform 0.3s; }
.faq-arrow.open { transform: rotate(180deg); }
.faq-a { padding: 0 0 18px; font-size: 14px; color: #64748b; line-height: 1.7; }

/* ===== 联系卡片 ===== */
.contact-card { text-align: center; background: linear-gradient(135deg, #ff6b35 0%, #ff4500 100%); border-radius: 20px; padding: 40px 24px; color: #fff; }
.contact-stats { display: flex; justify-content: center; gap: 48px; margin-bottom: 28px; }
.stat-item { text-align: center; }
.stat-item b { display: block; font-size: 28px; font-weight: 900; }
.stat-item span { font-size: 13px; opacity: 0.85; }
.contact-card .btn-primary { background: #fff; color: #ff6b35; }
.contact-card .btn-primary:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
.contact-phone { margin-top: 16px; font-size: 14px; opacity: 0.9; }
.contact-phone a { color: #fff; text-decoration: underline; }

/* ===== #13 小红书 ===== */
.xhs-section { padding: 64px 0; background: #faf9f7; }
.xhs-desc { text-align: center; color: #94a3b8; font-size: 14px; margin-top: -20px; margin-bottom: 28px; }
.xhs-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.xhs-card { background: #fff; border-radius: 12px; overflow: hidden; transition: transform 0.3s; cursor: pointer; }
.xhs-card:hover { transform: translateY(-4px); }
.xhs-img { height: 140px; background-size: cover; background-position: center; }
.xhs-body { padding: 12px; }
.xhs-title { font-size: 13px; font-weight: 600; color: #1e293b; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.xhs-meta { font-size: 11px; color: #94a3b8; margin-top: 6px; }
.xhs-follow { text-align: center; margin-top: 24px; }
.xhs-id { font-size: 15px; font-weight: 700; color: #ff2442; }
.xhs-tag { display: block; font-size: 12px; color: #94a3b8; margin-top: 4px; }

/* ===== 浮动底部栏 ===== */
.floating-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  display: flex; align-items: center; gap: 0;
  padding: 8px 16px; padding-bottom: max(8px, env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -1px 12px rgba(0,0,0,0.08);
  z-index: 100;
}
.bar-left {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: 56px; cursor: pointer; gap: 2px;
}
.bar-icon { font-size: 18px; line-height: 1; }
.bar-text { font-size: 10px; color: #64748b; }
.bar-left:active { opacity: 0.6; }
.bar-main {
  flex: 1; margin: 0 12px;
  background: linear-gradient(135deg, #ff6b35, #ff4500);
  color: #fff; border: none; border-radius: 24px;
  padding: 14px 0; font-size: 16px; font-weight: 700;
  cursor: pointer; letter-spacing: 2px;
  transition: opacity 0.2s;
}
.bar-main:active { opacity: 0.85; }

/* ===== 弹窗 ===== */
.wechat-modal, .video-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(4px); }
.wechat-card { background: #fff; border-radius: 20px; padding: 36px 32px; text-align: center; max-width: 360px; width: 90%; position: relative; }
.wechat-close, .video-close { position: absolute; top: 12px; right: 16px; font-size: 28px; color: #94a3b8; cursor: pointer; line-height: 1; }
.wechat-close:hover, .video-close:hover { color: #1e293b; }
.wechat-card h3 { font-size: 20px; margin-bottom: 8px; }
.wechat-card p { font-size: 14px; color: #64748b; margin-bottom: 16px; }
.qr-img { width: 200px; height: 200px; border-radius: 12px; }
.qr-placeholder { padding: 24px; background: #f8f6f3; border-radius: 12px; }
.qr-placeholder p { margin: 4px 0; }
.qr-tip { font-size: 12px; color: #94a3b8; }
.wechat-phone { margin-top: 12px; font-size: 13px; color: #64748b; }
.wechat-phone a { color: #ff6b35; }
.video-wrap { position: relative; max-width: 90vw; max-height: 80vh; }
.video-wrap video { width: 100%; max-height: 80vh; border-radius: 12px; }
.video-close { color: #fff; top: -36px; right: 0; }

/* ===== 移动端 ===== */
@media (max-width: 768px) {
  .hero-body h1 { font-size: 24px; letter-spacing: 2px; }
  .hero-sub { font-size: 13px; }
  .hero-trust { font-size: 11px; }
  .scene-tabs { gap: 6px; }
  .scene-tab { padding: 6px 14px; font-size: 12px; }
  .hero-cta { flex-direction: column; align-items: center; gap: 10px; }
  .hero-cta .btn-primary, .hero-cta .btn-ghost { width: 80%; }

  h2 { font-size: 22px; margin-bottom: 24px; }

  .notify-bar { font-size: 12px; }

  .matcher-row { flex-direction: column; gap: 16px; }

  .cases-section { padding: 40px 0; }
  .case-card { flex: 0 0 260px; }
  .case-media { height: 160px; }

  .villas-section { padding: 40px 0; }
  .villa-grid { grid-template-columns: 1fr; gap: 16px; }

  .price-section { padding: 48px 0; }
  .price-grid { grid-template-columns: 1fr; gap: 16px; }
  .price-tier-price b { font-size: 28px; }

  .faq-section { padding: 40px 0; }
  .contact-stats { gap: 24px; }
  .stat-item b { font-size: 22px; }

  .xhs-grid { grid-template-columns: repeat(2, 1fr); }
  .xhs-img { height: 120px; }

  .floating-bar { padding: 8px 16px; }
}
</style>
