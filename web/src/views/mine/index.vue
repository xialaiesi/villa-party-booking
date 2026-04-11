<template>
  <div class="container mine-page">
    <div class="header">
      <img v-if="userStore.info?.avatar" :src="userStore.info.avatar" class="avatar" />
      <div v-else class="avatar avatar-letter">{{ (userStore.info?.nickname || '我').charAt(0) }}</div>
      <div class="info">
        <div class="nickname">{{ userStore.info?.nickname || '用户' }}</div>
        <div class="phone">{{ userStore.info?.phone || '' }}</div>
      </div>
    </div>

    <div class="menu-grid">
      <router-link to="/order" class="menu-item">
        <el-icon size="32"><Document /></el-icon>
        <span>我的订单</span>
      </router-link>
      <div class="menu-item" @click="todo">
        <el-icon size="32"><Star /></el-icon>
        <span>我的收藏</span>
      </div>
      <div class="menu-item" @click="todo">
        <el-icon size="32"><ChatDotRound /></el-icon>
        <span>消息中心</span>
      </div>
      <div class="menu-item" @click="todo">
        <el-icon size="32"><Setting /></el-icon>
        <span>账号设置</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Document, Star, ChatDotRound, Setting } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../../store/user';

const userStore = useUserStore();

function todo() { ElMessage.info('功能开发中'); }
</script>

<style scoped>
.mine-page { padding: 30px 0 60px; max-width: 900px; }

.header {
  background: linear-gradient(135deg, #ff6b35, #ff8f65);
  padding: 40px; border-radius: 12px; color: #fff;
  display: flex; gap: 20px; align-items: center;
  margin-bottom: 30px;
}
.avatar {
  width: 80px; height: 80px; border-radius: 50%;
  background: #fff; border: 3px solid rgba(255,255,255,0.3);
}
.avatar-letter { display: flex; align-items: center; justify-content: center; background: #e0e7ff; color: #4f46e5; font-size: 32px; font-weight: 600; }
.nickname { font-size: 22px; font-weight: bold; }
.phone { font-size: 14px; opacity: 0.8; margin-top: 4px; }

.menu-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
}
.menu-item {
  background: #fff; border-radius: 12px; padding: 40px 0;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  cursor: pointer; transition: all 0.2s;
  color: #333;
}
.menu-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  color: #ff6b35;
}
</style>
