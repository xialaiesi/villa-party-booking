<template>
  <div class="layout">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="container header-inner">
        <div class="logo" @click="$router.push('/')">
          <span class="logo-text">别墅轰趴</span>
        </div>
        <nav class="nav">
          <router-link to="/">首页</router-link>
          <router-link to="/search">全部别墅</router-link>
          <router-link to="/order">我的订单</router-link>
        </nav>
        <div class="user-area">
          <template v-if="userStore.isLoggedIn">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <span class="user-avatar">{{ (userStore.info?.nickname || '我').charAt(0) }}</span>
                {{ userStore.info?.nickname || '我的' }}
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="mine">个人中心</el-dropdown-item>
                  <el-dropdown-item command="order">我的订单</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <span class="login-btn" @click="$router.push('/login')">登录 / 注册</span>
          </template>
        </div>
      </div>
    </header>

    <!-- 内容区 -->
    <main class="main">
      <router-view />
    </main>

    <!-- 底部 -->
    <footer class="footer">
      <div class="container">
        <div class="footer-inner">
          <div class="footer-col">
            <h4>关于我们</h4>
            <p>别墅轰趴 — 团建生日聚会首选平台</p>
            <p>主打整栋出租，让每场聚会都难忘</p>
          </div>
          <div class="footer-col">
            <h4>服务支持</h4>
            <p>客服电话：400-xxx-xxxx</p>
            <p>工作时间：9:00 - 21:00</p>
          </div>
          <div class="footer-col">
            <h4>关注我们</h4>
            <p>微信公众号：别墅轰趴</p>
            <p>小程序：扫码立即预订</p>
          </div>
        </div>
        <div class="footer-bottom">© 2026 别墅轰趴. 版权所有</div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';

const router = useRouter();
const userStore = useUserStore();

function handleCommand(cmd: string) {
  switch (cmd) {
    case 'mine':
      router.push('/mine');
      break;
    case 'order':
      router.push('/order');
      break;
    case 'logout':
      userStore.logout();
      router.push('/');
      break;
  }
}
</script>

<style scoped>
.layout { display: flex; flex-direction: column; min-height: 100vh; }

/* ===== Header ===== */
.header {
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 0 rgba(0,0,0,0.06);
  position: sticky; top: 0; z-index: 100;
}
.header-inner {
  display: flex; align-items: center; justify-content: space-between;
  height: 64px;
}
.logo { cursor: pointer; }
.logo-text {
  font-size: 24px; font-weight: 900; letter-spacing: 3px;
  background: linear-gradient(135deg, #ff6b35, #e91e63);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-family: 'PingFang SC', 'Noto Sans SC', sans-serif;
}

.nav { display: flex; gap: 8px; }
.nav a {
  font-size: 14px; color: #64748b; position: relative;
  padding: 8px 18px; border-radius: 20px;
  transition: all 0.25s; font-weight: 500;
}
.nav a:hover { color: #1e293b; background: #f1f5f9; }
.nav a.router-link-exact-active {
  color: #fff; font-weight: 600;
  background: linear-gradient(135deg, #ff6b35, #ff4500);
  box-shadow: 0 2px 8px rgba(255,107,53,0.3);
}
.nav a.router-link-exact-active::after { display: none; }

.user-area { display: flex; align-items: center; }
.login-btn {
  padding: 8px 24px; border-radius: 20px;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.25s;
  background: linear-gradient(135deg, #ff6b35, #ff4500);
  color: #fff; border: none;
  box-shadow: 0 2px 8px rgba(255,107,53,0.3);
}
.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(255,107,53,0.4);
}

.user-info {
  display: flex; align-items: center; gap: 8px;
  cursor: pointer; color: #475569; font-size: 14px; font-weight: 500;
  transition: color 0.2s;
}
.user-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: linear-gradient(135deg, #ff6b35, #ff8f65);
  color: #fff; font-size: 13px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
}

.main { flex: 1; }

/* ===== Footer ===== */
.footer {
  background: #1e293b; color: #94a3b8;
  padding: 60px 0 24px;
}
.footer-inner {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 60px;
  padding-bottom: 40px;
  border-bottom: 1px solid #334155;
}
.footer-col h4 { color: #e2e8f0; font-size: 16px; margin-bottom: 16px; font-weight: 600; }
.footer-col p { font-size: 14px; line-height: 2; margin-bottom: 2px; }
.footer-bottom {
  text-align: center; padding-top: 24px;
  font-size: 13px; color: #64748b;
}
</style>
