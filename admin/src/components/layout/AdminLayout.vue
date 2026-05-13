<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <div>别墅轰趴</div>
        <div class="role-tag">{{ roleLabel }}</div>
      </div>
      <el-menu :default-active="route.path" router class="menu" :default-openeds="defaultOpeneds">
        <!-- 核心运营 -->
        <el-sub-menu index="group-core">
          <template #title>
            <el-icon><DataAnalysis /></el-icon>
            <span>核心运营</span>
          </template>
          <el-menu-item index="/dashboard">
            <span>数据看板</span>
          </el-menu-item>
          <el-menu-item index="/analytics">
            <span>流量分析</span>
          </el-menu-item>
          <el-menu-item index="/villa">
            <span>房源管理</span>
          </el-menu-item>
          <el-menu-item index="/calendar">
            <span>房态管理</span>
          </el-menu-item>
          <el-menu-item index="/order">
            <span>订单管理</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 商品配置 -->
        <el-sub-menu index="group-product">
          <template #title>
            <el-icon><ShoppingBag /></el-icon>
            <span>商品配置</span>
          </template>
          <el-menu-item index="/package">
            <span>套餐管理</span>
          </el-menu-item>
          <el-menu-item index="/facility">
            <span>设施管理</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 增值服务 -->
        <el-sub-menu index="group-addon">
          <template #title>
            <el-icon><Present /></el-icon>
            <span>增值服务</span>
          </template>
          <el-menu-item index="/activity-plan">
            <span>活动方案</span>
          </el-menu-item>
          <el-menu-item index="/theme-pack">
            <span>氛围包</span>
          </el-menu-item>
          <el-menu-item index="/local-service">
            <span>周边服务</span>
          </el-menu-item>
          <el-menu-item index="/seasonal-event">
            <span>限定活动</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 内容管理 -->
        <el-sub-menu index="group-content">
          <template #title>
            <el-icon><PictureFilled /></el-icon>
            <span>内容管理</span>
          </template>
          <el-menu-item index="/album">
            <span>共享相册</span>
          </el-menu-item>
          <el-menu-item index="/review">
            <span>评价管理</span>
            <el-badge v-if="pendingReviewCount > 0" :value="pendingReviewCount" :max="99" class="menu-badge" />
          </el-menu-item>
        </el-sub-menu>

        <!-- 系统管理 -->
        <el-sub-menu index="group-system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/site-config">
            <span>站点配置</span>
          </el-menu-item>
          <el-menu-item v-if="userStore.isPlatform" index="/merchant">
            <span>商家管理</span>
          </el-menu-item>
          <el-menu-item index="/finance">
            <span>{{ userStore.isPlatform ? '结算管理' : '财务中心' }}</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span class="header-title">{{ route.meta.title }}</span>
          <el-breadcrumb separator="/" class="header-breadcrumb">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="parentMenu">{{ parentMenu }}</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.path !== '/dashboard'">{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-popover placement="bottom-end" :width="360" trigger="click" @show="loadMessages">
            <template #reference>
              <div class="notify-btn">
                <el-icon :size="20"><Bell /></el-icon>
                <span v-if="unreadCount > 0" class="notify-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
              </div>
            </template>
            <div class="notify-panel">
              <div class="notify-header">
                <span>消息通知</span>
                <span class="notify-read-all" @click="markAllRead" v-if="unreadCount > 0">全部已读</span>
              </div>
              <div class="notify-list" v-if="messages.length">
                <div
                  v-for="m in messages"
                  :key="m.id"
                  class="notify-item"
                  :class="{ unread: !m.read }"
                  @click="handleClickMsg(m)"
                >
                  <div class="notify-title">{{ m.title }}</div>
                  <div class="notify-content">{{ m.content }}</div>
                  <div class="notify-time">{{ fmtTime(m.createdAt) }}</div>
                </div>
              </div>
              <div v-else class="notify-empty">暂无消息</div>
            </div>
          </el-popover>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  DataAnalysis, ShoppingBag, Setting,
  Present, PictureFilled, Bell,
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../../store/user';
import request from '../../utils/request';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const defaultOpeneds = ['group-core', 'group-product', 'group-addon', 'group-content', 'group-system'];

// A-12: 面包屑导航 - 根据路由路径映射到菜单分组
const menuGroupMap: Record<string, string> = {
  '/dashboard': '核心运营',
  '/villa': '核心运营',
  '/calendar': '核心运营',
  '/order': '核心运营',
  '/package': '商品配置',
  '/facility': '商品配置',
  '/activity-plan': '增值服务',
  '/theme-pack': '增值服务',
  '/local-service': '增值服务',
  '/seasonal-event': '增值服务',
  '/album': '内容管理',
  '/review': '内容管理',
  '/video-review': '内容管理',
  '/site-config': '系统管理',
  '/merchant': '系统管理',
  '/finance': '系统管理',
};
const parentMenu = computed(() => menuGroupMap[route.path] || '');

const roleLabel = computed(() => {
  if (userStore.isPlatform) return '平台超管';
  if (userStore.isMerchant) return userStore.info?.merchantName || '商家';
  return '';
});

