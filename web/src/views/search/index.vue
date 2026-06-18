<template>
  <div class="container search-page">
    <!-- 筛选条件摘要 -->
    <div class="filter-summary" v-if="filterSummary">
      <span class="filter-summary-text">当前筛选：{{ filterSummary }}</span>
      <el-button link type="primary" @click="clearAllFilters">清除筛选</el-button>
    </div>

    <div class="recommend-card" v-if="fromQuickMatch || hasAnyFilter">
      <div>
        <div class="recommend-title">不会选？让管家按需求推荐</div>
        <div class="recommend-sub">{{ consultText }}</div>
      </div>
      <div class="recommend-actions">
        <button class="recommend-btn secondary" @click="copyWechatId">复制微信号</button>
        <button class="recommend-btn" @click="copyConsultText">复制咨询话术</button>
      </div>
    </div>

    <!-- 移动端快捷筛选入口 -->
    <div class="mobile-filter-entry">
      <div class="mobile-search-line">
        <el-input v-model="keyword" placeholder="搜索别墅名、地点..." @keyup.enter="doSearch">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <button class="mobile-filter-btn" @click="showMobileFilter = true">
          筛选<span v-if="activeFilterCount"> {{ activeFilterCount }}</span>
        </button>
      </div>
      <div class="mobile-scene-scroll">
        <span
          v-for="t in sceneOptions"
          :key="t"
          :class="['mobile-scene-chip', { active: tag === t }]"
          @click="quickScene(t)"
        >{{ t }}</span>
      </div>
    </div>

    <div class="filter-bar">
      <el-input v-model="keyword" placeholder="搜索别墅名、地点..." style="width: 280px;" @keyup.enter="doSearch">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" @click="doSearch">搜索</el-button>
      <el-select v-model="tag" placeholder="场景" clearable style="width: 140px;" @change="doSearch">
        <el-option v-for="t in sceneOptions" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="guests" placeholder="人数" clearable style="width: 140px;" @change="doSearch">
        <el-option label="5人+" :value="5" />
        <el-option label="10人+" :value="10" />
        <el-option label="15人+" :value="15" />
        <el-option label="20人+" :value="20" />
      </el-select>
      <input v-model="checkIn" type="date" class="date-filter-input" @change="doSearch" />
      <el-select v-model="sort" placeholder="排序" style="width: 140px;" @change="doSearch">
        <el-option label="综合" value="" />
        <el-option label="价格 ↑" value="price_asc" />
        <el-option label="价格 ↓" value="price_desc" />
      </el-select>
    </div>

    <!-- 扩展筛选条件 -->
    <div class="filter-extra">
      <div class="filter-row">
        <div class="filter-item per-budget-filter">
          <span class="filter-label">人均预算</span>
          <div class="per-budget-tags">
            <span
              v-for="b in perBudgetOptions"
              :key="b"
              :class="{ active: perBudget === b }"
              @click="selectPerBudget(b)"
            >¥{{ b }}内</span>
          </div>
          <span class="budget-hint">{{ budgetHint }}</span>
        </div>
      </div>
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

    <!-- 移动端筛选抽屉 -->
    <div class="mobile-filter-mask" v-if="showMobileFilter" @click.self="showMobileFilter = false">
      <div class="mobile-filter-drawer">
        <div class="mobile-filter-header">
          <div>
            <div class="mobile-filter-title">筛选别墅</div>
            <div class="mobile-filter-sub">按场景、人数、预算快速缩小范围</div>
          </div>
          <button class="mobile-filter-close" @click="showMobileFilter = false">×</button>
        </div>

        <div class="mobile-filter-body">
          <div class="mobile-filter-section">
            <div class="mobile-filter-label">场景</div>
            <div class="mobile-chip-group">
              <span
                v-for="t in sceneOptions"
                :key="t"
                :class="['mobile-chip', { active: tag === t }]"
                @click="tag = tag === t ? '' : t"
              >{{ t }}</span>
            </div>
          </div>

          <div class="mobile-filter-section">
            <div class="mobile-filter-label">人数</div>
            <div class="mobile-chip-group">
              <span
                v-for="g in guestOptions"
                :key="g"
                :class="['mobile-chip', { active: guests === g }]"
                @click="selectGuests(g, false)"
              >{{ g }}人+</span>
            </div>
          </div>

          <div class="mobile-filter-section">
            <div class="mobile-filter-label">入住日期</div>
            <input v-model="checkIn" type="date" class="mobile-date-input" />
          </div>

          <div class="mobile-filter-section">
            <div class="mobile-filter-label">人均预算</div>
            <div class="mobile-chip-group">
              <span
                v-for="b in perBudgetOptions"
                :key="b"
                :class="['mobile-chip', { active: perBudget === b }]"
                @click="selectPerBudget(b, false)"
              >¥{{ b }}内</span>
            </div>
            <div class="mobile-budget-hint">{{ budgetHint }}</div>
          </div>

          <div class="mobile-filter-section">
            <div class="mobile-filter-label">预算</div>
            <div class="mobile-price-range">
              <el-slider
                v-model="priceRange"
                range
                :min="0"
                :max="10000"
                :step="100"
                :format-tooltip="(v: number) => `¥${v}`"
              />
              <div class="mobile-price-text">¥{{ priceRange[0] }} - ¥{{ priceRange[1] }}</div>
            </div>
          </div>

          <div class="mobile-filter-section">
            <div class="mobile-filter-label">房间数</div>
            <div class="mobile-chip-group">
              <span
                v-for="b in bedroomOptions"
                :key="b"
                :class="['mobile-chip', { active: bedrooms === b }]"
                @click="bedrooms = bedrooms === b ? null : b"
              >{{ b }}间+</span>
            </div>
          </div>

          <div class="mobile-filter-section">
            <div class="mobile-filter-label">排序</div>
            <div class="mobile-chip-group">
              <span
                v-for="s in sortOptions"
                :key="s.value"
                :class="['mobile-chip', { active: sort === s.value }]"
                @click="sort = s.value"
              >{{ s.label }}</span>
            </div>
          </div>

          <div class="mobile-filter-section" v-if="allFacilities.length">
            <div class="mobile-filter-label">设施</div>
            <div class="mobile-chip-group">
              <span
                v-for="f in allFacilities"
                :key="f.id"
                :class="['mobile-chip', { active: selectedFacilities.includes(f.id) }]"
                @click="toggleFacility(f.id, false)"
              >
                <span v-if="f.icon">{{ f.icon }}</span>{{ f.name }}
              </span>
            </div>
          </div>
        </div>

        <div class="mobile-filter-footer">
          <button class="mobile-reset-btn" @click="clearAllFilters">重置</button>
          <button class="mobile-apply-btn" @click="applyMobileFilters">查看结果</button>
        </div>
      </div>
    </div>

    <div class="villa-list" v-if="loading">
      <div class="villa-card villa-card-skeleton" v-for="n in 4" :key="n">
        <div class="skeleton-img"></div>
        <div class="villa-info">
          <div class="skeleton-line title"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-tags">
            <span></span><span></span><span></span>
          </div>
        </div>
        <div class="villa-price-block">
          <div class="skeleton-line price-line"></div>
          <div class="skeleton-button"></div>
        </div>
      </div>
    </div>

    <div class="villa-list" v-else-if="list.length">
      <div class="villa-card" v-for="v in list" :key="v.id" @click="goDetail(v.id)">
        <img :src="resolveImg(v.coverImage) || '/vite.svg'" />
        <div class="villa-info">
          <div class="villa-name">{{ v.name }}</div>
          <div class="villa-meta">{{ v.maxGuests }}人 · {{ v.bedrooms }}卧 · {{ v.area }}㎡</div>
          <div class="villa-address">📍 {{ v.address }}</div>
          <div class="villa-fit-reason">{{ villaFitReason(v) }}</div>
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
          <div class="per-price">约 ¥{{ perPersonPrice(v) }}/人</div>
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
      v-if="!loading && total > pageSize"
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
import { ElMessage } from 'element-plus';
import { listVillas, listFacilities } from '../../api/villa';
import { thumbUrl } from '../../utils/request';
import { trackEvent } from '../../utils/tracker';

