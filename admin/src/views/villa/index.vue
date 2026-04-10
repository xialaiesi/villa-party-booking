<template>
  <div>
    <!-- 顶部操作栏 -->
    <div class="toolbar">
      <el-button type="primary" size="large" @click="openDialog()">
        <el-icon style="margin-right: 6px;"><Plus /></el-icon>
        新增别墅
      </el-button>
      <div class="import-group">
        <div class="import-card" @click="smartImportVisible = true">
          <div class="import-card-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
            <el-icon :size="22"><MagicStick /></el-icon>
          </div>
          <div class="import-card-text">
            <div class="import-card-title">智能导入</div>
            <div class="import-card-desc">图片 + 文案，AI 一键生成</div>
          </div>
        </div>
        <div class="import-card" @click="importVisible = true">
          <div class="import-card-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
            <el-icon :size="22"><Link /></el-icon>
          </div>
          <div class="import-card-text">
            <div class="import-card-title">网页导入</div>
            <div class="import-card-desc">从简篇/美篇链接抓取</div>
          </div>
        </div>
      </div>
      <ViewToggle v-model="viewMode" />
    </div>

    <!-- 表格视图 -->
    <el-table v-if="viewMode === 'table'" :data="villaList" border stripe>
      <el-table-column label="封面" width="100">
        <template #default="{ row }">
          <el-image v-if="row.coverImage" :src="row.coverImage" fit="cover" style="width: 70px; height: 50px; border-radius: 4px;" />
        </template>
      </el-table-column>
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="address" label="地址" />
      <el-table-column prop="maxGuests" label="人数" width="70" align="center" />
      <el-table-column label="平日价" width="90" align="center">
        <template #default="{ row }"><span style="color: #ff6b35; font-weight: 600;">¥{{ row.basePrice }}</span></template>
      </el-table-column>
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
            <span :class="['action-link', row.status === 1 ? 'danger' : 'success']" @click="toggleStatus(row)">
              {{ row.status === 1 ? '下架' : '上架' }}
            </span>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 卡片视图 -->
    <div v-else class="card-grid">
      <div class="item-card" v-for="row in villaList" :key="row.id">
        <div class="card-cover" style="height: 180px;">
          <img v-if="row.coverImage" :src="row.coverImage" />
          <div v-else class="card-empty-cover"><el-icon :size="32"><PictureIcon /></el-icon></div>
          <el-tag class="card-badge" :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
        </div>
        <div class="card-body">
          <div class="card-title">{{ row.name }}</div>
          <div class="card-meta">
            <span>📍 {{ row.address }}</span>
          </div>
          <div class="card-meta">
            <span>👥 {{ row.maxGuests }}人</span>
            <span>🛏 {{ row.bedrooms }}间</span>
          </div>
          <div class="card-price">¥{{ row.basePrice }} <small>起/晚</small></div>
          <div class="card-actions">
            <span class="action-link primary" @click="handleEdit(row)">编辑</span>
            <span :class="['action-link', row.status === 1 ? 'danger' : 'success']" @click="toggleStatus(row)">
              {{ row.status === 1 ? '下架' : '上架' }}
            </span>
          </div>
        </div>
      </div>
    </div>

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
        <el-form-item label="归属商家" v-if="userStore.isPlatform">
          <el-select v-model="form.merchantId" placeholder="请选择商家" style="width: 100%;">
            <el-option v-for="m in merchantOptions" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="容纳人数"><el-input-number v-model="form.maxGuests" :min="1" /></el-form-item>
        <el-form-item label="卧室数"><el-input-number v-model="form.bedrooms" :min="1" /></el-form-item>
        <el-form-item label="面积(㎡)"><el-input-number v-model="form.area" :min="0" /></el-form-item>
        <el-form-item label="平日价"><el-input-number v-model="form.basePrice" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="周末价"><el-input-number v-model="form.weekendPrice" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="押金"><el-input-number v-model="form.deposit" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="标签"><el-input v-model="form.tags" placeholder="团建,生日,聚会" /></el-form-item>

        <el-form-item label="图片">
          <div class="image-section">
            <div class="image-input">
              <el-upload :show-file-list="false" :before-upload="handleUpload" multiple accept="image/*">
                <el-button type="primary" size="small">上传图片</el-button>
              </el-upload>
              <el-input v-model="newImageUrl" placeholder="或输入图片 URL" style="flex: 1; margin-left: 8px;">
                <template #append><el-button @click="addImage">添加</el-button></template>
              </el-input>
            </div>
            <div class="image-list" v-if="imageItems.length">
              <div class="image-item" v-for="(item, index) in imageItems" :key="index">
                <el-image :src="resolveUrl(item.url)" fit="cover" style="width: 100px; height: 75px; border-radius: 4px; cursor: pointer;" :preview-src-list="imageItems.map(i => resolveUrl(i.url))" :initial-index="index" preview-teleported />
                <el-input v-model="item.caption" size="small" placeholder="图片说明" style="flex: 1; margin-left: 8px;" />
                <el-tag v-if="imageAnalysis[index]" size="small" type="info" style="margin-left: 8px;">{{ imageAnalysis[index]?.categoryName }}</el-tag>
                <el-button size="small" text @click="moveUp(index)" :disabled="index === 0" style="margin-left: 4px;">↑</el-button>
                <el-button size="small" text @click="moveDown(index)" :disabled="index === imageItems.length - 1">↓</el-button>
                <el-button size="small" text type="danger" @click="removeImage(index)">删除</el-button>
              </div>
            </div>
            <el-button v-if="imageItems.length > 0" type="warning" size="small" :loading="aiLoading" @click="handleAiAnalyze" style="margin-top: 8px;">AI 智能排版</el-button>
          </div>
        </el-form-item>

        <el-form-item label="描述">
          <div style="width: 100%;">
            <el-input v-model="form.description" type="textarea" :rows="4" placeholder="别墅描述..." />
            <el-button type="warning" size="small" :loading="descLoading" @click="handleAiDescription" style="margin-top: 8px;">AI 生成描述</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 智能导入（图片 + 文案合并） -->
    <el-dialog
      v-model="smartImportVisible"
      title="智能导入"
      width="720px"
      :close-on-click-modal="false"
      @close="handleSmartImportClose"
    >
      <!-- 步骤 1：输入区 -->
      <div class="smart-import-sections">
        <div class="smart-section">
          <div class="smart-section-header">
            <el-icon :size="18" color="#667eea"><Picture /></el-icon>
            <span>上传别墅图片</span>
            <el-tag size="small" type="info">选填</el-tag>
          </div>
          <el-upload
            :auto-upload="false"
            multiple
            accept="image/*"
            :limit="30"
            list-type="picture-card"
            v-model:file-list="smartImportFiles"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">jpg / png / webp，最多 30 张</div>
            </template>
          </el-upload>
        </div>

        <el-divider>
          <el-tag effect="dark" round>图片 + 文案效果更佳</el-tag>
        </el-divider>

        <div class="smart-section">
          <div class="smart-section-header">
            <el-icon :size="18" color="#f5576c"><Document /></el-icon>
            <span>粘贴别墅文案</span>
            <el-tag size="small" type="info">选填</el-tag>
          </div>
          <el-input
            v-model="smartImportText"
            type="textarea"
            :rows="6"
            placeholder="粘贴小红书/公众号/朋友圈的别墅介绍文案，AI 自动提取名称、地址、价格、设施等信息..."
            maxlength="5000"
            show-word-limit
          />
        </div>
      </div>

      <!-- 步骤 2：结果预览 -->
      <div v-if="smartImportResult" class="smart-result">
        <el-divider>
          <el-tag type="success" effect="dark" round>AI 分析结果</el-tag>
        </el-divider>

        <!-- 别墅信息卡 -->
        <div class="result-card">
          <h4>{{ smartImportResult.villa.name }}</h4>
          <div class="result-tags">
            <el-tag v-if="smartImportResult.villa.address" size="small">{{ smartImportResult.villa.address }}</el-tag>
            <el-tag size="small" type="warning">{{ smartImportResult.villa.maxGuests }}人</el-tag>
            <el-tag size="small" type="warning">{{ smartImportResult.villa.bedrooms }}间房</el-tag>
            <el-tag v-if="smartImportResult.villa.area" size="small" type="warning">{{ smartImportResult.villa.area }}㎡</el-tag>
            <el-tag size="small" type="success">¥{{ smartImportResult.villa.basePrice }}/晚</el-tag>
          </div>
          <div v-if="smartImportResult.villa.facilities?.length" class="result-facilities">
            <el-tag v-for="f in smartImportResult.villa.facilities" :key="f" size="small" effect="plain" style="margin: 2px;">{{ f }}</el-tag>
          </div>
          <div v-if="smartImportResult.extra?.highlights?.length" class="result-highlights">
            <span v-for="h in smartImportResult.extra.highlights" :key="h" class="highlight-tag">{{ h }}</span>
          </div>
        </div>

        <!-- 图片预览（有图片时） -->
        <div v-if="smartImportResult.images?.length" class="result-images">
          <div v-for="(img, i) in smartImportResult.images.slice(0, 10)" :key="i" class="result-img-wrap">
            <el-image :src="img.url" fit="cover" class="result-img" />
            <span v-if="img.isCover" class="cover-badge">封面</span>
            <span class="cat-badge">{{ img.categoryName }}</span>
          </div>
          <span v-if="smartImportResult.images.length > 10" class="more-imgs">+{{ smartImportResult.images.length - 10 }}</span>
        </div>
      </div>

      <template #footer>
        <el-button @click="smartImportVisible = false">取消</el-button>
        <el-button
          type="primary"
          size="large"
          :loading="smartImportLoading"
          :disabled="!smartImportFiles.length && !smartImportText.trim()"
          @click="handleSmartImport"
        >
          <el-icon style="margin-right: 4px;"><MagicStick /></el-icon>
          {{ smartImportResult ? '重新分析' : 'AI 分析生成' }}
        </el-button>
        <el-button type="success" size="large" v-if="smartImportResult" @click="handleUseSmartImport">
          使用这些数据创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 从 URL 导入 -->
    <el-dialog v-model="importVisible" title="从网页链接导入" width="600px" :close-on-click-modal="false" @close="handleImportClose">
      <el-alert type="info" :closable="false" style="margin-bottom: 16px;">
        <div>支持简篇、美篇等网页，自动抓取图片和信息</div>
        <div style="color: #999; font-size: 12px; margin-top: 4px;">首次抓取需要 20-60 秒</div>
      </el-alert>
      <el-form label-width="80px">
        <el-form-item label="页面 URL">
          <el-input v-model="importUrl" type="textarea" :rows="2" placeholder="https://www.jianpian.cn/a/xxxxx" />
        </el-form-item>
      </el-form>
      <div v-if="importResult" class="import-preview">
        <el-divider>抓取结果</el-divider>
        <div class="preview-item"><strong>标题：</strong>{{ importResult.title }}</div>
        <div class="preview-item" v-if="importResult.structured">
          <div class="struct-grid">
            <span v-if="importResult.structured.name">{{ importResult.structured.name }}</span>
            <span v-if="importResult.structured.maxGuests">{{ importResult.structured.maxGuests }}人</span>
            <span v-if="importResult.structured.bedrooms">{{ importResult.structured.bedrooms }}间</span>
            <span v-if="importResult.structured.area">{{ importResult.structured.area }}㎡</span>
            <span v-if="importResult.structured.basePrice">¥{{ importResult.structured.basePrice }}</span>
          </div>
        </div>
        <div class="preview-item">
          <strong>图片（{{ importResult.images.length }} 张）</strong>
          <div class="preview-imgs">
            <el-image v-for="(img, i) in importResult.images.slice(0, 6)" :key="i" :src="resolveUrl(img)" fit="cover" style="width: 80px; height: 60px; margin: 4px; border-radius: 4px;" />
            <span v-if="importResult.images.length > 6">+{{ importResult.images.length - 6 }}</span>
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
import { Link, Picture as PictureIcon, Plus, Document, MagicStick } from '@element-plus/icons-vue';
import ViewToggle from '../../components/ViewToggle.vue';
import { getVillas, createVilla, updateVilla, updateVillaStatus } from '../../api/villa';
import { analyzeImages, generateDescription } from '../../api/ai';
import { importFromUrl, importFromImages, importFromText } from '../../api/import';
import { uploadSingle, resolveImageUrl } from '../../api/upload';
import { getMerchants } from '../../api/merchant';
import { useUserStore } from '../../store/user';

