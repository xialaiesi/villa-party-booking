<template>
  <div>
    <div class="toolbar"><el-button type="primary" @click="openDialog()">新增限定活动</el-button></div>
    <el-table :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="season" label="季节" width="80" />
      <el-table-column label="日期" width="220">
        <template #default="{ row }">{{ row.startDate?.split('T')[0] }} ~ {{ row.endDate?.split('T')[0] }}</template>
      </el-table-column>
      <el-table-column label="名额" width="120" align="center">
        <template #default="{ row }">{{ row.soldCount }}/{{ row.quota || '不限' }}</template>
      </el-table-column>
      <el-table-column label="优惠" width="100" align="center">
        <template #default="{ row }">{{ row.discount ? '¥' + row.discount : '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑' : '新增'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="季节">
          <el-select v-model="form.season">
            <el-option label="春日" value="spring" /><el-option label="夏日" value="summer" />
            <el-option label="秋日" value="autumn" /><el-option label="冬日" value="winter" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期"><el-date-picker v-model="form.startDate" type="date" /></el-form-item>
        <el-form-item label="结束日期"><el-date-picker v-model="form.endDate" type="date" /></el-form-item>
        <el-form-item label="限量"><el-input-number v-model="form.quota" :min="0" /></el-form-item>
        <el-form-item label="优惠金额"><el-input-number v-model="form.discount" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
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
import { ElMessage, ElMessageBox } from 'element-plus';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../../api/seasonal-event';

const list = ref<any[]>([]);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({ name: '', season: 'summer', startDate: '', endDate: '', quota: 0, discount: 0, description: '' });

onMounted(async () => { const res: any = await getEvents({ page: 1, pageSize: 50 }); list.value = res.list; });

function openDialog() { editingId.value = null; Object.assign(form, { name: '', season: 'summer', startDate: '', endDate: '', quota: 0, discount: 0, description: '' }); dialogVisible.value = true; }
function handleEdit(row: any) { editingId.value = row.id; Object.assign(form, row); dialogVisible.value = true; }
async function handleSubmit() {
  if (editingId.value) { await updateEvent(editingId.value, { ...form }); ElMessage.success('更新成功'); }
  else { await createEvent({ ...form }); ElMessage.success('创建成功'); }
  dialogVisible.value = false;
  const res: any = await getEvents({ page: 1, pageSize: 50 }); list.value = res.list;
}
async function handleDelete(row: any) { await ElMessageBox.confirm('确定删除？'); await deleteEvent(row.id); ElMessage.success('已删除'); const res: any = await getEvents({ page: 1, pageSize: 50 }); list.value = res.list; }
</script>

<style scoped>.toolbar { margin-bottom: 16px; }</style>
