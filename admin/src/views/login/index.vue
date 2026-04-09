<template>
  <div class="login-page">
    <div class="login-card">
      <h2>别墅轰趴管理后台</h2>
      <el-form :model="form" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { login } from '../../api/auth';
import { useUserStore } from '../../store/user';

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const form = reactive({ username: '', password: '' });

async function handleLogin() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码');
    return;
  }
  loading.value = true;
  try {
    const data: any = await login(form.username, form.password);
    localStorage.setItem('admin_token', data.token);
    userStore.setInfo(data.admin);
    router.push('/');
    ElMessage.success('登录成功');
  } catch (e) {
    // error handled by interceptor
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page { display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f2f5; }
.login-card { width: 400px; padding: 40px; background: #fff; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
.login-card h2 { text-align: center; margin-bottom: 30px; color: #333; }
.login-btn { width: 100%; }
</style>
