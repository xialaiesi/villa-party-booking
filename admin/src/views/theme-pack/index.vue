<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openDialog()">新增氛围包</el-button>
    </div>

    <el-table :data="packList" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="theme" label="主题" width="120" />
      <el-table-column label="价格" width="120" align="center">
        <template #default="{ row }">¥{{ row.price }}</template>
      </el-table-column>
      <el-table-column label="原价" width="120" align="center">
        <template #default="{ row }">
          <span v-if="row.originalPrice" style="text-decoration: line-through; color: #999;">¥{{ row.originalPrice }}</span>
        </template>
      </el-table-column>
      <el-table-column label="包含项" width="80" align="center">
        <template #default="{ row }">{{ row.items?.length || 0 }}项</template>
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

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑氛围包' : '新增氛围包'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称"><el-input v-model="form.name" placeholder="如：赛博朋克之夜" /></el-form-item>
        <el-form-item label="主题">
          <el-select v-model="form.theme">
            <el-option v-for="t in ['赛博朋克','复古','露营','ins风','派对']" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="打包价"><el-input-number v-model="form.price" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="原价"><el-input-number v-model="form.originalPrice" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="包含物品">
          <div style="width: 100%;">
            <div v-for="(_item, i) in form.items" :key="i" style="display: flex; gap: 8px; margin-bottom: 8px;">
              <el-input v-model="form.items[i]" placeholder="物品名称" />
              <el-button text type="danger" @click="form.items.splice(i, 1)">删除</el-button>
            </div>
            <el-button size="small" @click="form.items.push('')">+ 添加物品</el-button>
          </div>
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
import { getThemePacks, createThemePack, updateThemePack, deleteThemePack } from '../../api/theme-pack';

const packList = ref<any[]>([]);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({
  name: '', theme: '派对', price: 0, originalPrice: 0, description: '',
  items: [] as string[],
});

onMounted(() => loadData());

async function loadData() {
  const res: any = await getThemePacks({ page: 1, pageSize: 50 });
  packList.value = res.list;
}

function openDialog() {
  editingId.value = null;
  Object.assign(form, { name: '', theme: '派对', price: 0, originalPrice: 0, description: '', items: [] });
  dialogVisible.value = true;
}

function handleEdit(row: any) {
  editingId.value = row.id;
  Object.assign(form, { ...row, items: row.items || [] });
  dialogVisible.value = true;
}

async function handleSubmit() {
  const data = { ...form, items: form.items.filter(Boolean) };
  if (editingId.value) {
    await updateThemePack(editingId.value, data);
    ElMessage.success('更新成功');
  } else {
    await createThemePack(data);
    ElMessage.success('创建成功');
  }
  dialogVisible.value = false;
  loadData();
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm('确定删除？', '提示');
  await deleteThemePack(row.id);
  ElMessage.success('已删除');
  loadData();
}
</script>

<style scoped>
.toolbar { margin-bottom: 16px; }
</style>
