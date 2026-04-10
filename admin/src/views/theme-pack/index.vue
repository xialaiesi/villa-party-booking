<template>
  <div>
    <div class="page-toolbar">
      <el-button type="primary" @click="openDialog()">新增氛围包</el-button>
      <ViewToggle v-model="viewMode" />
    </div>

    <el-table v-if="viewMode === 'table'" :data="packList" border stripe>
      <el-table-column label="封面" width="100">
        <template #default="{ row }">
          <el-image v-if="row.coverImage" :src="row.coverImage" fit="cover" style="width: 70px; height: 50px; border-radius: 4px;" />
        </template>
      </el-table-column>
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="theme" label="主题" width="100" />
      <el-table-column label="价格" width="140" align="center">
        <template #default="{ row }">
          <span style="color: #ff6b35; font-weight: 600;">¥{{ row.price }}</span>
          <del v-if="row.originalPrice" style="color: #cbd5e1; margin-left: 4px;">¥{{ row.originalPrice }}</del>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="70" align="center">
        <template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '上架' : '下架' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="140" align="center">
        <template #default="{ row }">
          <div class="action-btns"><span class="action-link primary" @click="handleEdit(row)">编辑</span><span class="action-divider">|</span><span class="action-link danger" @click="handleDelete(row)">删除</span></div>
        </template>
      </el-table-column>
    </el-table>

    <div v-else class="card-grid">
      <div class="item-card" v-for="row in packList" :key="row.id">
        <div class="card-cover">
          <img v-if="row.coverImage" :src="row.coverImage" />
          <div v-else class="card-empty-cover"><el-icon :size="32"><Picture /></el-icon></div>
          <el-tag class="card-badge" size="small">{{ row.theme }}</el-tag>
        </div>
        <div class="card-body">
          <div class="card-title">{{ row.name }}</div>
          <div class="card-price">¥{{ row.price }} <del v-if="row.originalPrice">¥{{ row.originalPrice }}</del></div>
          <div class="card-actions">
            <span class="action-link primary" @click="handleEdit(row)">编辑</span>
            <span class="action-link danger" @click="handleDelete(row)">删除</span>
          </div>
        </div>
      </div>
    </div>

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
        <el-form-item label="封面图"><ImageUpload v-model="form.coverImage" /></el-form-item>
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
import { Picture } from '@element-plus/icons-vue';
import { getThemePacks, createThemePack, updateThemePack, deleteThemePack } from '../../api/theme-pack';
import ImageUpload from '../../components/ImageUpload.vue';
import ViewToggle from '../../components/ViewToggle.vue';

const viewMode = ref<'table' | 'grid'>('grid');
const packList = ref<any[]>([]);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({ name: '', theme: '派对', price: 0, originalPrice: 0, description: '', coverImage: '', items: [] as string[] });

onMounted(() => loadData());
async function loadData() { const res: any = await getThemePacks({ page: 1, pageSize: 50 }); packList.value = res.list; }

function openDialog() { editingId.value = null; Object.assign(form, { name: '', theme: '派对', price: 0, originalPrice: 0, description: '', coverImage: '', items: [] }); dialogVisible.value = true; }
function handleEdit(row: any) { editingId.value = row.id; Object.assign(form, { ...row, coverImage: row.coverImage || '', items: row.items || [] }); dialogVisible.value = true; }
async function handleSubmit() {
  const data = { ...form, items: form.items.filter(Boolean) };
  if (editingId.value) { await updateThemePack(editingId.value, data); ElMessage.success('更新成功'); }
  else { await createThemePack(data); ElMessage.success('创建成功'); }
  dialogVisible.value = false; loadData();
}
async function handleDelete(row: any) { await ElMessageBox.confirm('确定删除？'); await deleteThemePack(row.id); ElMessage.success('已删除'); loadData(); }
</script>