const userStore = useUserStore();
const viewMode = ref<'table' | 'grid'>('grid');

interface ImageItem { url: string; caption: string; }

const villaList = ref<any[]>([]);
const page = ref(1);
const pageSize = 10;
const total = ref(0);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const merchantOptions = ref<any[]>([]);

const form = reactive({
  name: '', address: '', maxGuests: 10, bedrooms: 3, area: 200,
  basePrice: 0, weekendPrice: 0, deposit: 0, description: '', tags: '',
  merchantId: null as number | null,
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
  return false;
}

function moveUp(i: number) {
  if (i === 0) return;
  [imageItems.value[i - 1], imageItems.value[i]] = [imageItems.value[i], imageItems.value[i - 1]];
}

function moveDown(i: number) {
  if (i === imageItems.value.length - 1) return;
  [imageItems.value[i + 1], imageItems.value[i]] = [imageItems.value[i], imageItems.value[i + 1]];
}

// ===== 智能导入（图片 + 文案合并）=====
const smartImportVisible = ref(false);
const smartImportFiles = ref<any[]>([]);
const smartImportText = ref('');
const smartImportLoading = ref(false);
const smartImportResult = ref<any>(null);

function handleSmartImportClose() {
  smartImportFiles.value = [];
  smartImportText.value = '';
  smartImportResult.value = null;
}

async function handleSmartImport() {
  const hasFiles = smartImportFiles.value.length > 0;
  const hasText = smartImportText.value.trim().length > 0;
  if (!hasFiles && !hasText) {
    ElMessage.warning('请上传图片或粘贴文案');
    return;
  }

  smartImportLoading.value = true;
  smartImportResult.value = null;

  try {
    let imageResult: any = null;
    let textResult: any = null;

    // 并行：图片上传分析 + 文案解析
    const tasks: Promise<any>[] = [];
    if (hasFiles) {
      tasks.push(
        importFromImages(smartImportFiles.value.map((f: any) => f.raw)).then(r => imageResult = r)
      );
    }
    if (hasText) {
      tasks.push(
        importFromText(smartImportText.value).then(r => textResult = r)
      );
    }
    await Promise.all(tasks);

    // 合并结果：文案数据优先（更准确），图片数据补充
    const villa = { ...(imageResult?.villa || {}), ...(textResult?.villa || {}) };
    // 如果文案没提取到某些字段，用图片分析的
    if (imageResult?.villa) {
      for (const key of Object.keys(imageResult.villa)) {
        if (!villa[key] && imageResult.villa[key]) villa[key] = imageResult.villa[key];
      }
    }
    // 合并设施列表（去重）
    const allFacilities = new Set([
      ...(imageResult?.villa?.facilities || []),
      ...(textResult?.villa?.facilities || []),
    ]);
    villa.facilities = Array.from(allFacilities);

    smartImportResult.value = {
      villa,
      images: imageResult?.images || [],
      stats: imageResult?.stats || {},
      extra: textResult?.extra || {},
    };

    ElMessage.success('分析完成');
  } catch (e: any) {
    ElMessage.error(e.message || '分析失败');
  } finally {
    smartImportLoading.value = false;
  }
}

function handleUseSmartImport() {
  const r = smartImportResult.value;
  if (!r) return;
  const v = r.villa;

  Object.assign(form, {
    name: v.name || '',
    address: v.address || '',
    maxGuests: v.maxGuests || 10,
    bedrooms: v.bedrooms || 3,
    area: v.area || 200,
    basePrice: v.basePrice || 0,
    weekendPrice: v.weekendPrice || 0,
    deposit: v.deposit || 500,
    description: v.description || '',
    tags: v.tags || '团建,聚会',
    merchantId: form.merchantId || merchantOptions.value[0]?.id || null,
  });

  if (r.images?.length) {
    imageItems.value = r.images.map((img: any) => ({ url: img.url, caption: img.caption || '' }));
    imageAnalysis.value = r.images;
  } else {
    imageItems.value = [];
    imageAnalysis.value = [];
  }

  smartImportVisible.value = false;
  editingId.value = null;
  dialogVisible.value = true;
  smartImportFiles.value = [];
  smartImportText.value = '';
  smartImportResult.value = null;

  ElMessage.info(r.images?.length ? '已填入数据，请确认后保存' : '已填入数据，请上传图片后保存');
}

// ===== 从 URL 导入 =====
const importVisible = ref(false);
const importUrl = ref('');
const importLoading = ref(false);
const importResult = ref<any>(null);

function handleImportClose() {
  importResult.value = null;
  importUrl.value = '';
}

async function handleFetchUrl() {
  const url = importUrl.value?.trim().replace(/[\r\n]/g, '');
  if (!url) { ElMessage.warning('请输入 URL'); return; }
  importUrl.value = url;
  importLoading.value = true;
  importResult.value = null;
  try {
    importResult.value = await importFromUrl(url);
    ElMessage.success('抓取成功');
  } catch (e) { /* interceptor handles */ }
  finally { importLoading.value = false; }
}

function handleUseImport() {
  const r = importResult.value;
  if (!r) return;
  const s = r.structured || {};
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
    merchantId: form.merchantId || merchantOptions.value[0]?.id || null,
  });
  imageItems.value = r.images.map((url: string) => ({ url, caption: '' }));
  imageAnalysis.value = [];
  importVisible.value = false;
  editingId.value = null;
  dialogVisible.value = true;
  importResult.value = null;
  importUrl.value = '';
  ElMessage.info('已填入数据，请确认后保存');
}

