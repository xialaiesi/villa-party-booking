import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    component: () => import('../views/login/index.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    component: () => import('../components/layout/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', component: () => import('../views/dashboard/index.vue'), meta: { title: '数据看板' } },
      { path: 'villa', component: () => import('../views/villa/index.vue'), meta: { title: '房源管理' } },
      { path: 'calendar', component: () => import('../views/calendar/index.vue'), meta: { title: '房态管理' } },
      { path: 'package', component: () => import('../views/package/index.vue'), meta: { title: '套餐管理' } },
      { path: 'order', component: () => import('../views/order/index.vue'), meta: { title: '订单管理' } },
      { path: 'facility', component: () => import('../views/facility/index.vue'), meta: { title: '设施管理' } },
      { path: 'activity-plan', component: () => import('../views/activity-plan/index.vue'), meta: { title: '活动方案' } },
      { path: 'theme-pack', component: () => import('../views/theme-pack/index.vue'), meta: { title: '氛围包' } },
      { path: 'local-service', component: () => import('../views/local-service/index.vue'), meta: { title: '周边服务' } },
      { path: 'seasonal-event', component: () => import('../views/seasonal-event/index.vue'), meta: { title: '限定活动' } },
      { path: 'merchant', component: () => import('../views/merchant/index.vue'), meta: { title: '商家管理' } },
      { path: 'finance', component: () => import('../views/finance/index.vue'), meta: { title: '财务中心' } },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, _from, next) => {
  document.title = (to.meta.title as string) || '别墅轰趴管理后台';
  if (!to.meta.public && !localStorage.getItem('admin_token')) {
    next('/login');
  } else {
    next();
  }
});

export default router;
