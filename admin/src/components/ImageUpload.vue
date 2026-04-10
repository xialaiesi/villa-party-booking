<template>
  <div class="image-upload">
    <div class="preview" v-if="modelValue">
      <el-image :src="modelValue" fit="cover" class="preview-img" />
      <div class="preview-actions">
        <el-upload :show-file-list="false" :before-upload="handleUpload" accept="image/*">
          <el-button size="small" type="primary" plain>换图</el-button>
        </el-upload>
        <el-button size="small" type="danger" plain @click="$emit('update:modelValue', '')">移除</el-button>
      </div>
    </div>
    <el-upload v-else :show-file-list="false" :before-upload="handleUpload" accept="image/*" class="upload-trigger">
      <div class="upload-placeholder">
        <el-icon :size="28"><Plus /></el-icon>
        <span>上传图片</span>
      </div>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { uploadSingle } from '../api/upload';

defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

async function handleUpload(file: File) {
  try {
    const res = await uploadSingle(file);
    emit('update:modelValue', res.url);
    ElMessage.success('上传成功');
  } catch {
    ElMessage.error('上传失败');
  }
  return false;
}
</script>

<style scoped>
.image-upload { width: 100%; }
.preview { display: flex; align-items: center; gap: 12px; }
.preview-img { width: 160px; height: 100px; border-radius: 8px; flex-shrink: 0; }
.preview-actions { display: flex; flex-direction: column; gap: 6px; }
.upload-trigger { width: 160px; }
.upload-placeholder {
  width: 160px; height: 100px; border: 2px dashed #dcdfe6; border-radius: 8px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; color: #94a3b8; cursor: pointer; transition: all 0.2s;
}
.upload-placeholder:hover { border-color: #409eff; color: #409eff; }
.upload-placeholder span { font-size: 12px; }
</style>
