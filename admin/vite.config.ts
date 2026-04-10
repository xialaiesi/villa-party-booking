import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // 生产部署在 /admin/ 子路径下（Nginx alias），开发用根路径
  base: mode === 'production' ? '/admin/' : '/',
  plugins: [vue()],
}))