// ===== 基础操作 =====
onMounted(() => { loadData(); loadMerchants(); });

async function loadData() {
  const res: any = await getVillas({ page: page.value, pageSize });
  villaList.value = res.list;
  total.value = res.total;
}

async function loadMerchants() {
  if (!userStore.isPlatform) return;
  try {
    const res: any = await getMerchants({ page: 1, pageSize: 100 });
    merchantOptions.value = res.list;
    if (merchantOptions.value.length && !form.merchantId) {
      form.merchantId = merchantOptions.value[0].id;
    }
  } catch (e) { console.error(e); }
}

function openDialog() {
  editingId.value = null;
  Object.assign(form, {
    name: '', address: '', maxGuests: 10, bedrooms: 3, area: 200,
    basePrice: 0, weekendPrice: 0, deposit: 0, description: '', tags: '',
    merchantId: merchantOptions.value[0]?.id || null,
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

async function handleAiAnalyze() {
  if (imageItems.value.length === 0) { ElMessage.warning('请先添加图片'); return; }
  aiLoading.value = true;
  try {
    const urls = imageItems.value.map((i) => resolveUrl(i.url));
    const result: any = await analyzeImages(urls);
    const captionMap = new Map(imageItems.value.map((i) => [resolveUrl(i.url), i.caption]));
    imageItems.value = result.map((r: any) => ({
      url: imageItems.value.find((i) => resolveUrl(i.url) === r.url)?.url || r.url,
      caption: captionMap.get(r.url) || '',
    }));
    imageAnalysis.value = result;
    ElMessage.success('图片排版完成');
  } catch (e) { ElMessage.error('AI 分析失败'); }
  finally { aiLoading.value = false; }
}

async function handleAiDescription() {
  if (!form.name) { ElMessage.warning('请先填写别墅名称'); return; }
  descLoading.value = true;
  try {
    const result: any = await generateDescription({
      name: form.name, address: form.address,
      maxGuests: form.maxGuests, bedrooms: form.bedrooms, area: form.area,
    });
    form.description = result.description;
    ElMessage.success('描述已生成');
  } catch (e) { ElMessage.error('AI 生成失败'); }
  finally { descLoading.value = false; }
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
.toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }

/* 智能导入弹窗 */
.smart-import-sections { }
.smart-section { margin-bottom: 8px; }
.smart-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.smart-result { }
.result-card {
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa, #f0f4ff);
  border-radius: 10px;
  margin-bottom: 12px;
}
.result-card h4 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #303133;
}
.result-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.result-facilities {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-bottom: 8px;
}
.result-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.highlight-tag {
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  color: #e65100;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.result-images {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.result-img-wrap {
  position: relative;
  display: inline-block;
}
.result-img {
  width: 90px;
  height: 68px;
  border-radius: 6px;
  object-fit: cover;
}
.cover-badge {
  position: absolute;
  top: 2px;
  left: 2px;
  background: #f56c6c;
  color: #fff;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 4px;
}
.cat-badge {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0,0,0,0.55);
  color: #fff;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 4px;
}
.more-imgs {
  color: #909399;
  font-size: 13px;
}

/* 通用 */
.image-section { width: 100%; }
.image-input { display: flex; gap: 8px; }
.image-list { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.image-item { display: flex; align-items: center; gap: 8px; padding: 8px; background: #fafafa; border-radius: 6px; }
.import-preview { max-height: 400px; overflow-y: auto; }
.preview-item { margin-bottom: 16px; font-size: 14px; }
.struct-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.struct-grid span { background: #f0f9ff; color: #1890ff; padding: 4px 12px; border-radius: 12px; font-size: 12px; }
.import-preview { max-height: 400px; overflow-y: auto; }
.preview-item { margin-bottom: 16px; font-size: 14px; }
</style>
