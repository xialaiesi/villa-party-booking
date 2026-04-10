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

        <!-- 财务中心 -->
        <el-menu-item index="/finance">
          <el-icon><Money /></el-icon>
          <span>{{ userStore.isPlatform ? '结算管理' : '财务中心' }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span>{{ route.meta.title }}</span>
        <div class="header-right">
          <span class="user-name">{{ userStore.info?.nickname || userStore.info?.username }}</span>
          <el-button text @click="handleLogout">退出登录</el-button>
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
  List, Present, Service, Star, OfficeBuilding, Money, Brush,
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
.aside { background: #304156; overflow-y: auto; }
.logo { color: #fff; text-align: center; padding: 20px 0; border-bottom: 1px solid #3a4a5e; }
.logo > div:first-child { font-size: 18px; font-weight: bold; }
.role-tag { font-size: 11px; color: #8ba0b4; margin-top: 4px; }
.menu { border-right: none; background: #304156; }
.menu .el-menu-item { color: #bfcbd9; }
.menu .el-menu-item:hover { background: #263445; }
.menu .el-menu-item.is-active { background: #1890ff; color: #fff; }
.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; background: #fff; }
.header-right { display: flex; align-items: center; gap: 16px; }
.user-name { color: #606266; font-size: 14px; }
.main { background: #f0f2f5; }
</style>
