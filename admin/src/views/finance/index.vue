<template>
  <div>
    <!-- 商家视图：财务概览 -->
    <template v-if="userStore.isMerchant">
      <el-row :gutter="20" v-if="finance">
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-label">总收入</div>
            <div class="stat-value">¥{{ finance.totalRevenue?.toLocaleString() }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-label">已结算</div>
            <div class="stat-value green">¥{{ finance.settledAmount?.toLocaleString() }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-label">待结算</div>
            <div class="stat-value orange">¥{{ finance.pendingAmount?.toLocaleString() }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-label">结算笔数</div>
            <div class="stat-value">{{ finance.settlementCount }}</div>
          </el-card>
        </el-col>
      </el-row>

      <el-card style="margin-top: 20px;" v-if="finance">
        <template #header>收款账户</template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="开户银行">{{ finance.bankName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="账号">{{ finance.bankAccount || '-' }}</el-descriptions-item>
          <el-descriptions-item label="户名">{{ finance.accountHolder || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
    </template>

    <!-- 结算记录 -->
    <el-card style="margin-top: 20px;">
      <template #header>
        <span>{{ userStore.isPlatform ? '所有商家结算记录' : '我的结算记录' }}</span>
      </template>
      <el-table :data="settlements" border stripe>
        <el-table-column prop="orderNo" label="订单号" width="200" />
        <el-table-column v-if="userStore.isPlatform" label="商家" width="140">
          <template #default="{ row }">{{ row.merchant?.name }}</template>
        </el-table-column>
        <el-table-column label="订单金额" width="120" align="center">
          <template #default="{ row }">¥{{ row.amount?.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="佣金" width="120" align="center">
          <template #default="{ row }">¥{{ row.commission?.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="商家实得" width="120" align="center">
          <template #default="{ row }">¥{{ row.netAmount?.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'warning'">
              {{ row.status === 1 ? '已结算' : '待结算' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column v-if="userStore.isPlatform" label="操作" width="140" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              size="small"
              type="primary"
              @click="handleMarkSettled(row)"
            >标记已结算</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getMyFinance, getMySettlements, markSettled } from '../../api/merchant';
import { useUserStore } from '../../store/user';

const userStore = useUserStore();
const finance = ref<any>(null);
const settlements = ref<any[]>([]);

onMounted(async () => {
  if (userStore.isMerchant) {
    finance.value = await getMyFinance();
  }
  const res: any = await getMySettlements({ page: 1, pageSize: 50 });
  settlements.value = res.list;
});

async function handleMarkSettled(row: any) {
  await ElMessageBox.confirm(`确认将该笔 ¥${row.netAmount} 标记为已结算？`, '确认');
  await markSettled(row.id);
  ElMessage.success('已标记为已结算');
  const res: any = await getMySettlements({ page: 1, pageSize: 50 });
  settlements.value = res.list;
}
</script>

<style scoped>
.stat-label { font-size: 14px; color: #909399; }
.stat-value { font-size: 28px; font-weight: bold; margin-top: 8px; color: #303133; }
.stat-value.green { color: #67c23a; }
.stat-value.orange { color: #e6a23c; }
</style>
