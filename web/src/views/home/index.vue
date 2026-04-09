<template>
  <div>
    <!-- Hero 搜索区 -->
    <div class="hero">
      <div class="container">
        <h1 class="hero-title">找到你的完美别墅趴场地</h1>
        <p class="hero-subtitle">团建 · 生日 · 聚会 · 亲子 · 一站式解决</p>
        <div class="search-box">
          <el-input
            v-model="keyword"
            placeholder="搜索别墅名、地点..."
            size="large"
            class="search-input"
            @keyup.enter="goSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-button type="primary" size="large" @click="goSearch">搜索</el-button>
        </div>
        <div class="scene-tags">
          <span class="tag" v-for="t in scenes" :key="t" @click="goSearch(t)">
            {{ t }}
          </span>
        </div>
      </div>
    </div>

    <!-- 限定活动 Banner -->
    <div class="container section" v-if="banners.length">
      <div class="section-header">
        <h2>🎉 限时活动</h2>
      </div>
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

    <!-- 推荐别墅 -->
    <div class="container section">
      <div class="section-header">
        <h2>🏡 精选别墅</h2>
        <router-link to="/search" class="more-link">查看全部 →</router-link>
      </div>
      <div class="villa-grid" v-if="villas.length">
        <div class="villa-card" v-for="v in villas" :key="v.id" @click="goDetail(v.id)">
          <div class="villa-img-wrap">
            <img :src="resolveImg(v.coverImage) || '/vite.svg'" />
            <div class="villa-merchant" v-if="v.merchantName">{{ v.merchantName }}</div>
          </div>
          <div class="villa-body">
            <div class="villa-name">{{ v.name }}</div>
            <div class="villa-address">📍 {{ v.address }}</div>
            <div class="villa-tags">
              <span class="tag" v-for="t in (v.tags || '').split(',').filter(Boolean)" :key="t">
                {{ t }}
              </span>
            </div>
            <div class="villa-footer">
              <div class="villa-price">
                <span class="price">¥{{ v.basePrice }}</span>
                <span class="unit">起/晚</span>
              </div>
              <div class="villa-guests">可住 {{ v.maxGuests }} 人</div>
            </div>
          </div>
        </div>
      </div>
      <el-skeleton v-else :rows="5" animated />
    </div>

    <!-- 正在拼团 -->
    <div class="container section" v-if="groupBuys.length">
      <div class="section-header">
        <h2>🔥 正在拼团</h2>
      </div>
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
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search } from '@element-plus/icons-vue';
import { getHome } from '../../api/villa';
import { resolveImageUrl } from '../../utils/request';

const router = useRouter();
const keyword = ref('');
const banners = ref<any[]>([]);
const villas = ref<any[]>([]);
const groupBuys = ref<any[]>([]);
const resolveImg = resolveImageUrl;

const scenes = ['团建聚会', '生日派对', '朋友聚会', '亲子活动', '毕业趴', '闺蜜趴'];

onMounted(async () => {
  try {
    const data: any = await getHome();
    banners.value = data.banners || [];
    villas.value = data.villas || [];
    groupBuys.value = data.groupBuys || [];
  } catch (e) {
    console.error(e);
  }
});

function goSearch(tag?: any) {
  const params: any = {};
  if (typeof tag === 'string') params.tag = tag;
  else if (keyword.value) params.keyword = keyword.value;
  router.push({ path: '/search', query: params });
}

function goDetail(id: number) {
  router.push(`/villa/${id}`);
}

function goBanner(b: any) {
  if (b.villaId) goDetail(b.villaId);
}
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, #ff6b35, #ff8f65);
  padding: 80px 0;
  color: #fff;
}
.hero-title {
  font-size: 44px; font-weight: bold; text-align: center;
  margin-bottom: 16px;
}
.hero-subtitle {
  font-size: 20px; text-align: center; opacity: 0.9;
  margin-bottom: 40px;
}
.search-box {
  display: flex; gap: 12px; max-width: 700px; margin: 0 auto;
}
.search-input {
  background: #fff; border-radius: 8px;
}
.scene-tags {
  display: flex; justify-content: center; gap: 12px;
  margin-top: 24px; flex-wrap: wrap;
}
.scene-tags .tag {
  background: rgba(255, 255, 255, 0.2); color: #fff;
  padding: 8px 20px; border-radius: 24px; font-size: 14px;
  cursor: pointer; transition: all 0.2s;
}
.scene-tags .tag:hover {
  background: #fff; color: #ff6b35;
}

.section { margin: 60px auto; }
.section-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 30px;
}
.section-header h2 { font-size: 26px; color: #333; }
.more-link { color: #ff6b35; font-size: 14px; }

.banner-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
}
.banner-card {
  position: relative; border-radius: 12px; overflow: hidden;
  cursor: pointer; transition: transform 0.2s; height: 200px;
}
.banner-card:hover { transform: translateY(-4px); }
.banner-card img { width: 100%; height: 100%; object-fit: cover; }
.banner-info {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 20px; color: #fff;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
}
.banner-name { font-size: 20px; font-weight: bold; }
.banner-tag { color: #ffd700; font-size: 14px; margin-top: 6px; }

.villa-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
}
.villa-card {
  background: #fff; border-radius: 12px; overflow: hidden;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.villa-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.villa-img-wrap { position: relative; height: 240px; }
.villa-img-wrap img { width: 100%; height: 100%; object-fit: cover; }
.villa-merchant {
  position: absolute; top: 12px; left: 12px;
  background: rgba(255, 107, 53, 0.9); color: #fff;
  padding: 4px 12px; border-radius: 4px; font-size: 12px;
}
.villa-body { padding: 20px; }
.villa-name { font-size: 18px; font-weight: bold; color: #333; }
.villa-address { font-size: 13px; color: #999; margin-top: 8px; }
.villa-tags { margin-top: 12px; display: flex; gap: 8px; }
.villa-tags .tag {
  background: #fff3ed; color: #ff6b35;
  padding: 2px 10px; border-radius: 12px; font-size: 12px;
}
.villa-footer {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 16px; padding-top: 16px; border-top: 1px solid #f5f5f5;
}
.villa-price .price { font-size: 22px; color: #ff6b35; font-weight: bold; }
.villa-price .unit { font-size: 12px; color: #999; margin-left: 4px; }
.villa-guests { font-size: 13px; color: #666; }

.group-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;
}
.group-card {
  background: #fff; border-radius: 12px; overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.group-card img { width: 100%; height: 160px; object-fit: cover; }
.group-body { padding: 16px; }
.group-name {
  font-size: 14px; color: #333;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.group-discount { color: #ff6b35; font-size: 16px; font-weight: bold; margin-top: 6px; }
.group-progress { font-size: 12px; color: #999; margin-top: 4px; }
</style>
