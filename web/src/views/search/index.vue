<template>
  <div class="container search-page">
    <!-- 筛选条件摘要 -->
    <div class="filter-summary" v-if="filterSummary">
      <span class="filter-summary-text">当前筛选：{{ filterSummary }}</span>
      <el-button link type="primary" @click="clearAllFilters">清除筛选</el-button>
    </div>

    <div class="filter-bar">
      <el-input v-model="keyword" placeholder="搜索别墅名、地点..." style="width: 280px;" @keyup.enter="doSearch">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" @click="doSearch">搜索</el-button>
      <el-select v-model="tag" placeholder="场景" clearable style="width: 140px;" @change="doSearch">
        <el-option v-for="t in ['团建', '生日', '聚会', '亲子']" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="guests" placeholder="人数" clearable style="width: 140px;" @change="doSearch">
        <el-option label="5人+" :value="5" />
        <el-option label="10人+" :value="10" />
        <el-option label="15人+" :value="15" />
        <el-option label="20人+" :value="20" />
      </el-select>
      <el-select v-model="sort" placeholder="排序" style="width: 140px;" @change="doSearch">
        <el-option label="综合" value="" />
        <el-option label="价格 ↑" value="price_asc" />
        <el-option label="价格 ↓" value="price_desc" />
      </el-select>
    </div>

    <!-- 扩展筛选条件 -->
    <div class="filter-extra">
      <div class="filter-row">
        <div class="filter-item price-filter">
          <span class="filter-label">价格范围</span>
          <el-slider
            v-model="priceRange"
            range
            :min="0"
            :max="10000"
            :step="100"
            :format-tooltip="(v: number) => `¥${v}`"
            style="flex: 1; margin: 0 16px;"
          />
          <span class="price-text">¥{{ priceRange[0] }} - ¥{{ priceRange[1] }}</span>
          <el-button link type="primary" @click="applyPrice" style="margin-left: 8px;">确定</el-button>
        </div>
        <div class="filter-item">
          <span class="filter-label">房间数</span>
          <el-select v-model="bedrooms" placeholder="不限" clearable style="width: 120px;" @change="doSearch">
            <el-option label="1间+" :value="1" />
            <el-option label="2间+" :value="2" />
            <el-option label="3间+" :value="3" />
            <el-option label="4间+" :value="4" />
            <el-option label="5间+" :value="5" />
          </el-select>
        </div>
      </div>
      <div class="filter-row" v-if="allFacilities.length">
        <span class="filter-label">设施</span>
        <div class="facility-tags">
          <span
            v-for="f in allFacilities"
            :key="f.id"
            :class="['facility-tag', { active: selectedFacilities.includes(f.id) }]"
            @click="toggleFacility(f.id)"
          >
            <span v-if="f.icon" class="facility-icon">{{ f.icon }}</span>
            {{ f.name }}
          </span>
        </div>
      </div>
    </div>

    <div class="villa-list" v-if="list.length">
      <div class="villa-card" v-for="v in list" :key="v.id" @click="goDetail(v.id)">
        <img :src="resolveImg(v.coverImage) || '/vite.svg'" />
        <div class="villa-info">
          <div class="villa-name">{{ v.name }}</div>
          <div class="villa-meta">{{ v.maxGuests }}人 · {{ v.bedrooms }}卧 · {{ v.area }}㎡</div>
          <div class="villa-address">📍 {{ v.address }}</div>
          <div class="villa-tags">
            <span class="tag" v-for="t in (v.tags || '').split(',').filter(Boolean)" :key="t">{{ t }}</span>
          </div>
          <div class="villa-rating" v-if="v.ratingAvg">
            <span class="rating-star">★</span>
            <span class="rating-val">{{ v.ratingAvg }}</span>
            <span class="rating-cnt">({{ v.ratingCount }}条评价)</span>
          </div>
        </div>
        <div class="villa-price-block">
          <div class="price">¥{{ v.basePrice }}</div>
          <div class="price-unit">起/晚</div>
          <el-button type="primary">查看详情</el-button>
        </div>
      </div>
    </div>

    <!-- W-07: 搜索无结果引导 -->
    <div class="empty-guide" v-else>
      <el-empty description="暂无符合条件的别墅">
        <template #default>
          <div class="empty-tips">
            <p class="empty-title">没有找到匹配的别墅，试试以下调整：</p>
            <ul class="tip-list">
              <li v-if="keyword">移除关键词 "<b>{{ keyword }}</b>"</li>
              <li v-if="priceApplied">扩大价格范围或取消价格筛选</li>
              <li v-if="bedrooms">减少房间数要求</li>
              <li v-if="guests">降低入住人数要求</li>
              <li v-if="selectedFacilities.length">减少设施筛选条件</li>
              <li v-if="tag">尝试其他场景标签</li>
              <li v-if="!hasAnyFilter">暂时没有上架的别墅，请稍后再来</li>
            </ul>
            <el-button v-if="hasAnyFilter" type="primary" @click="clearAllFilters">清除所有筛选</el-button>
          </div>
        </template>
      </el-empty>
    </div>

    <el-pagination
      v-if="total > pageSize"
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="prev, pager, next"
      @current-change="loadData"
      style="justify-content: center; margin-top: 40px;"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Search } from '@element-plus/icons-vue';
