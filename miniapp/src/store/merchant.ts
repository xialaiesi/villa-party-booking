import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { adminLogin } from '../api/admin';

export const useMerchantStore = defineStore('merchant', () => {
  const token = ref(uni.getStorageSync('admin_token') || '');
  const adminInfo = ref<any>(uni.getStorageSync('adminInfo') ? JSON.parse(uni.getStorageSync('adminInfo')) : null);
  const isLoggedIn = computed(() => !!token.value);
  const isPlatform = computed(() => adminInfo.value?.role === 'platform');
  const isMerchant = computed(() => adminInfo.value?.role === 'merchant');

  async function login(username: string, password: string) {
    const data = await adminLogin(username, password);
    token.value = data.token;
    adminInfo.value = data.admin;
    uni.setStorageSync('admin_token', data.token);
    uni.setStorageSync('adminInfo', JSON.stringify(data.admin));
    return data;
  }

  function logout() {
    token.value = '';
    adminInfo.value = null;
    uni.removeStorageSync('admin_token');
    uni.removeStorageSync('adminInfo');
  }

  return { token, adminInfo, isLoggedIn, isPlatform, isMerchant, login, logout };
});
