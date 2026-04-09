import { createRouter, createWebHistory } from 'vue-router';

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
      { path: 'mine', component: () => import('../views/mine/index.vue'), meta: { title: '个人中心', auth: true } },
    ],
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

export default router;
