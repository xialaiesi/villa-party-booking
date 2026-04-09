<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="openDialog()">新增别墅</el-button>
      <el-button type="success" @click="importVisible = true">
        <el-icon style="margin-right: 4px;"><Link /></el-icon>
        从 URL 导入
      </el-button>
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
              <el-upload
                :show-file-list="false"
                :before-upload="handleUpload"
                multiple
                accept="image/*"
              >
                <el-button type="primary" size="small">📷 上传图片</el-button>
              </el-upload>
              <el-input v-model="newImageUrl" placeholder="或输入图片 URL" style="flex: 1; margin-left: 8px;">
                <template #append>
                  <el-button @click="addImage">添加</el-button>
                </template>
              </el-input>
            </div>
            <div class="image-list" v-if="imageItems.length">
              <div class="image-item" v-for="(item, index) in imageItems" :key="index">
                <el-image
                  :src="resolveUrl(item.url)"
                  fit="cover"
                  style="width: 100px; height: 75px; border-radius: 4px; cursor: pointer;"
                  :preview-src-list="imageItems.map(i => resolveUrl(i.url))"
                  :initial-index="index"
                  preview-teleported
                />
                <el-input
                  v-model="item.caption"
                  size="small"
                  placeholder="图片说明（可选，如：客厅 30 平米配投影仪）"
                  style="flex: 1; margin-left: 8px;"
                />
                <el-tag v-if="imageAnalysis[index]" size="small" type="info" style="margin-left: 8px;">
                  {{ imageAnalysis[index]?.categoryName }}
                </el-tag>
                <el-button size="small" text @click="moveUp(index)" :disabled="index === 0" style="margin-left: 4px;">↑</el-button>
                <el-button size="small" text @click="moveDown(index)" :disabled="index === imageItems.length - 1">↓</el-button>
                <el-button size="small" text type="danger" @click="removeImage(index)">删除</el-button>
              </div>
            </div>
            <el-button
              v-if="imageItems.length > 0"
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

    <!-- 从 URL 导入 -->
    <el-dialog v-model="importVisible" title="从 URL 导入别墅信息" width="600px">
      <el-alert
        type="info"
        :closable="false"
        style="margin-bottom: 16px;"
      >
        <div>支持从简篇、美篇等网页导入：</div>
        <div>✅ 启动浏览器模拟滚动，处理懒加载图片</div>
        <div>✅ 自动下载图片到服务器，解决防盗链</div>
        <div>⚠️ 首次抓取较慢（20-60 秒），请耐心等待</div>
      </el-alert>
      <el-form label-width="80px">
        <el-form-item label="页面 URL">
          <el-input
            v-model="importUrl"
            type="textarea"
            :rows="2"
            placeholder="如：https://www.jianpian.cn/a/xxxxx"
          />
        </el-form-item>
      </el-form>

      <div v-if="importResult" class="import-preview">
        <el-divider>抓取结果</el-divider>
        <div class="preview-item">
          <strong>标题：</strong>{{ importResult.title }}
        </div>
        <div class="preview-item" v-if="importResult.structured">
          <strong>识别信息：</strong>
          <div class="struct-grid">
            <span v-if="importResult.structured.name">名称：{{ importResult.structured.name }}</span>
            <span v-if="importResult.structured.maxGuests">人数：{{ importResult.structured.maxGuests }}人</span>
            <span v-if="importResult.structured.bedrooms">卧室：{{ importResult.structured.bedrooms }}间</span>
            <span v-if="importResult.structured.area">面积：{{ importResult.structured.area }}㎡</span>
            <span v-if="importResult.structured.basePrice">价格：¥{{ importResult.structured.basePrice }}</span>
            <span v-if="importResult.structured.facilities?.length">设施：{{ importResult.structured.facilities.join('/') }}</span>
          </div>
        </div>
        <div class="preview-item">
          <strong>图片（{{ importResult.images.length }} 张）：</strong>
          <div class="preview-imgs">
            <el-image
              v-for="(img, i) in importResult.images.slice(0, 6)"
              :key="i"
              :src="img"
              fit="cover"
              style="width: 80px; height: 60px; margin: 4px; border-radius: 4px;"
              :preview-src-list="importResult.images"
              :initial-index="i"
            />
            <span v-if="importResult.images.length > 6">...+{{ importResult.images.length - 6 }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" :loading="importLoading" @click="handleFetchUrl">抓取</el-button>
        <el-button type="success" v-if="importResult" @click="handleUseImport">使用这些数据创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { Link } from '@element-plus/icons-vue';
import { getVillas, createVilla, updateVilla, updateVillaStatus } from '../../api/villa';
import { analyzeImages, generateDescription } from '../../api/ai';
import { importFromUrl } from '../../api/import';
import { uploadSingle, resolveImageUrl } from '../../api/upload';

interface ImageItem { url: string; caption: string; }

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

const imageItems = ref<ImageItem[]>([]);
const imageAnalysis = ref<any[]>([]);
const newImageUrl = ref('');
const aiLoading = ref(false);
const descLoading = ref(false);

const resolveUrl = resolveImageUrl;

async function handleUpload(file: File) {
  try {
    const res = await uploadSingle(file);
    imageItems.value.push({ url: res.url, caption: '' });
    ElMessage.success('上传成功');
  } catch (e) {
    ElMessage.error('上传失败');
  }
  return false; // 阻止 el-upload 默认上传
}

function moveUp(i: number) {
  if (i === 0) return;
  [imageItems.value[i - 1], imageItems.value[i]] = [imageItems.value[i], imageItems.value[i - 1]];
}

function moveDown(i: number) {
  if (i === imageItems.value.length - 1) return;
  [imageItems.value[i + 1], imageItems.value[i]] = [imageItems.value[i], imageItems.value[i + 1]];
}

// 从 URL 导入
const importVisible = ref(false);
const importUrl = ref('');
const importLoading = ref(false);
const importResult = ref<any>(null);

async function handleFetchUrl() {
  if (!importUrl.value) {
    ElMessage.warning('请输入 URL');
    return;
  }
  importLoading.value = true;
  importResult.value = null;
  try {
    importResult.value = await importFromUrl(importUrl.value);
    ElMessage.success('抓取成功，请预览确认');
  } catch (e) {
    // 错误由拦截器处理
  } finally {
    importLoading.value = false;
  }
}

function handleUseImport() {
  const r = importResult.value;
  if (!r) return;
  const s = r.structured || {};

  // 填入表单
  Object.assign(form, {
    name: s.name || r.title || '',
    address: s.address || '',
    maxGuests: s.maxGuests || 10,
    bedrooms: s.bedrooms || 3,
    area: s.area || 200,
    basePrice: s.basePrice || 0,
    weekendPrice: s.weekendPrice || (s.basePrice ? Math.round(s.basePrice * 1.3) : 0),
    deposit: s.deposit || 500,
    description: s.summary || r.description || '',
    tags: s.tags || '团建,生日,聚会',
  });

  // 填入图片
  imageItems.value = r.images.map((url: string) => ({ url, caption: '' }));
  imageAnalysis.value = [];

  // 关闭导入弹窗，打开编辑弹窗
  importVisible.value = false;
  editingId.value = null;
  dialogVisible.value = true;
  importResult.value = null;
  importUrl.value = '';

  ElMessage.info('已填入数据，请确认后保存');
}

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
  imageItems.value = [];
  imageAnalysis.value = [];
  dialogVisible.value = true;
}

