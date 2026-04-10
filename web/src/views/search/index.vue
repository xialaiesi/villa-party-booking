<template>
  <div class="container search-page">
    <div class="filter-bar">
      <el-input v-model="keyword" placeholder="搜索别墅名" style="width: 280px;" @keyup.enter="loadData" />
      <el-select v-model="tag" placeholder="场景" clearable style="width: 140px;" @change="loadData">
        <el-option v-for="t in ['团建', '生日', '聚会', '亲子']" :key="t" :label="t" :value="t" />
      </el-select>
      <el-select v-model="guests" placeholder="人数" clearable style="width: 140px;" @change="loadData">
        <el-option label="5人+" :value="5" />
        <el-option label="10人+" :value="10" />
        <el-option label="15人+" :value="15" />
        <el-option label="20人+" :value="20" />
      </el-select>
      <el-select v-model="sort" placeholder="排序" style="width: 140px;" @change="loadData">
        <el-option label="综合" value="" />
        <el-option label="价格 ↑" value="price_asc" />
        <el-option label="价格 ↓" value="price_desc" />
      </el-select>
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
        </div>
        <div class="villa-price-block">
          <div class="price">¥{{ v.basePrice }}</div>
          <div class="price-unit">起/晚</div>
          <el-button type="primary">查看详情</el-button>
        </div>
      </div>
    </div>

    <el-empty v-else description="暂无符合条件的别墅" />

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
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { listVillas } from '../../api/villa';
import { thumbUrl } from '../../utils/request';

const route = useRoute();
const router = useRouter();
const keyword = ref('');
const tag = ref('');
const guests = ref<number | null>(null);
const sort = ref('');
const list = ref<any[]>([]);
const page = ref(1);
const pageSize = 10;
const total = ref(0);
const resolveImg = thumbUrl;

onMounted(() => {
  if (route.query.tag) tag.value = route.query.tag as string;
  if (route.query.keyword) keyword.value = route.query.keyword as string;
  loadData();
});

async function loadData() {
  const params: any = { page: page.value, pageSize };
  if (tag.value) params.tag = tag.value;
  if (guests.value) params.guests = guests.value;
  if (sort.value) params.sort = sort.value;
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
.filter-bar {
  display: flex; gap: 16px; padding: 24px;
  background: #fff; border-radius: 12px; margin-bottom: 24px;
}

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
.villa-price-block {
  display: flex; flex-direction: column; justify-content: center;
  align-items: flex-end; gap: 8px; padding-left: 24px;
  border-left: 1px solid #f5f5f5;
}
.price { font-size: 32px; color: #ff6b35; font-weight: bold; }
.price-unit { font-size: 13px; color: #999; margin-bottom: 16px; }
</style>
