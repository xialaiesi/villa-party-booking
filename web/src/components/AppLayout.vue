<template>
  <div class="layout">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="container header-inner">
        <div class="logo" @click="$router.push('/')">
          <span class="logo-icon">🏡</span>
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
                <el-icon><UserFilled /></el-icon>
                {{ userStore.info?.nickname || '我的' }}
                <el-icon><ArrowDown /></el-icon>
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
            <el-button type="primary" @click="$router.push('/login')">登录 / 注册</el-button>
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
import { UserFilled, ArrowDown } from '@element-plus/icons-vue';
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

.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: sticky; top: 0; z-index: 100;
}
.header-inner {
  display: flex; align-items: center; justify-content: space-between;
  height: 72px;
}
.logo { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.logo-icon { font-size: 32px; }
.logo-text { font-size: 22px; font-weight: bold; color: #ff6b35; }

.nav { display: flex; gap: 40px; }
.nav a {
  font-size: 16px; color: #333; position: relative;
  padding: 24px 0; transition: color 0.2s;
}
.nav a:hover { color: #ff6b35; }
.nav a.router-link-exact-active {
  color: #ff6b35; font-weight: bold;
}
.nav a.router-link-exact-active::after {
  content: ''; position: absolute; bottom: 16px; left: 0; right: 0;
  height: 3px; background: #ff6b35; border-radius: 2px;
}

.user-info {
  display: flex; align-items: center; gap: 6px;
  cursor: pointer; color: #333; font-size: 14px;
}

.main { flex: 1; }

.footer {
  background: #2c2c2c; color: #aaa;
  padding: 60px 0 24px;
  margin-top: 60px;
}
.footer-inner {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 60px;
  padding-bottom: 40px;
  border-bottom: 1px solid #444;
}
.footer-col h4 { color: #fff; font-size: 16px; margin-bottom: 16px; }
.footer-col p { font-size: 14px; line-height: 1.8; margin-bottom: 4px; }
.footer-bottom {
  text-align: center; padding-top: 24px;
  font-size: 14px; color: #888;
}
</style>
