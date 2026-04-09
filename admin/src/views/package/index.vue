<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openDialog()">新增套餐</el-button>
    </div>

    <el-table :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="category" label="分类" width="120" />
      <el-table-column label="平日价" width="120" align="center">
        <template #default="{ row }">¥{{ row.price }}</template>
      </el-table-column>
      <el-table-column label="周末价" width="120" align="center">
        <template #default="{ row }">{{ row.weekendPrice ? '¥' + row.weekendPrice : '-' }}</template>
      </el-table-column>
      <el-table-column label="节假日价" width="120" align="center">
        <template #default="{ row }">{{ row.holidayPrice ? '¥' + row.holidayPrice : '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑套餐' : '新增套餐'" width="550px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称"><el-input v-model="form.name" placeholder="如：烧烤派对套餐" /></el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" style="width: 100%;">
            <el-option v-for="c in ['烧烤', 'KTV', '布置', '游戏', '食材', '其他']" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="平日价"><el-input-number v-model="form.price" :min="0" :precision="2" :step="50" /></el-form-item>
        <el-form-item label="周末价"><el-input-number v-model="form.weekendPrice" :min="0" :precision="2" :step="50" /></el-form-item>
        <el-form-item label="节假日价"><el-input-number v-model="form.holidayPrice" :min="0" :precision="2" :step="50" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="图片URL"><el-input v-model="form.image" placeholder="图片链接" /></el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="上架" inactive-text="下架" />
        </el-form-item>
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
import { getPackages, createPackage, updatePackage, deletePackage } from '../../api/package';

const list = ref<any[]>([]);
const page = ref(1);
const pageSize = 10;
const total = ref(0);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);

const form = reactive({
  name: '', category: '烧烤', price: 0, weekendPrice: 0, holidayPrice: 0,
  description: '', image: '', status: 1,
});

onMounted(() => loadData());

async function loadData() {
  const res: any = await getPackages({ page: page.value, pageSize });
  list.value = res.list;
  total.value = res.total;
}

function openDialog() {
  editingId.value = null;
  Object.assign(form, { name: '', category: '烧烤', price: 0, weekendPrice: 0, holidayPrice: 0, description: '', image: '', status: 1 });
  dialogVisible.value = true;
}

function handleEdit(row: any) {
  editingId.value = row.id;
  Object.assign(form, {
    name: row.name, category: row.category || '烧烤',
    price: row.price, weekendPrice: row.weekendPrice || 0, holidayPrice: row.holidayPrice || 0,
    description: row.description, image: row.image, status: row.status,
  });
  dialogVisible.value = true;
}

async function handleSubmit() {
  const data = { ...form };
  if (editingId.value) {
    await updatePackage(editingId.value, data);
    ElMessage.success('更新成功');
  } else {
    await createPackage(data);
    ElMessage.success('创建成功');
  }
  dialogVisible.value = false;
  loadData();
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm('确定删除该套餐？', '提示');
  await deletePackage(row.id);
  ElMessage.success('已删除');
  loadData();
}
</script>

<style scoped>
.toolbar { margin-bottom: 16px; }
</style>
