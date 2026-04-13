<template>
  <div class="container mine-page">
    <div class="header">
      <img v-if="userStore.info?.avatar" :src="userStore.info.avatar" class="avatar" />
      <div v-else class="avatar avatar-letter">{{ (userStore.info?.nickname || '我').charAt(0) }}</div>
      <div class="info">
        <div class="nickname">{{ userStore.info?.nickname || '用户' }}</div>
        <div class="phone">{{ userStore.info?.phone || '' }}</div>
        <div class="member-since" v-if="userStore.info?.createdAt">
          加入时间：{{ formatDate(userStore.info.createdAt) }}
        </div>
      </div>
    </div>

    <!-- 订单统计 -->
    <div class="order-stats">
      <router-link to="/order" class="stat-item">
        <div class="stat-num">{{ orderStats.total }}</div>
        <div class="stat-label">全部订单</div>
      </router-link>
      <router-link to="/order?status=pending" class="stat-item">
        <div class="stat-num highlight">{{ orderStats.pending }}</div>
        <div class="stat-label">待处理</div>
      </router-link>
      <router-link to="/order?status=confirmed" class="stat-item">
        <div class="stat-num">{{ orderStats.confirmed }}</div>
        <div class="stat-label">已确认</div>
      </router-link>
      <router-link to="/order?status=completed" class="stat-item">
        <div class="stat-num success">{{ orderStats.completed }}</div>
        <div class="stat-label">已完成</div>
      </router-link>
    </div>

    <div class="menu-grid">
      <router-link to="/order" class="menu-item">
        <el-icon size="32"><Document /></el-icon>
        <span>我的订单</span>
      </router-link>
      <router-link to="/album" class="menu-item">
        <el-icon size="32"><PictureFilled /></el-icon>
        <span>我的相册</span>
      </router-link>
      <router-link to="/" class="menu-item">
        <el-icon size="32"><House /></el-icon>
        <span>浏览别墅</span>
      </router-link>
      <div class="menu-item" @click="handleContact">
        <el-icon size="32"><ChatDotRound /></el-icon>
        <span>联系客服</span>
      </div>
    </div>

    <!-- 客服联系卡片 -->
    <div class="card service-section">
      <div class="service-row">
        <div class="service-info">
          <span class="service-emoji">&#128222;</span>
          <div>
            <div class="service-title">需要帮助？</div>
            <div class="service-desc">客服热线 400-888-8888（每天 9:00 - 22:00）</div>
          </div>
        </div>
        <el-button round size="small" type="primary" @click="handleContact">
          微信客服
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Document, PictureFilled, House, ChatDotRound } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../../store/user';
import { listOrders } from '../../api/order';

const userStore = useUserStore();

const orderStats = ref({ total: 0, pending: 0, confirmed: 0, completed: 0 });

onMounted(async () => {
  try {
    const orders: any = await listOrders();
    const list = Array.isArray(orders) ? orders : (orders?.data || []);
    orderStats.value.total = list.length;
    orderStats.value.pending = list.filter((o: any) => o.status >= 0 && o.status <= 2).length;
    orderStats.value.confirmed = list.filter((o: any) => o.status === 3 || o.status === 4).length;
    orderStats.value.completed = list.filter((o: any) => o.status === 5).length;
  } catch { /* not logged in */ }
});

function handleContact() {
  const wechat = 'villa_service';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(wechat).catch(() => {});
  } else {
    const ta = document.createElement('textarea');
    ta.value = wechat; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
  }
  ElMessage.success('微信号 villa_service 已复制，请在微信中添加');
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
}
</script>

<style scoped>
.mine-page { padding: 30px 0 60px; max-width: 900px; }

.header {
  background: linear-gradient(135deg, #ff6b35, #ff8f65);
  padding: 40px; border-radius: 12px; color: #fff;
  display: flex; gap: 20px; align-items: center;
  margin-bottom: 24px;
}
.avatar {
  width: 80px; height: 80px; border-radius: 50%;
  background: #fff; border: 3px solid rgba(255,255,255,0.3);
}
.avatar-letter { display: flex; align-items: center; justify-content: center; background: #e0e7ff; color: #4f46e5; font-size: 32px; font-weight: 600; }
.nickname { font-size: 22px; font-weight: bold; }
.phone { font-size: 14px; opacity: 0.8; margin-top: 4px; }
.member-since { font-size: 12px; opacity: 0.7; margin-top: 4px; }

/* 订单统计 */
.order-stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
  margin-bottom: 24px;
}
.stat-item {
  background: #fff; border-radius: 12px; padding: 20px 0;
  text-align: center; cursor: pointer; transition: all 0.2s;
  text-decoration: none; color: inherit;
}
.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
.stat-num {
  font-size: 28px; font-weight: 800; color: #1e293b;
}
.stat-num.highlight { color: #ff6b35; }
.stat-num.success { color: #27ae60; }
.stat-label {
  font-size: 13px; color: #94a3b8; margin-top: 4px;
}

.menu-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
  margin-bottom: 24px;
}
.menu-item {
  background: #fff; border-radius: 12px; padding: 40px 0;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  cursor: pointer; transition: all 0.2s;
  color: #333; text-decoration: none;
}
.menu-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  color: #ff6b35;
}

/* 客服 */
.card { background: #fff; padding: 24px; border-radius: 12px; margin-bottom: 16px; }
.service-section { background: #f8fafc !important; border: 1px solid #e2e8f0; }
.service-row {
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 12px;
}
.service-info { display: flex; align-items: center; gap: 12px; }
.service-emoji { font-size: 28px; }
.service-title { font-size: 15px; font-weight: 600; color: #1e293b; }
.service-desc { font-size: 12px; color: #94a3b8; margin-top: 2px; }

@media (max-width: 768px) {
  .menu-grid { grid-template-columns: repeat(2, 1fr); }
  .order-stats { grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .stat-num { font-size: 22px; }
  .service-row { flex-direction: column; align-items: flex-start; }
}
</style>
