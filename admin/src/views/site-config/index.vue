<template>
  <div>
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 首页 Hero 区域 -->
      <el-tab-pane label="首页横幅" name="hero">
        <el-form label-width="120px" style="max-width: 600px;">
          <el-form-item label="主标题">
            <el-input v-model="config.hero_title" placeholder="找到你的完美别墅趴场地" />
          </el-form-item>
          <el-form-item label="副标题">
            <el-input v-model="config.hero_subtitle" placeholder="团建 · 生日 · 聚会 · 亲子 · 一站式解决" />
          </el-form-item>
          <el-form-item label="背景样式">
            <div class="bg-options">
              <div
                v-for="bg in bgPresets"
                :key="bg.value"
                :class="['bg-option', { active: config.hero_bg === bg.value }]"
                :style="{ background: bg.value }"
                @click="config.hero_bg = bg.value"
              >
                <span>{{ bg.label }}</span>
              </div>
            </div>
            <el-input v-model="config.hero_bg" placeholder="CSS 渐变或颜色值" style="margin-top: 8px;" />
          </el-form-item>
          <el-form-item label="背景图片">
            <div class="upload-preview">
              <el-image v-if="config.hero_image" :src="config.hero_image" fit="cover" class="preview-thumb" />
              <el-upload :show-file-list="false" :before-upload="(f: File) => handleUploadField(f, 'hero_image')" accept="image/*">
                <el-button size="small" type="primary">{{ config.hero_image ? '更换' : '上传' }}</el-button>
              </el-upload>
              <el-button v-if="config.hero_image" size="small" text type="danger" @click="config.hero_image = ''">移除</el-button>
            </div>
            <div class="field-tip">上传后将覆盖渐变背景</div>
          </el-form-item>
          <el-form-item label="效果预览">
            <div class="hero-preview" :style="heroPreviewStyle">
              <h2>{{ config.hero_title || '主标题' }}</h2>
              <p>{{ config.hero_subtitle || '副标题' }}</p>
            </div>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 轮播图 -->
      <el-tab-pane label="轮播图" name="banners">
        <div class="banner-list">
          <div v-for="(b, i) in bannerList" :key="i" class="banner-item">
            <el-image v-if="b.image" :src="b.image" fit="cover" class="banner-thumb" />
            <div class="banner-info">
              <el-input v-model="b.title" placeholder="标题（可选）" size="small" />
              <el-input v-model="b.link" placeholder="跳转链接（可选）" size="small" style="margin-top: 4px;" />
              <div style="margin-top: 6px; display: flex; gap: 6px;">
                <el-upload :show-file-list="false" :before-upload="(f: File) => handleBannerUpload(f, i)" accept="image/*">
                  <el-button size="small" type="primary">{{ b.image ? '换图' : '上传' }}</el-button>
                </el-upload>
                <el-button size="small" text type="danger" @click="bannerList.splice(i, 1)">删除</el-button>
              </div>
            </div>
          </div>
          <div class="banner-add" @click="bannerList.push({ image: '', title: '', link: '' })">
            <el-icon :size="24"><Plus /></el-icon>
            <span>添加轮播图</span>
          </div>
        </div>
      </el-tab-pane>

      <!-- 场景标签 -->
      <el-tab-pane label="场景标签" name="tags">
        <el-form label-width="120px" style="max-width: 600px;">
          <el-form-item label="首页场景标签">
            <div class="tag-editor">
              <el-tag
                v-for="(t, i) in sceneTagList"
                :key="i"
                closable
                @close="sceneTagList.splice(i, 1)"
                style="margin: 4px;"
              >
                {{ t }}
              </el-tag>
              <el-input
                v-if="tagInputVisible"
                ref="tagInputRef"
                v-model="tagInputVal"
                size="small"
                style="width: 100px;"
                @keyup.enter="addTag"
                @blur="addTag"
              />
              <el-button v-else size="small" @click="showTagInput">+ 添加</el-button>
            </div>
            <div class="field-tip">用户在首页看到的场景入口（如 团建聚会、生日派对）</div>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 底部文字 -->
      <el-tab-pane label="其他" name="other">
        <el-form label-width="120px" style="max-width: 600px;">
          <el-form-item label="页脚文字">
            <el-input v-model="config.footer_text" type="textarea" :rows="2" placeholder="底部版权信息或联系方式" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <div class="save-bar">
      <el-button type="primary" size="large" :loading="saving" @click="handleSave">保存配置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import request from '../../utils/request';
