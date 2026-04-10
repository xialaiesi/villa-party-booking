<template>
  <div class="view-toggle">
    <span
      :class="['toggle-btn', { active: modelValue === 'table' }]"
      @click="$emit('update:modelValue', 'table')"
      title="列表视图"
    >
      <el-icon :size="18"><List /></el-icon>
    </span>
    <span
      :class="['toggle-btn', { active: modelValue === 'grid' }]"
      @click="$emit('update:modelValue', 'grid')"
      title="卡片视图"
    >
      <el-icon :size="18"><Grid /></el-icon>
    </span>
  </div>
</template>

<script setup lang="ts">
import { List, Grid } from '@element-plus/icons-vue';
defineProps<{ modelValue: 'table' | 'grid' }>();
defineEmits<{ 'update:modelValue': [value: 'table' | 'grid'] }>();
</script>

<style scoped>
.view-toggle {
  display: inline-flex; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;
}
.toggle-btn {
  padding: 6px 10px; cursor: pointer; color: #94a3b8;
  display: flex; align-items: center; transition: all 0.2s;
}
.toggle-btn:hover { color: #475569; background: #f8fafc; }
.toggle-btn.active { color: #fff; background: #3b82f6; }
.toggle-btn + .toggle-btn { border-left: 1px solid #e2e8f0; }
</style>
