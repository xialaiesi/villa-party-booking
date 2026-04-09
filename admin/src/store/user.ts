import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

interface AdminInfo {
  id: number;
  username: string;
  nickname: string;
  role: 'platform' | 'merchant';
  merchantId: number | null;
  merchantName: string | null;
}

export const useUserStore = defineStore('user', () => {
  const info = ref<AdminInfo | null>(
    localStorage.getItem('admin_info')
      ? JSON.parse(localStorage.getItem('admin_info')!)
      : null,
  );

  const isPlatform = computed(() => info.value?.role === 'platform');
  const isMerchant = computed(() => info.value?.role === 'merchant');

  function setInfo(data: AdminInfo) {
    info.value = data;
    localStorage.setItem('admin_info', JSON.stringify(data));
  }

  function clear() {
    info.value = null;
    localStorage.removeItem('admin_info');
    localStorage.removeItem('admin_token');
  }

  return { info, isPlatform, isMerchant, setInfo, clear };
});
