import { createRouter, createWebHistory } from 'vue-router';
import { trackPageView, trackEvent } from '../utils/tracker';

const routes = [
  {
    path: '/',
    component: () => import('../components/AppLayout.vue'),
    children: [
      { path: '', component: () => import('../views/home/index.vue'), meta: { title: '首页' } },
      { path: 'search', component: () => import('../views/search/index.vue'), meta: { title: '搜索别墅' } },
      { path: 'villa/:id', component: () => import('../views/villa/index.vue'), meta: { title: '别墅详情' } },
      { path: 'booking/:id', component: () => import('../views/booking/index.vue'), meta: { title: '确认预订', auth: true } },
      { path: 'order', component: () => import('../views/order/index.vue'), meta: { title: '我的订单', auth: true } },
      { path: 'order/:id', component: () => import('../views/order/detail.vue'), meta: { title: '订单详情', auth: true } },
      { path: 'album', component: () => import('../views/album/index.vue'), meta: { title: '共享相册' } },
      { path: 'album/:id', component: () => import('../views/album/detail.vue'), meta: { title: '相册详情' } },
      { path: 'mine', component: () => import('../views/mine/index.vue'), meta: { title: '个人中心', auth: true } },
      { path: 'help', component: () => import('../views/help/index.vue'), meta: { title: '帮助中心' } },
    ],
  },
  {
    path: '/landing',
    component: () => import('../views/landing/index.vue'),
    meta: { title: '别墅趴 — 周末来一场忘不了的聚会', public: true },
  },
  {
    path: '/login',
    component: () => import('../views/login/index.vue'),
    meta: { title: '登录', public: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  document.title = (to.meta.title as string) || '别墅轰趴';
  if (to.meta.auth && !localStorage.getItem('user_token')) {
    next('/login?redirect=' + encodeURIComponent(to.fullPath));
  } else {
    next();
  }
});

router.afterEach((to) => {
  trackPageView();
  // 自动追踪别墅详情页浏览
  if (to.path.startsWith('/villa/') && to.params.id) {
    trackEvent('villa_view', { targetId: Number(to.params.id), targetType: 'villa' });
  }
  // 自动追踪预订页打开
  if (to.path.startsWith('/booking/')) {
    trackEvent('booking_open', { targetId: Number(to.params.id), targetType: 'villa' });
  }
});

export default router;