import { uploadSingle } from '../../api/upload';

const activeTab = ref('hero');
const saving = ref(false);

const config = reactive<Record<string, string>>({
  hero_title: '',
  hero_subtitle: '',
  hero_bg: '',
  hero_image: '',
  banners: '[]',
  scene_tags: '[]',
  footer_text: '',
});

const bannerList = ref<{ image: string; title: string; link: string }[]>([]);
const sceneTagList = ref<string[]>([]);
const tagInputVisible = ref(false);
const tagInputVal = ref('');
const tagInputRef = ref<any>(null);

const bgPresets = [
  { label: '活力橙', value: 'linear-gradient(135deg, #ff6b35, #ff8f65)' },
  { label: '清新蓝', value: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { label: '森林绿', value: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  { label: '浪漫粉', value: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { label: '暗夜紫', value: 'linear-gradient(135deg, #2b5876, #4e4376)' },
  { label: '暖阳黄', value: 'linear-gradient(135deg, #f2994a, #f2c94c)' },
];

const heroPreviewStyle = computed(() => {
  const style: any = {};
  if (config.hero_image) {
    style.backgroundImage = `url(${config.hero_image})`;
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
  } else {
    style.background = config.hero_bg || 'linear-gradient(135deg, #ff6b35, #ff8f65)';
  }
  return style;
});

onMounted(async () => {
  try {
    const data: any = await request.get('/api/admin/site-config');
    Object.assign(config, data);
    try { bannerList.value = JSON.parse(config.banners || '[]'); } catch { bannerList.value = []; }
    try { sceneTagList.value = JSON.parse(config.scene_tags || '[]'); } catch { sceneTagList.value = []; }
  } catch (e) { console.error(e); }
});

async function handleUploadField(file: File, field: string) {
  try {
    const res = await uploadSingle(file);
    config[field] = res.url;
    ElMessage.success('上传成功');
  } catch { ElMessage.error('上传失败'); }
  return false;
}

async function handleBannerUpload(file: File, index: number) {
  try {
    const res = await uploadSingle(file);
    bannerList.value[index].image = res.url;
    ElMessage.success('上传成功');
  } catch { ElMessage.error('上传失败'); }
  return false;
}

function showTagInput() {
  tagInputVisible.value = true;
  nextTick(() => tagInputRef.value?.focus());
}

function addTag() {
  const v = tagInputVal.value.trim();
  if (v && !sceneTagList.value.includes(v)) {
    sceneTagList.value.push(v);
  }
  tagInputVisible.value = false;
  tagInputVal.value = '';
}

async function handleSave() {
  saving.value = true;
  try {
    config.banners = JSON.stringify(bannerList.value);
    config.scene_tags = JSON.stringify(sceneTagList.value);
    await request.put('/api/admin/site-config', config);
    ElMessage.success('保存成功');
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.bg-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.bg-option {
  width: 80px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}
.bg-option span {
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
.bg-option.active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
}
.bg-option:hover { transform: scale(1.05); }

.hero-preview {
  width: 100%;
  height: 120px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.hero-preview h2 { margin: 0; font-size: 20px; }
.hero-preview p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }

.upload-preview {
  display: flex;
  align-items: center;
  gap: 8px;
}
.preview-thumb {
  width: 120px;
  height: 60px;
  border-radius: 6px;
}
.field-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 轮播图 */
.banner-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.banner-item {
  width: 280px;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  overflow: hidden;
  background: #fafafa;
}
.banner-thumb {
  width: 100%;
  height: 140px;
  display: block;
}
.banner-info {
  padding: 10px;
}
.banner-add {
  width: 280px;
  height: 200px;
  border: 2px dashed #dcdfe6;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #909399;
  cursor: pointer;
  transition: all 0.2s;
}
.banner-add:hover {
  border-color: #409eff;
  color: #409eff;
}

/* 标签编辑 */
.tag-editor {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

/* 保存栏 */
.save-bar {
  margin-top: 24px;
  padding: 16px 0;
  border-top: 1px solid #ebeef5;
}
</style>