import { listVillas, listFacilities } from '../../api/villa';
import { thumbUrl } from '../../utils/request';

const route = useRoute();
const router = useRouter();
const keyword = ref('');
const tag = ref('');
const guests = ref<number | null>(null);
const bedrooms = ref<number | null>(null);
const sort = ref('');
const priceRange = ref([0, 10000]);
const priceApplied = ref(false);
const selectedFacilities = ref<number[]>([]);
const allFacilities = ref<any[]>([]);
const list = ref<any[]>([]);
const page = ref(1);
const pageSize = 10;
const total = ref(0);
const resolveImg = thumbUrl;

const hasAnyFilter = computed(() => {
  return !!(keyword.value || tag.value || guests.value || bedrooms.value || priceApplied.value || selectedFacilities.value.length);
});

const filterSummary = computed(() => {
  const parts: string[] = [];
  if (tag.value) parts.push(tag.value);
  if (keyword.value) parts.push(`"${keyword.value}"`);
  if (guests.value) parts.push(`${guests.value}人+`);
  if (bedrooms.value) parts.push(`${bedrooms.value}间房+`);
  if (priceApplied.value) parts.push(`¥${priceRange.value[0]}-¥${priceRange.value[1]}`);
  if (selectedFacilities.value.length) {
    const names = allFacilities.value
      .filter((f: any) => selectedFacilities.value.includes(f.id))
      .map((f: any) => f.name);
    if (names.length) parts.push(names.join('、'));
  }
  return parts.length ? parts.join(' / ') : '';
});

onMounted(async () => {
  if (route.query.tag) tag.value = route.query.tag as string;
  if (route.query.keyword) keyword.value = route.query.keyword as string;
  // 加载设施列表
  try {
    const res = await listFacilities();
    allFacilities.value = Array.isArray(res)
      ? res.map((f: any) => ({ ...f, id: Number(f.id) }))
      : [];
  } catch { /* ignore */ }
  loadData();
});

function doSearch() {
  page.value = 1;
  loadData();
}

function applyPrice() {
  priceApplied.value = true;
  doSearch();
}

function toggleFacility(id: number) {
  const idx = selectedFacilities.value.indexOf(id);
  if (idx >= 0) {
    selectedFacilities.value.splice(idx, 1);
  } else {
    selectedFacilities.value.push(id);
  }
  doSearch();
}

function clearAllFilters() {
  keyword.value = '';
  tag.value = '';
  guests.value = null;
  bedrooms.value = null;
  sort.value = '';
  priceRange.value = [0, 10000];
  priceApplied.value = false;
  selectedFacilities.value = [];
  doSearch();
}

async function loadData() {
  const params: any = { page: page.value, pageSize };
  if (keyword.value) params.keyword = keyword.value;
  if (tag.value) params.tag = tag.value;
  if (guests.value) params.guests = guests.value;
  if (bedrooms.value) params.bedrooms = bedrooms.value;
  if (sort.value) params.sort = sort.value;
  if (priceApplied.value) {
    params.min_price = priceRange.value[0];
    params.max_price = priceRange.value[1];
  }
  if (selectedFacilities.value.length) {
    params.facilities = selectedFacilities.value.join(',');
  }
  const res: any = await listVillas(params);
  list.value = res.list || [];
  total.value = res.total || 0;
}

function goDetail(id: number) {
  router.push(`/villa/${id}`);
}
</script>

