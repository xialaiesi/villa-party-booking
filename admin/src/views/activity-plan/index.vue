<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openDialog()">新增活动方案</el-button>
    </div>

    <el-table :data="planList" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="方案名称" />
      <el-table-column prop="scene" label="场景" width="100" />
      <el-table-column label="人数" width="120" align="center">
        <template #default="{ row }">{{ row.minGuests }}-{{ row.maxGuests }}人</template>
      </el-table-column>
      <el-table-column prop="duration" label="时长" width="100" />
      <el-table-column label="环节数" width="80" align="center">
        <template #default="{ row }">{{ row.steps?.length || 0 }}</template>
      </el-table-column>
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
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

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

        <!-- 活动环节 -->
        <el-form-item label="活动环节">
          <div style="width: 100%;">
            <div v-for="(step, i) in form.steps" :key="i" class="step-row">
              <el-input v-model="step.time" placeholder="时间" style="width: 120px;" />
              <el-input v-model="step.title" placeholder="环节名称" style="flex: 1;" />
              <el-button text type="danger" @click="form.steps.splice(i, 1)">删除</el-button>
            </div>
            <el-button size="small" @click="form.steps.push({ time: '', title: '', content: '', tips: '' })">
              + 添加环节
            </el-button>
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
import { getPlans, createPlan, updatePlan, deletePlan } from '../../api/activity-plan';
import ImageUpload from '../../components/ImageUpload.vue';

const planList = ref<any[]>([]);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);

const form = reactive({
  name: '',
  scene: '团建',
  minGuests: 5,
  maxGuests: 20,
  duration: '',
  description: '',
  coverImage: '',
  steps: [] as { time: string; title: string; content: string; tips: string }[],
});

onMounted(() => loadData());

async function loadData() {
  const res: any = await getPlans({ page: 1, pageSize: 50 });
  planList.value = res.list;
}

function openDialog() {
  editingId.value = null;
  Object.assign(form, { name: '', scene: '团建', minGuests: 5, maxGuests: 20, duration: '', description: '', coverImage: '', steps: [] });
  dialogVisible.value = true;
}

function handleEdit(row: any) {
  editingId.value = row.id;
  Object.assign(form, {
    name: row.name,
    scene: row.scene,
    minGuests: row.minGuests,
    maxGuests: row.maxGuests,
    duration: row.duration,
    description: row.description,
    coverImage: row.coverImage || '',
    steps: row.steps?.map((s: any) => ({ time: s.time || '', title: s.title, content: s.content || '', tips: s.tips || '' })) || [],
  });
  dialogVisible.value = true;
}

async function handleSubmit() {
  const data = { ...form };
  if (editingId.value) {
    await updatePlan(editingId.value, data);
    ElMessage.success('更新成功');
  } else {
    await createPlan(data);
    ElMessage.success('创建成功');
  }
  dialogVisible.value = false;
  loadData();
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm('确定删除该方案？', '提示');
  await deletePlan(row.id);
  ElMessage.success('已删除');
  loadData();
}
</script>

<style scoped>
.toolbar { margin-bottom: 16px; }
.step-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: center; }
</style>
