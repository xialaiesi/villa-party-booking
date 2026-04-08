<template>
  <div>
    <div class="toolbar">
      <el-radio-group v-model="statusFilter" @change="loadData">
        <el-radio-button :value="-1">全部</el-radio-button>
        <el-radio-button :value="1">待确认</el-radio-button>
        <el-radio-button :value="2">待入住</el-radio-button>
        <el-radio-button :value="4">待退押金</el-radio-button>
        <el-radio-button :value="5">已完成</el-radio-button>
      </el-radio-group>
    </div>

    <el-table :data="orderList" border stripe>
      <el-table-column prop="orderNo" label="订单号" width="200" />
      <el-table-column label="别墅" width="150">
        <template #default="{ row }">{{ row.villa?.name }}</template>
      </el-table-column>
      <el-table-column label="用户" width="120">
        <template #default="{ row }">{{ row.user?.nickname || row.user?.phone }}</template>
      </el-table-column>
      <el-table-column label="日期" width="200">
        <template #default="{ row }">{{ row.checkIn }} ~ {{ row.checkOut }}</template>
      </el-table-column>
      <el-table-column prop="totalAmount" label="金额" width="100" align="center" />
      <el-table-column prop="depositAmount" label="押金" width="100" align="center" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" align="center">
        <template #default="{ row }">
          <el-button v-if="row.status === 1" size="small" type="success" @click="handleConfirm(row)">确认</el-button>
          <el-button v-if="row.status === 1" size="small" type="danger" @click="handleReject(row)">拒绝</el-button>
          <el-button v-if="row.status === 4" size="small" type="primary" @click="handleRefundDeposit(row)">退押金</el-button>
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
import { getOrders, confirmOrder, rejectOrder, refundDeposit } from '../../api/order';

const orderList = ref<any[]>([]);
const page = ref(1);
const pageSize = 10;
const total = ref(0);
const statusFilter = ref(-1);

onMounted(() => loadData());

async function loadData() {
  const params: any = { page: page.value, pageSize };
  if (statusFilter.value >= 0) params.status = statusFilter.value;
  const res: any = await getOrders(params);
  orderList.value = res.list;
  total.value = res.total;
}

async function handleConfirm(row: any) {
  await ElMessageBox.confirm('确认该订单？', '确认');
  await confirmOrder(row.id);
  ElMessage.success('已确认');
  loadData();
}

async function handleReject(row: any) {
  const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝订单');
  await rejectOrder(row.id, reason);
  ElMessage.success('已拒绝');
  loadData();
}

async function handleRefundDeposit(row: any) {
  await ElMessageBox.confirm(`退还押金 ¥${row.depositAmount}？`, '退押金');
  await refundDeposit(row.id, row.depositAmount);
  ElMessage.success('押金已退还');
  loadData();
}

function statusText(status: number) {
  const map: Record<number, string> = { 0: '待支付', 1: '待确认', 2: '待入住', 3: '已入住', 4: '待退押金', 5: '已完成', 6: '已取消', 7: '已拒绝', 8: '已关闭' };
  return map[status] || '未知';
}

function statusType(status: number) {
  const map: Record<number, string> = { 0: 'info', 1: 'warning', 2: '', 3: '', 4: 'warning', 5: 'success', 6: 'info', 7: 'danger', 8: 'info' };
  return map[status] || '';
}
</script>

<style scoped>
.toolbar { margin-bottom: 16px; }
</style>