const route = useRoute();
const router = useRouter();
const keyword = ref('');
const tag = ref('');
const guests = ref<number | null>(null);
const bedrooms = ref<number | null>(null);
const sort = ref('');
const perBudget = ref<number | null>(null);
const checkIn = ref('');
const showMobileFilter = ref(false);
const priceRange = ref([0, 10000]);
const priceApplied = ref(false);
const selectedFacilities = ref<number[]>([]);
const allFacilities = ref<any[]>([]);
const list = ref<any[]>([]);
const loading = ref(true);
const page = ref(1);
const pageSize = 10;
const total = ref(0);
const resolveImg = thumbUrl;
const sceneOptions = ['团建', '生日', '聚会', '亲子', '泳池', 'KTV'];
const guestOptions = [5, 10, 15, 20, 30];
const bedroomOptions = [1, 2, 3, 4, 5];
const perBudgetOptions = [200, 300, 500];
const sortOptions = [
  { label: '综合', value: '' },
  { label: '价格低到高', value: 'price_asc' },
  { label: '价格高到低', value: 'price_desc' },
];

const hasAnyFilter = computed(() => {
  return !!(keyword.value || tag.value || guests.value || bedrooms.value || priceApplied.value || perBudget.value || checkIn.value || selectedFacilities.value.length);
});