// 消息通知
const unreadCount = ref(0);
const messages = ref<any[]>([]);
let pollTimer: any = null;

// 待审核评价数量
const pendingReviewCount = ref(0);

async function loadPendingReviewCount() {
  try {
    const res: any = await request.get('/api/admin/dashboard/stats');
    pendingReviewCount.value = res.pendingItems?.pendingVideoReviews || 0;
  } catch { /* ignore */ }
}

async function loadUnreadCount() {
  try {
    const res: any = await request.get('/api/admin/messages/unread-count');
    const prev = unreadCount.value;
    unreadCount.value = res.count;
    // 有新消息时弹窗提醒
    if (res.count > prev && prev >= 0 && res.count > 0) {
      ElMessage({ message: `你有 ${res.count} 条未读消息`, type: 'info', duration: 3000 });
    }
  } catch { /* ignore */ }
}

async function loadMessages() {
  try {
    const res: any = await request.get('/api/admin/messages', { params: { pageSize: 20 } });
    messages.value = res.list || [];
  } catch { /* ignore */ }
}

async function markAllRead() {
  await request.post('/api/admin/messages/read-all');
  unreadCount.value = 0;
  messages.value = messages.value.map((m: any) => ({ ...m, read: true }));
}

async function handleClickMsg(m: any) {
  if (!m.read) {
    await request.post(`/api/admin/messages/${m.id}/read`);
    m.read = true;
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  }
  if (m.link) router.push(m.link);
}

function fmtTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return new Date(d).toLocaleDateString('zh-CN');
}

onMounted(() => {
  loadUnreadCount();
  loadPendingReviewCount();
  pollTimer = setInterval(() => {
    loadUnreadCount();
    loadPendingReviewCount();
  }, 30000); // 30秒轮询
});
onUnmounted(() => { if (pollTimer) clearInterval(pollTimer); });

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

/* 子菜单分组标题 */
:deep(.el-sub-menu__title) {
  color: #64748b; font-size: 12px; height: 40px; line-height: 40px;
  margin: 4px 8px 0; border-radius: 6px;
}
:deep(.el-sub-menu__title:hover) { background: rgba(255,255,255,0.04); }
:deep(.el-sub-menu__title .el-icon) { color: #64748b; font-size: 14px; }
:deep(.el-sub-menu .el-menu) { background: transparent !important; }
:deep(.el-sub-menu__icon-arrow) { color: #64748b; }

.menu .el-menu-item {
  color: #94a3b8; margin: 2px 8px; border-radius: 8px;
  height: 44px; line-height: 44px; font-size: 14px;
  padding-left: 44px !important;
}
.menu .el-menu-item:hover { background: rgba(255,255,255,0.06); color: #e2e8f0; }
.menu .el-menu-item.is-active {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff; font-weight: 600;
}

/* 菜单角标 */
.menu-badge { margin-left: 8px; }
:deep(.menu-badge .el-badge__content) {
  font-size: 10px; height: 16px; line-height: 16px; padding: 0 4px;
}

.header {
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #f0f0f0; background: #fff;
  padding: 0 24px; height: 56px;
}
.header-left { display: flex; flex-direction: column; justify-content: center; gap: 2px; }
.header-title { font-size: 16px; font-weight: 600; color: #1e293b; }
.header-breadcrumb { font-size: 12px; }
:deep(.header-breadcrumb .el-breadcrumb__item .el-breadcrumb__inner) { color: #94a3b8; font-weight: 400; }
:deep(.header-breadcrumb .el-breadcrumb__item:last-child .el-breadcrumb__inner) { color: #64748b; }
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

/* 通知铃铛 */
.notify-btn {
  position: relative; cursor: pointer; padding: 6px;
  border-radius: 8px; transition: background 0.2s;
  display: flex; align-items: center;
}
.notify-btn:hover { background: #f1f5f9; }
.notify-badge {
  position: absolute; top: 0; right: -2px;
  background: #ef4444; color: #fff; font-size: 10px; font-weight: 700;
  min-width: 18px; height: 18px; line-height: 18px;
  text-align: center; border-radius: 10px; padding: 0 4px;
}

/* 通知面板 */
.notify-panel { margin: -12px; }
.notify-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; border-bottom: 1px solid #f1f5f9;
  font-size: 15px; font-weight: 600; color: #1e293b;
}
.notify-read-all { font-size: 12px; color: #3b82f6; cursor: pointer; font-weight: 400; }
.notify-list { max-height: 400px; overflow-y: auto; }
.notify-item {
  padding: 12px 16px; cursor: pointer; transition: background 0.15s;
  border-bottom: 1px solid #f8fafc;
}
.notify-item:hover { background: #f8fafc; }
.notify-item.unread { background: #f0f7ff; }
.notify-item.unread .notify-title { font-weight: 600; }
.notify-title { font-size: 14px; color: #1e293b; margin-bottom: 4px; }
.notify-content { font-size: 12px; color: #64748b; line-height: 1.5; }
.notify-time { font-size: 11px; color: #94a3b8; margin-top: 4px; }
.notify-empty { padding: 40px; text-align: center; color: #94a3b8; font-size: 14px; }

.main { background: #f1f5f9; padding: 24px; }
</style>
