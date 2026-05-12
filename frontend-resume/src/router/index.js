import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useStudentAuthStore } from '@/stores/studentAuth'
import { useAdminAuthStore } from '@/stores/adminAuth'
import { safeInternalPath } from '@/utils/redirect'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('@/views/LoginView.vue'), meta: { guest: true } },
  { path: '/register', component: () => import('@/views/RegisterView.vue'), meta: { guest: true } },
  { path: '/evaluation', component: () => import('@/views/EvaluationView.vue'), meta: { requiresAuth: true } },
  { path: '/result', component: () => import('@/views/ResultView.vue'), meta: { requiresAuth: true } },
  { path: '/resources', component: () => import('@/views/ResourceListView.vue') },
  { path: '/resources/:id', component: () => import('@/views/ResourceDetailView.vue'), props: true },
  { path: '/appointment', component: () => import('@/views/AppointmentView.vue'), meta: { requiresAuth: true } },
  { path: '/personal', component: () => import('@/views/PersonalCenterView.vue'), meta: { requiresAuth: true } },
  { path: '/ai-chat', component: () => import('@/views/AiChatView.vue'), meta: { requiresAuth: true } },
  { path: '/admin/login', component: () => import('@/views/AdminLoginView.vue'), meta: { adminGuest: true } },
  { path: '/admin/statistic', component: () => import('@/views/AdminStatisticView.vue'), meta: { requiresAdmin: true } },
  { path: '/admin/dashboard', component: () => import('@/views/AdminDashboardView.vue'), meta: { requiresAdmin: true, fullscreen: true } },
  { path: '/admin/evaluations', component: () => import('@/views/AdminEvaluationView.vue'), meta: { requiresAdmin: true } },
  { path: '/admin/personal', component: () => import('@/views/AdminPersonalCenterView.vue'), meta: { requiresAdmin: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const student = useStudentAuthStore()
  const admin = useAdminAuthStore()

  // 已登录学生 → 跳过 guest 页（除非 relogin=1）
  if (to.meta.guest && student.isLoggedIn) {
    if (!(to.path === '/login' && to.query.relogin === '1')) {
      next(safeInternalPath(to.query.redirect) || '/evaluation')
      return
    }
  }

  // 已登录管理员 → 跳过 adminGuest 页
  if (to.meta.adminGuest && admin.isLoggedIn) {
    if (!(to.path === '/admin/login' && to.query.relogin === '1')) {
      next(safeInternalPath(to.query.redirect) || '/admin/statistic')
      return
    }
  }

  // 学生页需学生登录
  if (to.meta.requiresAuth && !student.isLoggedIn) {
    if (admin.isLoggedIn) {
      ElMessage.warning('该功能需要学生账号，请先退出管理员')
      next({ path: '/admin/statistic' })
      return
    }
    ElMessage.warning('请先登录')
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 管理页需管理员登录
  if (to.meta.requiresAdmin && !admin.isLoggedIn) {
    ElMessage.warning('请先登录管理员账号')
    next({ path: '/admin/login', query: { redirect: to.fullPath } })
    return
  }

  next()
})

export default router
