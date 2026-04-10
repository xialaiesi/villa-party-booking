<template>
  <div>
    <div class="page-toolbar">
      <el-radio-group v-model="statusFilter" @change="loadData">
        <el-radio-button :value="''">全部</el-radio-button>
        <el-radio-button :value="0">待付定金</el-radio-button>
        <el-radio-button :value="1">已付定金</el-radio-button>
        <el-radio-button :value="2">待入住</el-radio-button>
        <el-radio-button :value="3">待付尾款</el-radio-button>
        <el-radio-button :value="4">已付全款</el-radio-button>
        <el-radio-button :value="5">已完成</el-radio-button>
      </el-radio-group>
    </div>

    <el-table :data="orderList" border stripe>
      <el-table-column prop="orderNo" label="订单号" width="180" />
      <el-table-column label="别墅" width="140">
        <template #default="{ row }">{{ row.villa?.name || '-' }}</template>
      </el-table-column>
      <el-table-column label="客户" width="120">
        <template #default="{ row }">{{ row.user?.nickname || row.user?.phone || '-' }}</template>
      </el-table-column>
      <el-table-column label="日期" width="200">
        <template #default="{ row }">{{ fmtDate(row.checkIn) }} ~ {{ fmtDate(row.checkOut) }}</template>
      </el-table-column>
      <el-table-column label="总额" width="90" align="center">
        <template #default="{ row }"><span style="color: #ff6b35; font-weight: 600;">¥{{ row.totalAmount }}</span></template>
      </el-table-column>
      <el-table-column label="定金" width="80" align="center">
        <template #default="{ row }">¥{{ row.depositAmount }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="200" align="center">
        <template #default="{ row }">
          <div class="action-btns" style="flex-wrap: wrap; justify-content: center;">
            <span v-if="row.status === 0" class="action-link success" @click="doAction(confirmDepositPaid, row, '确认定金到账？')">确认定金</span>
            <span v-if="row.status === 1" class="action-link success" @click="doAction(confirmOrder, row, '确认该订单？')">确认订单</span>
            <span v-if="row.status === 1" class="action-link danger" @click="handleReject(row)">拒绝</span>
            <span v-if="row.status === 2" class="action-link primary" @click="doAction(markCheckedIn, row, '确认客人已入住？')">标记入住</span>
            <span v-if="row.status === 3" class="action-link success" @click="doAction(confirmFinalPayment, row, '确认尾款到账？')">确认尾款</span>
            <span v-if="row.status === 4" class="action-link primary" @click="doAction(markCompleted, row, '标记订单已完成？')">标记完成</span>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadData"
      style="margin-top: 20px; justify-content: flex-end;"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  getOrders, confirmDepositPaid, confirmOrder, rejectOrder,
  markCheckedIn, confirmFinalPayment, markCompleted,
} from '../../api/order';

const orderList = ref<any[]>([]);
const page = ref(1);
const pageSize = 10;
const total = ref(0);
const statusFilter = ref<number | ''>('');

onMounted(() => loadData());

async function loadData() {
  const params: any = { page: page.value, pageSize };
  if (statusFilter.value !== '') params.status = statusFilter.value;
  const res: any = await getOrders(params);
  orderList.value = res.list;
  total.value = res.total;
}

async function doAction(fn: (id: number) => Promise<any>, row: any, msg: string) {
  await ElMessageBox.confirm(msg, '确认操作');
  await fn(row.id);
  ElMessage.success('操作成功');
  loadData();
}

async function handleReject(row: any) {
  const { value } = await ElMessageBox.prompt('请输入拒绝原因（可选）', '拒绝订单', {
    inputPlaceholder: '拒绝原因',
    confirmButtonText: '拒绝',
    confirmButtonClass: 'el-button--danger',
  });
  await rejectOrder(row.id, value);
  ElMessage.success('已拒绝');
  loadData();
}

function fmtDate(d: string) { return d?.split('T')[0] || ''; }
function statusLabel(s: number) {
  return { 0: '待付定金', 1: '已付定金', 2: '待入住', 3: '待付尾款', 4: '已付全款', 5: '已完成', 6: '已取消', 7: '已拒绝', 8: '已关闭' }[s] || `${s}`;
}
function statusType(s: number) {
  return { 0: 'warning', 1: '', 2: 'success', 3: 'warning', 4: '', 5: 'info', 6: 'info', 7: 'danger', 8: 'info' }[s] || '';
}
</script>
