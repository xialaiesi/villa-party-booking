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
  DataAnalysis, House, Calendar, ShoppingBag, Document, Setting,
  List, Present, Service, Star, OfficeBuilding, Money, Brush, PictureFilled, Bell,
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../../store/user';
import request from '../../utils/request';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const roleLabel = computed(() => {
  if (userStore.isPlatform) return '平台超管';
  if (userStore.isMerchant) return userStore.info?.merchantName || '商家';
  return '';
});

// 消息通知
const unreadCount = ref(0);
const messages = ref<any[]>([]);
let pollTimer: any = null;

async function loadUnreadCount() {
  try {
    const res: any = await request.get('/api/admin/messages/unread-count');
    const prev = unreadCount.value;
    unreadCount.value = res.count;
    // 有新消息时弹窗提醒
    if (res.count > prev && prev >= 0 && res.count > 0) {
      ElMessage({ message: `📬 你有 ${res.count} 条未读消息`, type: 'info', duration: 3000 });
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
  pollTimer = setInterval(loadUnreadCount, 30000); // 30秒轮询
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
