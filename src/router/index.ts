import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { RoleCode } from '@/utils/sqljs-engine'
import AuthLayout from '@/layouts/AuthLayout.vue'
import MainLayout from '@/layouts/MainLayout.vue'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: RoleCode[]
    title?: string
  }
}

const ALL_ROLES: RoleCode[] = [
  'ROLE_SUPER_ADMIN',
  'ROLE_CENTER_DIRECTOR',
  'ROLE_STATION_DOCTOR',
  'ROLE_DECISION_MAKER',
]

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue'),
        meta: { requiresAuth: false, title: '用户登录' },
      },
    ],
  },
  {
    path: '/tender',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'tender',
        component: () => import('@/views/tender/TenderView.vue'),
        meta: { requiresAuth: false, title: '公开招标公告' },
      },
    ],
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { requiresAuth: true, roles: ALL_ROLES, title: '全景态势大屏' },
      },
      {
        path: 'regional-mgmt',
        name: 'regional-mgmt',
        component: () => import('@/views/regional-mgmt/RegionalMgmtView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['ROLE_SUPER_ADMIN', 'ROLE_CENTER_DIRECTOR', 'ROLE_DECISION_MAKER'],
          title: '区域一体化与HIS解耦',
        },
      },
      {
        path: 'public-health',
        name: 'public-health',
        component: () => import('@/views/public-health/PublicHealthView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['ROLE_SUPER_ADMIN', 'ROLE_CENTER_DIRECTOR', 'ROLE_STATION_DOCTOR'],
          title: '健康档案与公卫协同',
        },
      },
      {
        path: 'family-doctor',
        name: 'family-doctor',
        component: () => import('@/views/family-doctor/FamilyDoctorView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['ROLE_SUPER_ADMIN', 'ROLE_CENTER_DIRECTOR', 'ROLE_STATION_DOCTOR'],
          title: '家医签约服务',
        },
      },
      {
        path: 'pharmacy',
        name: 'pharmacy',
        component: () => import('@/views/pharmacy/PharmacyView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['ROLE_SUPER_ADMIN', 'ROLE_CENTER_DIRECTOR', 'ROLE_STATION_DOCTOR'],
          title: '药械全链条监管',
        },
      },
      {
        path: 'system',
        name: 'system',
        component: () => import('@/views/system/SystemView.vue'),
        meta: {
          requiresAuth: true,
          roles: ['ROLE_SUPER_ADMIN'],
          title: '系统总控与安全审计',
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  document.title = `${to.meta.title || '社区卫生服务'} | 东城区社管中心`

  if (to.meta.requiresAuth === false) {
    if (to.path === '/login' && auth.isAuthenticated) {
      next('/')
      return
    }
    next()
    return
  }

  if (!auth.isAuthenticated) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.roles && !auth.hasRole(to.meta.roles)) {
    auth.setPermissionAlert('当前角色无权访问该模块，已按 RBAC 策略阻断。')
    next('/')
    return
  }

  next()
})

export default router