function handleEdit(row: any) {
  editingId.value = row.id;
  Object.assign(form, row);
  imageItems.value = row.images?.map((img: any) => ({ url: img.url, caption: img.caption || '' })) || [];
  imageAnalysis.value = [];
  dialogVisible.value = true;
}

function addImage() {
  if (!newImageUrl.value) return;
  imageItems.value.push({ url: newImageUrl.value, caption: '' });
  newImageUrl.value = '';
}

function removeImage(index: number) {
  imageItems.value.splice(index, 1);
  imageAnalysis.value.splice(index, 1);
}

/** AI 智能排版：分析图片并重新排序 */
async function handleAiAnalyze() {
  if (imageItems.value.length === 0) {
    ElMessage.warning('请先添加图片');
    return;
  }
  aiLoading.value = true;
  try {
    const urls = imageItems.value.map((i) => resolveUrl(i.url));
    const result: any = await analyzeImages(urls);
    // 按 AI 建议重新排序（保留原 caption）
    const captionMap = new Map(imageItems.value.map((i) => [resolveUrl(i.url), i.caption]));
    imageItems.value = result.map((r: any) => ({
      url: imageItems.value.find((i) => resolveUrl(i.url) === r.url)?.url || r.url,
      caption: captionMap.get(r.url) || '',
    }));
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
    images: imageItems.value,
    coverImage: imageItems.value[0]?.url || '',
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
.import-preview { max-height: 400px; overflow-y: auto; }
.preview-item { margin-bottom: 16px; font-size: 14px; }
.struct-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }
.struct-grid span { background: #f0f9ff; color: #1890ff; padding: 4px 12px; border-radius: 12px; font-size: 12px; }
.preview-imgs { display: flex; flex-wrap: wrap; margin-top: 8px; align-items: center; }
</style>
