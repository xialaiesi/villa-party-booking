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
          <span class="order-no">订单号：{{ o.orderNo }}</span>
          <el-tag :type="statusType(o.status)">{{ statusText(o.status) }}</el-tag>
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
      </div>
    </div>
    <el-empty v-else description="暂无订单" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { listOrders } from '../../api/order';
import { thumbUrl } from '../../utils/request';

const router = useRouter();
const resolveImg = thumbUrl;
const orders = ref<any[]>([]);
const activeTab = ref('');

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
}

function goDetail(id: number) {
  router.push(`/order/${id}`);
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
.order-no { font-size: 13px; color: #999; }
.order-body { display: flex; gap: 20px; padding: 20px 24px; align-items: center; }
.order-body img { width: 140px; height: 100px; object-fit: cover; border-radius: 8px; }
.order-info { flex: 1; }
.villa-name { font-size: 16px; font-weight: bold; color: #333; }
.order-date { font-size: 13px; color: #999; margin-top: 8px; }
.order-guests { font-size: 13px; color: #666; margin-top: 4px; }
.order-price { text-align: right; }
.price { font-size: 24px; color: #ff6b35; font-weight: bold; }
.price-unit { font-size: 12px; color: #999; }
</style>
