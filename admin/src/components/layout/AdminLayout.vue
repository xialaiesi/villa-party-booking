<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="logo">别墅轰趴</div>
      <el-menu :default-active="route.path" router class="menu">
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据看板</span>
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
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <span>{{ route.meta.title }}</span>
        <el-button text @click="handleLogout">退出登录</el-button>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { DataAnalysis, House, Calendar, ShoppingBag, Document, Setting, List, Present } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();

function handleLogout() {
  localStorage.removeItem('admin_token');
  router.push('/login');
}
</script>

<style scoped>
.layout { height: 100vh; }
.aside { background: #304156; overflow-y: auto; }
.logo { color: #fff; font-size: 18px; font-weight: bold; text-align: center; padding: 20px 0; border-bottom: 1px solid #3a4a5e; }
.menu { border-right: none; background: #304156; }
.menu .el-menu-item { color: #bfcbd9; }
.menu .el-menu-item:hover { background: #263445; }
.menu .el-menu-item.is-active { background: #1890ff; color: #fff; }
.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; background: #fff; }
.main { background: #f0f2f5; }
</style>
