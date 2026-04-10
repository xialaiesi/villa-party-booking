<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <div>别墅轰趴</div>
        <div class="role-tag">{{ roleLabel }}</div>
      </div>
      <el-menu :default-active="route.path" router class="menu">
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据看板</span>
        </el-menu-item>

        <!-- 平台超管专属 -->
        <el-menu-item v-if="userStore.isPlatform" index="/merchant">
          <el-icon><OfficeBuilding /></el-icon>
          <span>商家管理</span>
        </el-menu-item>

        <el-menu-item index="/site-config">
          <el-icon><Brush /></el-icon>
          <span>站点配置</span>
        </el-menu-item>
        <el-menu-item index="/villa">
          <el-icon><House /></el-icon>
          <span>房源管理</span>
        </el-menu-item>
        <el-menu-item index="/calendar">
          <el-icon><Calendar /></el-icon>
          <span>房态管理</span>
        </el-menu-item>
        <el-menu-item index="/package">
          <el-icon><ShoppingBag /></el-icon>
          <span>套餐管理</span>
        </el-menu-item>
        <el-menu-item index="/order">
          <el-icon><Document /></el-icon>
          <span>订单管理</span>
        </el-menu-item>
        <el-menu-item index="/facility">
          <el-icon><Setting /></el-icon>
          <span>设施管理</span>
        </el-menu-item>
        <el-menu-item index="/activity-plan">
          <el-icon><List /></el-icon>
          <span>活动方案</span>
        </el-menu-item>
        <el-menu-item index="/theme-pack">
          <el-icon><Present /></el-icon>
          <span>氛围包</span>
        </el-menu-item>
        <el-menu-item index="/local-service">
          <el-icon><Service /></el-icon>
          <span>周边服务</span>
        </el-menu-item>
        <el-menu-item index="/seasonal-event">
          <el-icon><Star /></el-icon>
          <span>限定活动</span>
        </el-menu-item>
        <el-menu-item index="/album">
          <el-icon><PictureFilled /></el-icon>
          <span>共享相册</span>
        </el-menu-item>

        <!-- 财务中心 -->
        <el-menu-item index="/finance">
          <el-icon><Money /></el-icon>
          <span>{{ userStore.isPlatform ? '结算管理' : '财务中心' }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span class="header-title">{{ route.meta.title }}</span>
        <div class="header-right">
          <div class="user-avatar">{{ (userStore.info?.nickname || userStore.info?.username || 'A').charAt(0) }}</div>
          <span class="user-name">{{ userStore.info?.nickname || userStore.info?.username }}</span>
          <span class="logout-link" @click="handleLogout">退出</span>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  DataAnalysis, House, Calendar, ShoppingBag, Document, Setting,
  List, Present, Service, Star, OfficeBuilding, Money, Brush, PictureFilled,
} from '@element-plus/icons-vue';
import { useUserStore } from '../../store/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const roleLabel = computed(() => {
  if (userStore.isPlatform) return '平台超管';
  if (userStore.isMerchant) return userStore.info?.merchantName || '商家';
  return '';
});

function handleLogout() {
  userStore.clear();
  router.push('/login');
}
</script>

<style scoped>
.layout { height: 100vh; }
.aside { background: #1e293b; overflow-y: auto; }
.aside::-webkit-scrollbar { width: 0; }
.logo {
  color: #fff; text-align: center; padding: 24px 0 20px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.logo > div:first-child { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
.role-tag {
  display: inline-block; font-size: 10px; color: #94a3b8; margin-top: 6px;
  background: rgba(255,255,255,0.08); padding: 2px 10px; border-radius: 10px;
}
.menu { border-right: none; background: #1e293b; }
.menu .el-menu-item {
  color: #94a3b8; margin: 2px 8px; border-radius: 8px;
  height: 44px; line-height: 44px; font-size: 14px;
}
.menu .el-menu-item:hover { background: rgba(255,255,255,0.06); color: #e2e8f0; }
.menu .el-menu-item.is-active {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff; font-weight: 600;
}
.header {
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #f0f0f0; background: #fff;
  padding: 0 24px; height: 56px;
}
.header-title { font-size: 16px; font-weight: 600; color: #1e293b; }
.header-right { display: flex; align-items: center; gap: 12px; }
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #fff; font-size: 14px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
}
.user-name { color: #475569; font-size: 14px; }
.logout-link {
  color: #94a3b8; font-size: 13px; cursor: pointer;
  padding: 4px 10px; border-radius: 6px; transition: all 0.2s;
}
.logout-link:hover { color: #ef4444; background: #fef2f2; }
.main { background: #f1f5f9; padding: 24px; }
</style>