<style scoped>
.search-page { padding: 30px 0; }
.filter-summary {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px; margin-bottom: 12px;
  background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px;
}
.filter-summary-text {
  font-size: 14px; color: #c2410c; font-weight: 500;
}
.filter-bar {
  display: flex; gap: 16px; padding: 24px;
  background: #fff; border-radius: 12px 12px 0 0; border-bottom: 1px solid #f0f0f0;
}

.filter-extra {
  background: #fff; border-radius: 0 0 12px 12px; padding: 20px 24px;
  margin-bottom: 24px;
}
.filter-row {
  display: flex; align-items: center; gap: 24px;
  padding: 8px 0;
}
.filter-row + .filter-row { border-top: 1px solid #f5f5f5; padding-top: 16px; margin-top: 8px; }
.filter-label {
  font-size: 13px; color: #666; white-space: nowrap; font-weight: 500;
}
.filter-item {
  display: flex; align-items: center; gap: 8px;
}
.price-filter { flex: 1; }
.price-text { font-size: 13px; color: #ff6b35; white-space: nowrap; font-weight: 500; }

.facility-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.facility-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 6px 14px; border-radius: 16px; font-size: 13px;
  background: #f5f5f5; color: #666; cursor: pointer;
  transition: all 0.2s; border: 1px solid transparent;
}
.facility-tag:hover { border-color: #ff6b35; color: #ff6b35; }
.facility-tag.active { background: #fff3ed; color: #ff6b35; border-color: #ff6b35; }
.facility-icon { font-size: 14px; }

.villa-list { display: flex; flex-direction: column; gap: 20px; }
.villa-card {
  display: flex; gap: 24px; background: #fff;
  border-radius: 12px; padding: 20px; cursor: pointer;
  transition: all 0.2s;
}
.villa-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
.villa-card img {
  width: 280px; height: 200px; object-fit: cover;
  border-radius: 8px; flex-shrink: 0;
}
.villa-info { flex: 1; }
.villa-name { font-size: 22px; font-weight: bold; color: #333; }
.villa-meta { font-size: 14px; color: #666; margin-top: 8px; }
.villa-address { font-size: 14px; color: #999; margin-top: 6px; }
.villa-tags { display: flex; gap: 8px; margin-top: 16px; }
.villa-tags .tag {
  background: #fff3ed; color: #ff6b35;
  padding: 4px 12px; border-radius: 12px; font-size: 12px;
}
.villa-rating { display: flex; align-items: center; gap: 4px; margin-top: 12px; }
.rating-star { color: #f59e0b; font-size: 15px; }
.rating-val { font-size: 15px; font-weight: 700; color: #f59e0b; }
.rating-cnt { font-size: 13px; color: #94a3b8; }

.villa-price-block {
  display: flex; flex-direction: column; justify-content: center;
  align-items: flex-end; gap: 8px; padding-left: 24px;
  border-left: 1px solid #f5f5f5;
}
.price { font-size: 32px; color: #ff6b35; font-weight: bold; }
.price-unit { font-size: 13px; color: #999; margin-bottom: 16px; }

/* W-07: 空结果引导 */
.empty-guide { padding: 40px 0; }
.empty-tips { text-align: left; max-width: 400px; margin: 0 auto; }
.empty-title { font-size: 15px; color: #333; font-weight: 600; margin-bottom: 12px; }
.tip-list { list-style: disc; padding-left: 20px; margin-bottom: 20px; }
.tip-list li { font-size: 14px; color: #666; line-height: 2; }
.tip-list b { color: #ff6b35; }

/* W-15: 移动端筛选栏响应式 */
@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column; gap: 12px; padding: 16px;
  }
  .filter-bar .el-input, .filter-bar .el-select {
    width: 100% !important;
  }
  .filter-extra { padding: 16px; }
  .filter-row {
    flex-direction: column; align-items: stretch; gap: 12px;
  }
  .filter-item { flex-direction: column; align-items: stretch; }
  .price-filter { flex-direction: column; align-items: stretch; }
  .price-filter .el-slider { margin: 8px 0 !important; }
  .facility-tags { gap: 6px; }
  .facility-tag { padding: 5px 10px; font-size: 12px; }

  .villa-card {
    flex-direction: column; gap: 12px; padding: 16px;
  }
  .villa-card img {
    width: 100%; height: 180px;
  }
  .villa-price-block {
    flex-direction: row; align-items: center; justify-content: space-between;
    padding-left: 0; border-left: none; border-top: 1px solid #f5f5f5; padding-top: 12px;
  }
  .price { font-size: 24px; }
}
</style>
