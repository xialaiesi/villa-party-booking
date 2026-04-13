<template>
  <div class="container order-page">
    <h2 class="page-title">我的订单</h2>

    <el-tabs v-model="activeTab" @tab-change="loadData">
      <el-tab-pane label="全部" name="" />
      <el-tab-pane label="待付定金" name="0" />
      <el-tab-pane label="进行中" name="ongoing" />
      <el-tab-pane label="已完成" name="5" />
    </el-tabs>

    <div v-if="orders.length" class="order-list">
      <div class="order-card" v-for="o in orders" :key="o.id" @click="goDetail(o.id)">
        <div class="order-header">
          <span class="order-no">订单号：{{ o.orderNo }}
            <span class="copy-btn" @click.stop="copyOrderNo(o.orderNo)" title="复制订单号">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </span>
          </span>
          <div class="order-tags">
            <el-tag v-if="o.status === 5 && !reviewStatusMap[o.id]" type="warning" size="small" class="review-tag">待评价</el-tag>
            <el-tag :type="statusType(o.status)">{{ statusText(o.status) }}</el-tag>
          </div>
        </div>
        <div class="order-body">
          <img :src="resolveImg(o.villa?.coverImage)" />
          <div class="order-info">
            <div class="villa-name">{{ o.villa?.name }}</div>
            <div class="order-date">{{ o.checkIn }} ~ {{ o.checkOut }} ({{ o.days }}晚)</div>
            <div class="order-guests">入住 {{ o.guests }} 人</div>
          </div>
          <div class="order-price">
            <div class="price">¥{{ o.totalAmount }}</div>
            <div class="price-unit">总计</div>
          </div>
        </div>
        <div class="order-footer" v-if="o.status === 5 && !reviewStatusMap[o.id]">
          <el-button type="warning" size="small" round @click.stop="goReview(o.id)">写评价</el-button>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无订单" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { listOrders } from '../../api/order';
import { checkReview } from '../../api/review';
import { thumbUrl } from '../../utils/request';

const router = useRouter();
const resolveImg = thumbUrl;
const orders = ref<any[]>([]);
const activeTab = ref('');
const reviewStatusMap = ref<Record<number, boolean>>({});

onMounted(() => loadData());

async function loadData() {
  const params: any = {};
  if (activeTab.value === '0') params.status = 0;
  else if (activeTab.value === '5') params.status = 5;
  // ongoing 可多个状态，简化为直接获取全部
  const res: any = await listOrders(params);
  let list = res.list || [];
  if (activeTab.value === 'ongoing') {
    list = list.filter((o: any) => [1, 2, 3, 4].includes(o.status));
  }
  orders.value = list;
  // 检查已完成订单的评价状态
  const completedOrders = list.filter((o: any) => o.status === 5);
  const map: Record<number, boolean> = {};
  await Promise.all(completedOrders.map(async (o: any) => {
    try {
      const res: any = await checkReview(o.id);
      map[o.id] = !!res.review;
    } catch { map[o.id] = false; }
  }));
  reviewStatusMap.value = map;
}

function copyOrderNo(orderNo: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(orderNo).then(() => {
      ElMessage.success('订单号已复制');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = orderNo; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      ElMessage.success('订单号已复制');
    });
  } else {
    const ta = document.createElement('textarea');
    ta.value = orderNo; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    ElMessage.success('订单号已复制');
  }
}

function goDetail(id: number) {
  router.push(`/order/${id}`);
}

function goReview(orderId: number) {
  router.push(`/order/${orderId}#review`);
}

function statusText(s: number) {
  return { 0: '待付定金', 1: '已付定金', 2: '待付尾款', 3: '待入住', 4: '已入住', 5: '已完成', 6: '已取消', 7: '已拒绝', 8: '已关闭' }[s] || '';
}

function statusType(s: number): any {
  return { 0: 'warning', 1: '', 2: 'warning', 3: 'success', 4: '', 5: 'info', 6: 'info', 7: 'danger', 8: 'info' }[s] || '';
}
</script>

<style scoped>
.order-page { padding: 30px 0 60px; }
.page-title { font-size: 24px; color: #333; margin-bottom: 20px; }

.order-list { display: flex; flex-direction: column; gap: 16px; }
.order-card {
  background: #fff; border-radius: 12px; overflow: hidden;
  cursor: pointer; transition: box-shadow 0.2s;
}
.order-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
.order-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 24px; border-bottom: 1px solid #f5f5f5;
}
.order-no { font-size: 13px; color: #999; display: inline-flex; align-items: center; }
.copy-btn {
  display: inline-flex; align-items: center; justify-content: center;
  margin-left: 6px; padding: 3px; border-radius: 4px;
  color: #94a3b8; cursor: pointer; transition: all 0.2s;
}
.copy-btn:hover { color: #409eff; background: #f0f7ff; }
.order-body { display: flex; gap: 20px; padding: 20px 24px; align-items: center; }
.order-body img { width: 140px; height: 100px; object-fit: cover; border-radius: 8px; }
.order-info { flex: 1; }
.villa-name { font-size: 16px; font-weight: bold; color: #333; }
.order-date { font-size: 13px; color: #999; margin-top: 8px; }
.order-guests { font-size: 13px; color: #666; margin-top: 4px; }
.order-price { text-align: right; }
.price { font-size: 24px; color: #ff6b35; font-weight: bold; }
.price-unit { font-size: 12px; color: #999; }
.order-tags { display: flex; gap: 8px; align-items: center; }
.review-tag { animation: pulse-review 2s infinite; }
@keyframes pulse-review {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
.order-footer {
  display: flex; justify-content: flex-end; padding: 0 24px 16px;
}
</style>
