<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openDialog()">新增商家</el-button>
    </div>

    <el-table :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="商家名称" />
      <el-table-column prop="contactName" label="联系人" width="100" />
      <el-table-column prop="contactPhone" label="电话" width="140" />
      <el-table-column label="房源数" width="80" align="center">
        <template #default="{ row }">{{ row.villaCount }}</template>
      </el-table-column>
      <el-table-column label="订单数" width="80" align="center">
        <template #default="{ row }">{{ row.orderCount }}</template>
      </el-table-column>
      <el-table-column label="总收入" width="120" align="center">
        <template #default="{ row }">¥{{ row.totalRevenue?.toLocaleString() || 0 }}</template>
      </el-table-column>
      <el-table-column label="待结算" width="120" align="center">
        <template #default="{ row }">¥{{ row.pendingAmount?.toLocaleString() || 0 }}</template>
      </el-table-column>
      <el-table-column label="佣金率" width="80" align="center">
        <template #default="{ row }">{{ (row.commissionRate * 100).toFixed(1) }}%</template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" :type="row.status === 1 ? 'warning' : 'success'" @click="toggleStatus(row)">
            {{ row.status === 1 ? '停用' : '启用' }}
          </el-button>
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

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑商家' : '新增商家'" width="600px">
      <el-form :model="form" label-width="120px">
        <el-divider>基本信息</el-divider>
        <el-form-item label="商家名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="联系人"><el-input v-model="form.contactName" /></el-form-item>
        <el-form-item label="联系电话"><el-input v-model="form.contactPhone" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>

        <el-divider>结算账户</el-divider>
        <el-form-item label="开户银行"><el-input v-model="form.bankName" /></el-form-item>
        <el-form-item label="银行账号"><el-input v-model="form.bankAccount" /></el-form-item>
        <el-form-item label="账户名"><el-input v-model="form.accountHolder" /></el-form-item>
        <el-form-item label="佣金率">
          <el-input-number v-model="form.commissionRate" :min="0" :max="1" :step="0.01" :precision="3" />
          <span style="margin-left: 8px; color: #999;">（0 表示免佣金）</span>
        </el-form-item>

        <el-divider v-if="!editingId">管理员账号</el-divider>
        <el-form-item v-if="!editingId" label="账号"><el-input v-model="form.adminUsername" /></el-form-item>
        <el-form-item v-if="!editingId" label="密码"><el-input v-model="form.adminPassword" show-password /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getMerchants, createMerchant, updateMerchant, updateMerchantStatus } from '../../api/merchant';

const list = ref<any[]>([]);
const page = ref(1);
const pageSize = 10;
const total = ref(0);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);

const form = reactive({
  name: '', contactName: '', contactPhone: '', email: '', address: '', description: '',
  bankName: '', bankAccount: '', accountHolder: '', commissionRate: 0,
  adminUsername: '', adminPassword: '',
});

onMounted(() => loadData());

async function loadData() {
  const res: any = await getMerchants({ page: page.value, pageSize });
  list.value = res.list;
  total.value = res.total;
}

function openDialog() {
  editingId.value = null;
  Object.assign(form, {
    name: '', contactName: '', contactPhone: '', email: '', address: '', description: '',
    bankName: '', bankAccount: '', accountHolder: '', commissionRate: 0,
    adminUsername: '', adminPassword: '',
  });
  dialogVisible.value = true;
}

function handleEdit(row: any) {
  editingId.value = row.id;
  Object.assign(form, {
    name: row.name, contactName: row.contactName, contactPhone: row.contactPhone,
    email: row.email, address: row.address, description: row.description,
    bankName: row.bankName, bankAccount: row.bankAccount, accountHolder: row.accountHolder,
    commissionRate: Number(row.commissionRate),
  });
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (editingId.value) {
    await updateMerchant(editingId.value, { ...form });
    ElMessage.success('更新成功');
  } else {
    if (!form.adminUsername || !form.adminPassword) {
      ElMessage.warning('请填写管理员账号和密码');
      return;
    }
    await createMerchant({ ...form });
    ElMessage.success('创建成功');
  }
  dialogVisible.value = false;
  loadData();
}

async function toggleStatus(row: any) {
  const newStatus = row.status === 1 ? 0 : 1;
  await updateMerchantStatus(row.id, newStatus);
  ElMessage.success(newStatus === 1 ? '已启用' : '已停用');
  loadData();
}
</script>

<style scoped>
.toolbar { margin-bottom: 16px; }
</style>