const fromQuickMatch = computed(() => {
  return !!(perBudget.value || checkIn.value || (route.query.source === 'quick_match' && hasAnyFilter.value));
});

const consultText = computed(() => {
  const parts = ['你好，我想找一栋别墅'];
  if (checkIn.value) parts.push(`${checkIn.value}入住`);
  if (guests.value) parts.push(`${guests.value}人左右`);
  if (tag.value) parts.push(`适合${tag.value}`);
  if (perBudget.value) parts.push(`人均预算${perBudget.value}元内`);
  if (keyword.value) parts.push(`关键词：${keyword.value}`);
  return parts.join('，') + '，麻烦帮我推荐几套合适的。';
});

const budgetEstimateGuests = computed(() => guests.value || 10);
const budgetHint = computed(() => {
  if (!perBudget.value) return '选择后按人数换算总价';
  return `按${budgetEstimateGuests.value}人估算，总价≤¥${budgetEstimateGuests.value * perBudget.value}`;
});

const filterSummary = computed(() => {
  const parts: string[] = [];
  if (tag.value) parts.push(tag.value);
  if (keyword.value) parts.push(`"${keyword.value}"`);
  if (guests.value) parts.push(`${guests.value}人+`);
  if (bedrooms.value) parts.push(`${bedrooms.value}间房+`);
  if (perBudget.value) parts.push(`人均¥${perBudget.value}内`);
  else if (priceApplied.value) parts.push(`¥${priceRange.value[0]}-¥${priceRange.value[1]}`);
  if (checkIn.value) parts.push(`${checkIn.value}入住`);
  if (selectedFacilities.value.length) {
    const names = allFacilities.value
      .filter((f: any) => selectedFacilities.value.includes(f.id))
      .map((f: any) => f.name);
    if (names.length) parts.push(names.join('、'));
  }
  return parts.length ? parts.join(' / ') : '';
});

const activeFilterCount = computed(() => {
  let count = 0;
  if (tag.value) count++;
  if (guests.value) count++;
  if (bedrooms.value) count++;
  if (sort.value) count++;
  if (perBudget.value) count++;
  if (checkIn.value) count++;
  if (!perBudget.value && priceApplied.value) count++;
  if (selectedFacilities.value.length) count++;
  return count;
});

