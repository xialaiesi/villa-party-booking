<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="dialogVisible = true">新增别墅</el-button>
    </div>
    <el-table :data="villaList" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="address" label="地址" />
      <el-table-column prop="maxGuests" label="容纳人数" width="100" align="center" />
      <el-table-column prop="basePrice" label="平日价" width="100" align="center" />
      <el-table-column prop="weekendPrice" label="周末价" width="100" align="center" />
      <el-table-column prop="deposit" label="押金" width="100" align="center" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" :type="row.status === 1 ? 'warning' : 'success'" @click="toggleStatus(row)">
            {{ row.status === 1 ? '下架' : '上架' }}
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

    <el-dialog v-model="dialogVisible" title="别墅信息" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="容纳人数"><el-input-number v-model="form.maxGuests" :min="1" /></el-form-item>
        <el-form-item label="卧室数"><el-input-number v-model="form.bedrooms" :min="1" /></el-form-item>
        <el-form-item label="面积(㎡)"><el-input-number v-model="form.area" :min="0" /></el-form-item>
        <el-form-item label="平日价"><el-input-number v-model="form.basePrice" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="周末价"><el-input-number v-model="form.weekendPrice" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="押金"><el-input-number v-model="form.deposit" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="标签"><el-input v-model="form.tags" placeholder="团建,生日,聚会" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { getVillas, createVilla, updateVilla, updateVillaStatus } from '../../api/villa';

const villaList = ref<any[]>([]);
const page = ref(1);
const pageSize = 10;
const total = ref(0);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);

const form = reactive({
  name: '', address: '', maxGuests: 10, bedrooms: 3, area: 200,
  basePrice: 0, weekendPrice: 0, deposit: 0, description: '', tags: '',
});

onMounted(() => loadData());

async function loadData() {
  const res: any = await getVillas({ page: page.value, pageSize });
  villaList.value = res.list;
  total.value = res.total;
}

function handleEdit(row: any) {
  editingId.value = row.id;
  Object.assign(form, row);
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (editingId.value) {
    await updateVilla(editingId.value, { ...form });
    ElMessage.success('更新成功');
  } else {
    await createVilla({ ...form });
    ElMessage.success('创建成功');
  }
  dialogVisible.value = false;
  editingId.value = null;
  loadData();
}

async function toggleStatus(row: any) {
  const newStatus = row.status === 1 ? 0 : 1;
  await updateVillaStatus(row.id, newStatus);
  ElMessage.success(newStatus === 1 ? '已上架' : '已下架');
  loadData();
}
</script>

<style scoped>
.toolbar { margin-bottom: 16px; }
</style>
