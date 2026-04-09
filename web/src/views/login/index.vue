<template>
  <div class="login-page">
    <div class="login-box">
      <div class="logo">
        <span>🏡</span>
        <h1>别墅轰趴</h1>
      </div>
      <p class="subtitle">团建 · 生日 · 聚会的理想之选</p>

      <div class="tabs">
        <div class="tab" :class="{ active: mode === 'login' }" @click="mode = 'login'">登录</div>
        <div class="tab" :class="{ active: mode === 'register' }" @click="mode = 'register'">注册</div>
      </div>

      <el-form :model="form" size="large">
        <el-form-item v-if="mode === 'register'">
          <el-input v-model="form.nickname" placeholder="昵称（可选）" prefix-icon="UserFilled" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.phone" placeholder="手机号" prefix-icon="Phone" maxlength="11" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码（至少 6 位）" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="submit-btn" :loading="loading" @click="handleSubmit">
            {{ mode === 'login' ? '立即登录' : '立即注册' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="back-link">
        <router-link to="/">← 返回首页</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { login, register } from '../../api/auth';
import { useUserStore } from '../../store/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const mode = ref<'login' | 'register'>('login');
const loading = ref(false);
const form = reactive({ phone: '', password: '', nickname: '' });

async function handleSubmit() {
  if (!form.phone || !form.password) {
    ElMessage.warning('请填写完整');
    return;
  }
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    ElMessage.warning('手机号格式不正确');
    return;
  }
  loading.value = true;
  try {
    const res: any = mode.value === 'login'
      ? await login(form.phone, form.password)
      : await register(form.phone, form.password, form.nickname);
    userStore.setAuth(res.token, res.user);
    ElMessage.success(mode.value === 'login' ? '登录成功' : '注册成功');
    const redirect = (route.query.redirect as string) || '/';
    router.push(redirect);
  } catch (e) {
    // 拦截器处理
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #ff6b35 0%, #ff8f65 100%);
  padding: 20px;
}
.login-box {
  width: 440px; background: #fff; padding: 50px 40px;
  border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.logo { display: flex; align-items: center; justify-content: center; gap: 12px; }
.logo span { font-size: 48px; }
.logo h1 { font-size: 28px; color: #333; font-weight: bold; }
.subtitle { text-align: center; color: #999; font-size: 14px; margin: 8px 0 32px; }

.tabs { display: flex; border-bottom: 1px solid #eee; margin-bottom: 24px; }
.tab {
  flex: 1; text-align: center; padding: 14px 0;
  cursor: pointer; font-size: 16px; color: #666;
}
.tab.active {
  color: #ff6b35; font-weight: bold;
  border-bottom: 2px solid #ff6b35;
}

.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #ff6b35, #ff8f65);
  border: none;
}

.back-link { text-align: center; margin-top: 16px; }
.back-link a { color: #999; font-size: 14px; }
.back-link a:hover { color: #ff6b35; }
</style>
