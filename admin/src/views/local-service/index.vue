<template>
  <div>
    <div class="page-toolbar">
      <el-button type="primary" @click="openDialog()">新增服务</el-button>
      <ViewToggle v-model="viewMode" />
    </div>

    <el-table v-if="viewMode === 'table'" :data="list" border stripe>
      <el-table-column label="封面" width="100">
        <template #default="{ row }">
          <el-image v-if="row.coverImage" :src="row.coverImage" fit="cover" style="width: 70px; height: 50px; border-radius: 4px;" />
        </template>
      </el-table-column>
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="category" label="分类" width="80" />
      <el-table-column label="价格" width="120" align="center">
        <template #default="{ row }"><span style="color: #ff6b35; font-weight: 600;">¥{{ row.price }}</span>/{{ row.unit }}</template>
      </el-table-column>
      <el-table-column prop="provider" label="服务商" width="120" />
      <el-table-column label="操作" width="140" align="center">
        <template #default="{ row }">
          <div class="action-btns"><span class="action-link primary" @click="handleEdit(row)">编辑</span><span class="action-divider">|</span><span class="action-link danger" @click="handleDelete(row)">删除</span></div>
        </template>
      </el-table-column>
    </el-table>

    <div v-else class="card-grid">
      <div class="item-card" v-for="row in list" :key="row.id">
        <div class="card-cover">
          <img v-if="row.coverImage" :src="row.coverImage" />
          <div v-else class="card-empty-cover"><el-icon :size="32"><Picture /></el-icon></div>
          <el-tag class="card-badge" size="small" type="info">{{ row.category }}</el-tag>
        </div>
        <div class="card-body">
          <div class="card-title">{{ row.name }}</div>
          <div class="card-meta"><span>{{ row.provider }}</span></div>
          <div class="card-price">¥{{ row.price }}<small>/{{ row.unit }}</small></div>
          <div class="card-actions">
            <span class="action-link primary" @click="handleEdit(row)">编辑</span>
            <span class="action-link danger" @click="handleDelete(row)">删除</span>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑' : '新增'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category">
            <el-option v-for="c in ['厨师','摄影','DJ','调酒','蛋糕','教练']" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格"><el-input-number v-model="form.price" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="form.unit" placeholder="次/小时/天" /></el-form-item>
        <el-form-item label="服务商"><el-input v-model="form.provider" /></el-form-item>
        <el-form-item label="封面图"><ImageUpload v-model="form.coverImage" /></el-form-item>
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
import { Picture } from '@element-plus/icons-vue';
import { getServices, createService, updateService, deleteService } from '../../api/local-service';
import ImageUpload from '../../components/ImageUpload.vue';
import ViewToggle from '../../components/ViewToggle.vue';

const viewMode = ref<'table' | 'grid'>('grid');
const list = ref<any[]>([]);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({ name: '', category: '厨师', price: 0, unit: '次', provider: '', coverImage: '', description: '' });

onMounted(async () => { const res: any = await getServices({ page: 1, pageSize: 50 }); list.value = res.list; });

function openDialog() { editingId.value = null; Object.assign(form, { name: '', category: '厨师', price: 0, unit: '次', provider: '', coverImage: '', description: '' }); dialogVisible.value = true; }
function handleEdit(row: any) { editingId.value = row.id; Object.assign(form, { ...row, coverImage: row.coverImage || '' }); dialogVisible.value = true; }
async function handleSubmit() {
  if (editingId.value) { await updateService(editingId.value, { ...form }); ElMessage.success('更新成功'); }
  else { await createService({ ...form }); ElMessage.success('创建成功'); }
  dialogVisible.value = false;
  const res: any = await getServices({ page: 1, pageSize: 50 }); list.value = res.list;
}
async function handleDelete(row: any) { await ElMessageBox.confirm('确定删除？'); await deleteService(row.id); ElMessage.success('已删除'); const res: any = await getServices({ page: 1, pageSize: 50 }); list.value = res.list; }
</script>
