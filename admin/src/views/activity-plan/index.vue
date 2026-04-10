<template>
  <div>
    <div class="page-toolbar">
      <el-button type="primary" @click="openDialog()">新增活动方案</el-button>
      <ViewToggle v-model="viewMode" />
    </div>

    <!-- 表格视图 -->
    <el-table v-if="viewMode === 'table'" :data="planList" border stripe>
      <el-table-column label="封面" width="100">
        <template #default="{ row }">
          <el-image v-if="row.coverImage" :src="row.coverImage" fit="cover" style="width: 70px; height: 50px; border-radius: 4px;" />
          <span v-else style="color: #cbd5e1; font-size: 12px;">暂无</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="方案名称" />
      <el-table-column prop="scene" label="场景" width="80" />
      <el-table-column label="人数" width="110" align="center">
        <template #default="{ row }">{{ row.minGuests }}-{{ row.maxGuests }}人</template>
      </el-table-column>
      <el-table-column prop="duration" label="时长" width="90" />
      <el-table-column label="状态" width="70" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" align="center">
        <template #default="{ row }">
          <div class="action-btns">
            <span class="action-link primary" @click="handleEdit(row)">编辑</span>
            <span class="action-divider">|</span>
            <span class="action-link danger" @click="handleDelete(row)">删除</span>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 卡片视图 -->
    <div v-else class="card-grid">
      <div class="item-card" v-for="row in planList" :key="row.id">
        <div class="card-cover">
          <img v-if="row.coverImage" :src="row.coverImage" />
          <div v-else class="card-empty-cover"><el-icon :size="32"><Picture /></el-icon></div>
          <el-tag class="card-badge" :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
        </div>
        <div class="card-body">
          <div class="card-title">{{ row.name }}</div>
          <div class="card-meta">
            <span>🎭 {{ row.scene }}</span>
            <span>👥 {{ row.minGuests }}-{{ row.maxGuests }}人</span>
            <span v-if="row.duration">⏱ {{ row.duration }}</span>
          </div>
          <div class="card-desc" v-if="row.description">{{ row.description }}</div>
          <div class="card-actions">
            <span class="action-link primary" @click="handleEdit(row)">编辑</span>
            <span class="action-link danger" @click="handleDelete(row)">删除</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑方案' : '新增方案'" width="700px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="方案名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="场景">
          <el-select v-model="form.scene">
            <el-option label="团建" value="团建" />
            <el-option label="生日" value="生日" />
            <el-option label="聚会" value="聚会" />
            <el-option label="亲子" value="亲子" />
          </el-select>
        </el-form-item>
        <el-form-item label="人数范围">
          <el-input-number v-model="form.minGuests" :min="1" /> —
          <el-input-number v-model="form.maxGuests" :min="1" />
        </el-form-item>
        <el-form-item label="时长"><el-input v-model="form.duration" placeholder="如：4小时、全天" /></el-form-item>
        <el-form-item label="封面图"><ImageUpload v-model="form.coverImage" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="活动环节">
          <div style="width: 100%;">
            <div v-for="(step, i) in form.steps" :key="i" class="step-row">
              <el-input v-model="step.time" placeholder="时间" style="width: 120px;" />
              <el-input v-model="step.title" placeholder="环节名称" style="flex: 1;" />
              <el-button text type="danger" @click="form.steps.splice(i, 1)">删除</el-button>
            </div>
            <el-button size="small" @click="form.steps.push({ time: '', title: '', content: '', tips: '' })">+ 添加环节</el-button>
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
import { getPlans, createPlan, updatePlan, deletePlan } from '../../api/activity-plan';
import ImageUpload from '../../components/ImageUpload.vue';
import ViewToggle from '../../components/ViewToggle.vue';

const viewMode = ref<'table' | 'grid'>('grid');
const planList = ref<any[]>([]);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({
  name: '', scene: '团建', minGuests: 5, maxGuests: 20, duration: '', description: '', coverImage: '',
  steps: [] as { time: string; title: string; content: string; tips: string }[],
});

onMounted(() => loadData());
async function loadData() { const res: any = await getPlans({ page: 1, pageSize: 50 }); planList.value = res.list; }

function openDialog() {
  editingId.value = null;
  Object.assign(form, { name: '', scene: '团建', minGuests: 5, maxGuests: 20, duration: '', description: '', coverImage: '', steps: [] });
  dialogVisible.value = true;
}
function handleEdit(row: any) {
  editingId.value = row.id;
  Object.assign(form, {
    name: row.name, scene: row.scene, minGuests: row.minGuests, maxGuests: row.maxGuests,
    duration: row.duration, description: row.description, coverImage: row.coverImage || '',
    steps: row.steps?.map((s: any) => ({ time: s.time || '', title: s.title, content: s.content || '', tips: s.tips || '' })) || [],
  });
  dialogVisible.value = true;
}
async function handleSubmit() {
  if (editingId.value) { await updatePlan(editingId.value, { ...form }); ElMessage.success('更新成功'); }
  else { await createPlan({ ...form }); ElMessage.success('创建成功'); }
  dialogVisible.value = false; loadData();
}
async function handleDelete(row: any) {
  await ElMessageBox.confirm('确定删除该方案？', '提示');
  await deletePlan(row.id); ElMessage.success('已删除'); loadData();
}
</script>

<style scoped>
.step-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
</style>
