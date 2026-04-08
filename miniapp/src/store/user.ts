import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { wxLogin, getProfile } from '../api/auth';

export const useUserStore = defineStore('user', () => {
  const token = ref(uni.getStorageSync('token') || '');
  const userInfo = ref<any>(null);
  const isLoggedIn = computed(() => !!token.value);

  async function login() {
    const [err, res] = await uni.login({ provider: 'weixin' });
    if (err || !res) throw new Error('微信登录失败');

    const data = await wxLogin(res.code);
    token.value = data.token;
    userInfo.value = data.user;
    uni.setStorageSync('token', data.token);
  }

  async function fetchProfile() {
    if (!token.value) return;
    userInfo.value = await getProfile();
  }

  function logout() {
    token.value = '';
    userInfo.value = null;
    uni.removeStorageSync('token');
  }

  return { token, userInfo, isLoggedIn, login, fetchProfile, logout };
});
