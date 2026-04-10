<template>
  <div class="layout">
    <!-- 顶部导航 -->
    <header class="header" :class="{ transparent: isHome && !scrolled }">
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '../store/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const scrolled = ref(false);

const isHome = computed(() => route.path === '/');

function onScroll() { scrolled.value = window.scrollY > 60; }
onMounted(() => window.addEventListener('scroll', onScroll));
onUnmounted(() => window.removeEventListener('scroll', onScroll));

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
  background: #fff;
  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.06);
  position: sticky; top: 0; z-index: 100;
  transition: all 0.35s ease;
}
.header.transparent {
  background: transparent;
  box-shadow: none;
}
.header.transparent .logo-text { color: #fff; }
.header.transparent .nav a { color: rgba(255,255,255,0.85); }
.header.transparent .nav a:hover { color: #fff; }
.header.transparent .nav a.router-link-exact-active { color: #fff; }
.header.transparent .nav a.router-link-exact-active::after { background: #fff; }
.header.transparent .login-btn {
  border-color: rgba(255,255,255,0.6); color: #fff;
}
.header.transparent .login-btn:hover {
  background: #fff; color: #ff6b35; border-color: #fff;
}
.header.transparent .user-info { color: #fff; }

.header-inner {
  display: flex; align-items: center; justify-content: space-between;
  height: 68px;
}
.logo { cursor: pointer; }
.logo-text {
  font-size: 22px; font-weight: 800; color: #ff6b35;
  letter-spacing: 2px;
  transition: color 0.3s;
}

.nav { display: flex; gap: 36px; }
.nav a {
  font-size: 15px; color: #475569; position: relative;
  padding: 22px 0; transition: color 0.2s; font-weight: 500;
}
.nav a:hover { color: #ff6b35; }
.nav a.router-link-exact-active { color: #ff6b35; font-weight: 600; }
.nav a.router-link-exact-active::after {
  content: ''; position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%);
  width: 20px; height: 3px; background: #ff6b35; border-radius: 2px;
}

.user-area { display: flex; align-items: center; }
.login-btn {
  padding: 7px 22px; border-radius: 20px;
  border: 1.5px solid #ff6b35; color: #ff6b35;
  font-size: 14px; font-weight: 500; cursor: pointer;
  transition: all 0.25s; background: transparent;
}
.login-btn:hover {
  background: #ff6b35; color: #fff;
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
