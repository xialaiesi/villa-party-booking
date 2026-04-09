<template>
  <div class="container order-detail" v-if="order">
    <h2 class="page-title">订单详情</h2>

    <div class="status-card" :class="'status-' + order.status">
      <div class="status-icon">{{ statusIcon(order.status) }}</div>
      <div class="status-text">{{ statusText(order.status) }}</div>
      <div class="status-desc">{{ statusDesc(order.status) }}</div>
    </div>

    <div class="card">
      <h3>别墅信息</h3>
      <div class="villa-row">
        <div>
          <div class="villa-name">{{ order.villa?.name }}</div>
          <div class="date-info">{{ order.checkIn }} ~ {{ order.checkOut }}（{{ order.days }}晚）</div>
          <div class="guest-info">入住 {{ order.guests }} 人</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h3>费用明细</h3>
      <div class="fee-item"><span>别墅费用</span><span>¥{{ order.villaAmount }}</span></div>
      <div class="fee-item" v-if="order.discountAmount > 0">
        <span>连住折扣</span><span class="discount">-¥{{ order.discountAmount }}</span>
      </div>
      <div class="fee-item total"><span>订单金额</span><span>¥{{ order.totalAmount }}</span></div>
      <div class="fee-item" v-if="order.depositAmount > 0">
        <span>押金</span><span>¥{{ order.depositAmount }}</span>
      </div>
    </div>

    <div class="card" v-if="order.contactName">
      <h3>联系信息</h3>
      <p>{{ order.contactName }} · {{ order.contactPhone }}</p>
    </div>

    <div class="card">
      <h3>订单信息</h3>
      <div class="info-row"><span class="label">订单号：</span>{{ order.orderNo }}</div>
      <div class="info-row"><span class="label">下单时间：</span>{{ formatDate(order.createdAt) }}</div>
    </div>

    <div class="action-bar" v-if="order.status === 0">
      <el-button size="large" @click="handleCancel">取消订单</el-button>
      <el-button type="primary" size="large">
        去支付 ¥{{ (Number(order.totalAmount) + Number(order.depositAmount)).toFixed(2) }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getOrder, cancelOrder } from '../../api/order';

const route = useRoute();
const order = ref<any>(null);

onMounted(() => load());

async function load() {
  const id = parseInt(route.params.id as string);
  order.value = await getOrder(id);
}

async function handleCancel() {
  await ElMessageBox.confirm('确定取消该订单？', '提示');
  await cancelOrder(order.value.id);
  ElMessage.success('已取消');
  load();
}

function formatDate(d: string) {
  return new Date(d).toLocaleString();
}

function statusIcon(s: number) {
  return { 0: '⏳', 1: '💳', 2: '✅', 3: '🏠', 4: '💎', 5: '🎉' }[s] || '📦';
}

function statusText(s: number) {
  return { 0: '待支付', 1: '待商家确认', 2: '待入住', 3: '已入住', 4: '待退押金', 5: '已完成', 6: '已取消', 7: '已拒绝', 8: '已关闭' }[s] || '';
}

function statusDesc(s: number) {
  return {
    0: '请尽快完成支付',
    1: '商家正在处理，请耐心等待',
    2: '请按时入住',
    3: '祝你玩得开心！',
    4: '商家正在验收，押金将很快退还',
    5: '感谢您的入住',
  }[s] || '';
}
</script>

<style scoped>
.order-detail { padding: 30px 0 60px; max-width: 900px; }
.page-title { font-size: 24px; color: #333; margin-bottom: 20px; }

.status-card {
  background: linear-gradient(135deg, #ff6b35, #ff8f65);
  padding: 40px; border-radius: 12px; color: #fff;
  text-align: center; margin-bottom: 20px;
}
.status-card.status-5 { background: linear-gradient(135deg, #27ae60, #2ecc71); }
.status-icon { font-size: 48px; }
.status-text { font-size: 24px; font-weight: bold; margin-top: 8px; }
.status-desc { font-size: 14px; opacity: 0.9; margin-top: 6px; }

.card {
  background: #fff; padding: 30px; border-radius: 12px; margin-bottom: 16px;
}
.card h3 { font-size: 16px; margin-bottom: 16px; color: #333; }
.villa-name { font-size: 16px; color: #333; }
.date-info, .guest-info { font-size: 14px; color: #666; margin-top: 6px; }

.fee-item {
  display: flex; justify-content: space-between;
  padding: 10px 0; font-size: 14px; color: #666;
}
.fee-item.total {
  border-top: 1px solid #f5f5f5; padding-top: 16px;
  margin-top: 8px; font-weight: bold; color: #333;
}
.discount { color: #27ae60; }

.info-row { padding: 6px 0; font-size: 14px; color: #666; }
.label { color: #999; }

.action-bar {
  display: flex; gap: 12px; padding: 20px;
  background: #fff; border-radius: 12px;
  justify-content: flex-end;
}
</style>
