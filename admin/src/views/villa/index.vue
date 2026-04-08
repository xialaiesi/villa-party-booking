<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openDialog()">新增别墅</el-button>
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

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" title="别墅信息" width="700px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="容纳人数"><el-input-number v-model="form.maxGuests" :min="1" /></el-form-item>
        <el-form-item label="卧室数"><el-input-number v-model="form.bedrooms" :min="1" /></el-form-item>
        <el-form-item label="面积(㎡)"><el-input-number v-model="form.area" :min="0" /></el-form-item>
        <el-form-item label="平日价"><el-input-number v-model="form.basePrice" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="周末价"><el-input-number v-model="form.weekendPrice" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="押金"><el-input-number v-model="form.deposit" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="标签"><el-input v-model="form.tags" placeholder="团建,生日,聚会" /></el-form-item>

        <!-- 图片管理 -->
        <el-form-item label="图片">
          <div class="image-section">
            <div class="image-input">
              <el-input v-model="newImageUrl" placeholder="输入图片 URL" style="flex: 1">
                <template #append>
                  <el-button @click="addImage">添加</el-button>
                </template>
              </el-input>
            </div>
            <div class="image-list" v-if="imageUrls.length">
              <div class="image-item" v-for="(url, index) in imageUrls" :key="index">
                <el-image :src="url" fit="cover" style="width: 80px; height: 60px; border-radius: 4px;" />
                <el-tag v-if="imageAnalysis[index]" size="small" type="info" style="margin-left: 8px;">
                  {{ imageAnalysis[index]?.categoryName }}
                </el-tag>
                <el-tag v-if="imageAnalysis[index]?.isCover" size="small" type="success" style="margin-left: 4px;">
                  封面
                </el-tag>
                <el-button size="small" text type="danger" @click="removeImage(index)" style="margin-left: auto;">删除</el-button>
              </div>
            </div>
            <el-button
              v-if="imageUrls.length > 0"
              type="warning"
              size="small"
              :loading="aiLoading"
              @click="handleAiAnalyze"
              style="margin-top: 8px;"
            >
              AI 智能排版
            </el-button>
          </div>
        </el-form-item>

        <!-- 描述 + AI 生成 -->
        <el-form-item label="描述">
          <div style="width: 100%;">
            <el-input v-model="form.description" type="textarea" :rows="4" placeholder="别墅描述..." />
            <el-button
              type="warning"
              size="small"
              :loading="descLoading"
              @click="handleAiDescription"
              style="margin-top: 8px;"
            >
              AI 生成描述
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
import { ref, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { getVillas, createVilla, updateVilla, updateVillaStatus } from '../../api/villa';
import { analyzeImages, generateDescription } from '../../api/ai';

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

const imageUrls = ref<string[]>([]);
const imageAnalysis = ref<any[]>([]);
const newImageUrl = ref('');
const aiLoading = ref(false);
const descLoading = ref(false);

onMounted(() => loadData());

async function loadData() {
  const res: any = await getVillas({ page: page.value, pageSize });
  villaList.value = res.list;
  total.value = res.total;
}

function openDialog() {
  editingId.value = null;
  Object.assign(form, {
    name: '', address: '', maxGuests: 10, bedrooms: 3, area: 200,
    basePrice: 0, weekendPrice: 0, deposit: 0, description: '', tags: '',
  });
  imageUrls.value = [];
  imageAnalysis.value = [];
  dialogVisible.value = true;
}

function handleEdit(row: any) {
  editingId.value = row.id;
  Object.assign(form, row);
  imageUrls.value = row.images?.map((img: any) => img.url) || [];
  imageAnalysis.value = [];
  dialogVisible.value = true;
}

function addImage() {
  if (!newImageUrl.value) return;
  imageUrls.value.push(newImageUrl.value);
  newImageUrl.value = '';
}

function removeImage(index: number) {
  imageUrls.value.splice(index, 1);
  imageAnalysis.value.splice(index, 1);
}

/** AI 智能排版：分析图片并重新排序 */
async function handleAiAnalyze() {
  if (imageUrls.value.length === 0) {
    ElMessage.warning('请先添加图片');
    return;
  }
  aiLoading.value = true;
  try {
    const result: any = await analyzeImages(imageUrls.value);
    // 按 AI 建议重新排序
    imageUrls.value = result.map((r: any) => r.url);
    imageAnalysis.value = result;
    ElMessage.success('图片排版完成');
  } catch (e) {
    ElMessage.error('AI 分析失败，请检查 API 配置');
  } finally {
    aiLoading.value = false;
  }
}

/** AI 生成描述 */
async function handleAiDescription() {
  if (!form.name) {
    ElMessage.warning('请先填写别墅名称');
    return;
  }
  descLoading.value = true;
  try {
    const result: any = await generateDescription({
      name: form.name,
      address: form.address,
      maxGuests: form.maxGuests,
      bedrooms: form.bedrooms,
      area: form.area,
    });
    form.description = result.description;
    ElMessage.success('描述已生成');
  } catch (e) {
    ElMessage.error('AI 生成失败，请检查 API 配置');
  } finally {
    descLoading.value = false;
  }
}

async function handleSubmit() {
  const data: any = {
    ...form,
    images: imageUrls.value,
    coverImage: imageAnalysis.value.find((a: any) => a.isCover)?.url || imageUrls.value[0] || '',
  };

  if (editingId.value) {
    await updateVilla(editingId.value, data);
    ElMessage.success('更新成功');
  } else {
    await createVilla(data);
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
.image-section { width: 100%; }
.image-input { display: flex; gap: 8px; }
.image-list { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.image-item { display: flex; align-items: center; gap: 8px; padding: 8px; background: #fafafa; border-radius: 6px; }
</style>
