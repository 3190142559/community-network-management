import Vue from 'vue';
import VueRouter from 'vue-router';
import store from '../store';

Vue.use(VueRouter);

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('../views/layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/Dashboard.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'devices',
        name: 'Devices',
        component: () => import('../views/device/DeviceList.vue'),
        meta: { title: '设备信息管理', roles: ['admin'] }
      },
      {
        path: 'repairs',
        name: 'Repairs',
        component: () => import('../views/repair/RepairList.vue'),
        meta: { title: '报修工单管理' }
      },
      {
        path: 'my-repairs',
        name: 'MyRepairs',
        component: () => import('../views/repair/MyRepairs.vue'),
        meta: { title: '我的报修', roles: ['user'] }
      },
      {
        path: 'reimbursements',
        name: 'Reimbursements',
        component: () => import('../views/reimbursement/ReimbursementList.vue'),
        meta: { title: '费用报销管理', roles: ['admin', 'maintainer'] }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('../views/statistics/Statistics.vue'),
        meta: { title: '数据统计' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/device/UserList.vue'),
        meta: { title: '用户管理', roles: ['admin'] }
      }
    ]
  }
];

const router = new VueRouter({
  mode: 'hash',
  routes
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 社区网络设备维修管理系统` : '社区网络设备维修管理系统';

  const token = localStorage.getItem('token');
  if (to.path !== '/login' && !token) {
    return next('/login');
  }
  if (to.path === '/login' && token) {
    return next('/');
  }
  if (to.meta.roles) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!to.meta.roles.includes(user.role)) {
      return next('/dashboard');
    }
  }
  next();
});

export default router;
