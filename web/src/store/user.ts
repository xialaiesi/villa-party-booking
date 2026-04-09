import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('user_token') || '');
  const info = ref<any>(
    localStorage.getItem('user_info') ? JSON.parse(localStorage.getItem('user_info')!) : null,
  );

  const isLoggedIn = computed(() => !!token.value);

  function setAuth(t: string, u: any) {
    token.value = t;
    info.value = u;
    localStorage.setItem('user_token', t);
    localStorage.setItem('user_info', JSON.stringify(u));
  }

  function logout() {
    token.value = '';
    info.value = null;
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_info');
  }

  return { token, info, isLoggedIn, setAuth, logout };
});