onMounted(async () => {
  if (route.query.tag) tag.value = route.query.tag as string;
  if (route.query.keyword) keyword.value = route.query.keyword as string;
  if (route.query.guests) guests.value = Number(route.query.guests);
  if (route.query.per_budget) perBudget.value = Number(route.query.per_budget);
  if (route.query.check_in) checkIn.value = route.query.check_in as string;
  if (route.query.max_price) {
    priceRange.value = [0, Number(route.query.max_price)];
    priceApplied.value = true;
  }
  if (perBudget.value && !route.query.max_price) syncBudgetToPrice();
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
  if (perBudget.value) syncBudgetToPrice();
  loadData();
}

function applyPrice() {
  perBudget.value = null;
  priceApplied.value = true;
  doSearch();
}

function syncBudgetToPrice() {
  if (!perBudget.value) return;
  priceRange.value = [0, budgetEstimateGuests.value * perBudget.value];
  priceApplied.value = true;
}

function selectGuests(value: number, autoSearch = true) {
  guests.value = guests.value === value ? null : value;
  if (perBudget.value) syncBudgetToPrice();
  if (autoSearch) doSearch();
}

function selectPerBudget(value: number, autoSearch = true) {
  perBudget.value = perBudget.value === value ? null : value;
  if (perBudget.value) {
    syncBudgetToPrice();
  } else {
    priceRange.value = [0, 10000];
    priceApplied.value = false;
  }
  if (autoSearch) doSearch();
}

function toggleFacility(id: number, autoSearch = true) {
  const idx = selectedFacilities.value.indexOf(id);
  if (idx >= 0) {
    selectedFacilities.value.splice(idx, 1);
  } else {
    selectedFacilities.value.push(id);
  }
  if (autoSearch) doSearch();
}

function clearAllFilters() {
  keyword.value = '';
  tag.value = '';
  guests.value = null;
  bedrooms.value = null;
  sort.value = '';
  perBudget.value = null;
  checkIn.value = '';
  priceRange.value = [0, 10000];
  priceApplied.value = false;
  selectedFacilities.value = [];
  showMobileFilter.value = false;
  doSearch();
}

function quickScene(scene: string) {
  tag.value = tag.value === scene ? '' : scene;
  doSearch();
}

function applyMobileFilters() {
  if (perBudget.value) syncBudgetToPrice();
  else priceApplied.value = priceRange.value[0] !== 0 || priceRange.value[1] !== 10000;
  showMobileFilter.value = false;
  doSearch();
}

async function loadData() {
  loading.value = true;
  const params: any = { page: page.value, pageSize };
  if (keyword.value) params.keyword = keyword.value;
  if (tag.value) params.tag = tag.value;
  if (checkIn.value) params.check_in = checkIn.value;
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
  try {
    const res: any = await listVillas(params);
    list.value = res.list || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}

function goDetail(id: number) {
  const query: any = {};
  if (tag.value) query.scene = tag.value;
  if (guests.value) query.guests = guests.value;
  if (perBudget.value) query.per_budget = perBudget.value;
  if (checkIn.value) query.check_in = checkIn.value;
  router.push({ path: `/villa/${id}`, query });
}

function perPersonPrice(v: any) {
  const divisor = guests.value || v.maxGuests || 1;
  return Math.max(1, Math.ceil(Number(v.basePrice || 0) / Math.max(Number(divisor), 1)));
}

function villaFitReason(v: any) {
  const facilities = (v.facilities || []).map((f: any) => f.name).filter(Boolean);
  if (tag.value && (v.tags || '').includes(tag.value)) return `适合${tag.value}：场景标签匹配`;
  if (facilities.includes('KTV')) return '适合聚会：自带 KTV，晚上也能玩';
  if (facilities.includes('泳池') || facilities.includes('私人泳池')) return '适合拍照：带泳池，氛围感更强';
  if (facilities.includes('BBQ') || facilities.includes('烧烤')) return '适合团建：可安排户外 BBQ';
  if (v.maxGuests >= 20) return '适合多人：空间容量更充裕';
  return '管家推荐：设施和预算更均衡';
}

async function copyConsultText() {
  const text = consultText.value + ' 微信号：villa_service';
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text).catch(() => {});
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  trackEvent('wechat_copy', { metadata: { page: 'search', source: 'recommend_card', text: consultText.value } });
  ElMessage.success('咨询话术已复制');
}

async function copyWechatId() {
  const wechat = 'villa_service';
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(wechat).catch(() => {});
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
  trackEvent('wechat_copy', { metadata: { page: 'search', source: 'recommend_wechat_id' } });
  ElMessage.success('微信号已复制');
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
.recommend-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  margin-bottom: 16px;
  border-radius: 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}
.recommend-title {
  color: #166534;
  font-size: 16px;
  font-weight: 800;
}
.recommend-sub {
  margin-top: 4px;
  color: #4b5563;
  font-size: 13px;
  line-height: 1.5;
}
.recommend-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.recommend-btn {
  flex-shrink: 0;
  height: 38px;
  padding: 0 18px;
  border: none;
  border-radius: 20px;
  color: #fff;
  background: #16a34a;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}
.recommend-btn.secondary {
  color: #16a34a;
  background: #fff;
  border: 1px solid #bbf7d0;
}
.mobile-filter-entry { display: none; }
.filter-bar {
  display: flex; gap: 16px; padding: 24px;
  background: #fff; border-radius: 12px 12px 0 0; border-bottom: 1px solid #f0f0f0;
}
.date-filter-input {
  width: 150px;
  height: 32px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 0 10px;
  color: #606266;
  background: #fff;
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
.per-budget-filter {
  flex-wrap: wrap;
  flex: 1;
}
.per-budget-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.per-budget-tags span {
  padding: 6px 14px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.per-budget-tags span.active {
  color: #ff6b35;
  border-color: #ff6b35;
  background: #fff3ed;
}
.budget-hint {
  color: #94a3b8;
  font-size: 12px;
}

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
.villa-card-skeleton {
  cursor: default;
  pointer-events: none;
}
.villa-card-skeleton:hover {
  box-shadow: none;
}
.skeleton-img,
.skeleton-line,
.skeleton-tags span,
.skeleton-button {
  position: relative;
  overflow: hidden;
  background: #eef2f7;
}
.skeleton-img::after,
.skeleton-line::after,
.skeleton-tags span::after,
.skeleton-button::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent);
  animation: skeleton-shimmer 1.3s infinite;
}
.skeleton-img {
  width: 280px;
  height: 200px;
  border-radius: 8px;
  flex-shrink: 0;
}
.skeleton-line {
  height: 12px;
  border-radius: 999px;
}
.skeleton-line.title {
  width: 58%;
  height: 22px;
  margin-bottom: 16px;
}
.skeleton-line.medium {
  width: 72%;
  margin-bottom: 12px;
}
.skeleton-line.short {
  width: 46%;
  margin-bottom: 18px;
}
.skeleton-tags {
  display: flex;
  gap: 8px;
}
.skeleton-tags span {
  width: 64px;
  height: 24px;
  border-radius: 12px;
}
.skeleton-line.price-line {
  width: 86px;
  height: 28px;
}
.skeleton-button {
  width: 96px;
  height: 36px;
  border-radius: 18px;
}
@keyframes skeleton-shimmer {
  100% { transform: translateX(100%); }
}
.villa-info { flex: 1; }
.villa-name { font-size: 22px; font-weight: bold; color: #333; }
.villa-meta { font-size: 14px; color: #666; margin-top: 8px; }
.villa-address { font-size: 14px; color: #999; margin-top: 6px; }
.villa-fit-reason {
  display: inline-flex;
  margin-top: 10px;
  padding: 5px 10px;
  border-radius: 14px;
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}
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
.per-price {
  margin-bottom: 8px;
  color: #16a34a;
  font-size: 13px;
  font-weight: 800;
}

/* W-07: 空结果引导 */
.empty-guide { padding: 40px 0; }
.empty-tips { text-align: left; max-width: 400px; margin: 0 auto; }
.empty-title { font-size: 15px; color: #333; font-weight: 600; margin-bottom: 12px; }
.tip-list { list-style: disc; padding-left: 20px; margin-bottom: 20px; }
.tip-list li { font-size: 14px; color: #666; line-height: 2; }
.tip-list b { color: #ff6b35; }

.mobile-filter-mask {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: none;
  align-items: flex-end;
  background: rgba(15,23,42,0.45);
}
.mobile-filter-drawer {
  position: relative;
  width: 100%;
  max-height: 86vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 18px 18px 0 0;
  box-shadow: 0 -8px 30px rgba(15,23,42,0.18);
}
.mobile-filter-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 12px;
  border-bottom: 1px solid #f1f5f9;
}
.mobile-filter-title {
  color: #1e293b;
  font-size: 18px;
  font-weight: 800;
}
.mobile-filter-sub {
  margin-top: 4px;
  color: #94a3b8;
  font-size: 12px;
}
.mobile-filter-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  font-size: 22px;
  line-height: 1;
}
.mobile-filter-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 18px 100px;
}
.mobile-filter-section {
  padding: 16px 0;
  border-bottom: 1px solid #f8fafc;
}
.mobile-filter-label {
  margin-bottom: 10px;
  color: #334155;
  font-size: 14px;
  font-weight: 700;
}
.mobile-chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.mobile-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: 18px;
  background: #f8fafc;
  color: #475569;
  font-size: 13px;
  border: 1px solid #e2e8f0;
}
.mobile-chip.active {
  background: #fff3ed;
  color: #ff6b35;
  border-color: #ff6b35;
  font-weight: 700;
}
.mobile-price-range {
  padding: 0 4px;
}
.mobile-date-input {
  width: 100%;
  height: 42px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0 12px;
  color: #334155;
  background: #fff;
  font-size: 14px;
}
.mobile-price-text {
  color: #ff6b35;
  font-size: 13px;
  font-weight: 700;
  text-align: right;
}
.mobile-budget-hint {
  margin-top: 8px;
  color: #94a3b8;
  font-size: 12px;
}
.mobile-filter-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 10px;
  padding: 12px 18px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4px 14px rgba(15,23,42,0.08);
}
.mobile-reset-btn,
.mobile-apply-btn {
  height: 44px;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 700;
}
.mobile-reset-btn {
  flex: 1;
  border: 1px solid #e2e8f0;
  color: #64748b;
  background: #fff;
}
.mobile-apply-btn {
  flex: 2;
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #ff6b35, #ff4500);
}

/* W-15: 移动端筛选栏响应式 */
@media (max-width: 768px) {
  .search-page {
    padding: 12px 0 40px;
  }
  .filter-summary {
    margin: 0 12px 12px;
    padding: 10px 12px;
    border-radius: 10px;
  }
  .recommend-card {
    display: block;
    margin: 0 12px 12px;
    padding: 14px;
    border-radius: 10px;
  }
  .recommend-title {
    font-size: 15px;
  }
  .recommend-sub {
    font-size: 12px;
  }
  .recommend-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 10px;
  }
  .recommend-btn {
    width: 100%;
  }
  .mobile-filter-entry {
    display: block;
    margin: 0 12px 12px;
  }
  .mobile-search-line {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .mobile-filter-btn {
    flex-shrink: 0;
    height: 40px;
    padding: 0 16px;
    border: none;
    border-radius: 20px;
    color: #fff;
    background: linear-gradient(135deg, #ff6b35, #ff4500);
    font-size: 14px;
    font-weight: 700;
  }
  .mobile-scene-scroll {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    margin-top: 10px;
    padding-bottom: 2px;
  }
  .mobile-scene-chip {
    flex-shrink: 0;
    padding: 7px 14px;
    border-radius: 18px;
    background: #fff;
    color: #64748b;
    font-size: 13px;
    border: 1px solid #e2e8f0;
  }
  .mobile-scene-chip.active {
    color: #ff6b35;
    background: #fff3ed;
    border-color: #ff6b35;
    font-weight: 700;
  }
  .filter-bar {
    display: none;
  }
  .filter-extra { display: none; }
  .mobile-filter-mask { display: flex; }

  .villa-list {
    gap: 12px;
    padding: 0 12px;
  }
  .villa-card {
    flex-direction: column; gap: 12px; padding: 16px;
    border-radius: 10px;
  }
  .villa-card img {
    width: 100%; height: 180px;
  }
  .skeleton-img {
    width: 100%;
    height: 180px;
  }
  .skeleton-line.title {
    width: 76%;
    height: 18px;
  }
  .skeleton-line.price-line {
    width: 74px;
    height: 24px;
  }
  .villa-name {
    font-size: 18px;
  }
  .villa-tags {
    flex-wrap: nowrap;
    overflow-x: auto;
    margin-top: 12px;
  }
  .villa-price-block {
    flex-direction: row; align-items: center; justify-content: space-between;
    padding-left: 0; border-left: none; border-top: 1px solid #f5f5f5; padding-top: 12px;
  }
  .price { font-size: 24px; }
  .price-unit { margin-bottom: 0; }
  .per-price { margin-bottom: 0; }
}
</style>
