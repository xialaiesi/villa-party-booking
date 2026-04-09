<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openDialog()">新增设施</el-button>
    </div>

    <el-table :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="category" label="分类" width="120" />
      <el-table-column prop="icon" label="图标标识" width="160" />
      <el-table-column label="操作" width="200" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑设施' : '新增设施'" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name" placeholder="如：泳池" /></el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" style="width: 100%;">
            <el-option v-for="c in ['娱乐', '餐饮', '运动', '基础']" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="图标"><el-input v-model="form.icon" placeholder="图标标识" /></el-form-item>
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
import { getFacilities, createFacility, updateFacility, deleteFacility } from '../../api/facility';

const list = ref<any[]>([]);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({ name: '', category: '娱乐', icon: '' });

onMounted(() => loadData());

async function loadData() {
  list.value = (await getFacilities()) as any;
}

function openDialog() {
  editingId.value = null;
  Object.assign(form, { name: '', category: '娱乐', icon: '' });
  dialogVisible.value = true;
}

function handleEdit(row: any) {
  editingId.value = row.id;
  Object.assign(form, { name: row.name, category: row.category || '娱乐', icon: row.icon || '' });
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (editingId.value) {
    await updateFacility(editingId.value, { ...form });
    ElMessage.success('更新成功');
  } else {
    await createFacility({ ...form });
    ElMessage.success('创建成功');
  }
  dialogVisible.value = false;
  loadData();
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm('确定删除？', '提示');
  await deleteFacility(row.id);
  ElMessage.success('已删除');
  loadData();
}
</script>

<style scoped>
.toolbar { margin-bottom: 16px; }
</style>
