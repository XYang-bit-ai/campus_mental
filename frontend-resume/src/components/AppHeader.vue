<template>
  <header class="app-header">
    <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-90 dark:from-white/5" />
    <div class="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/10" />
    <div class="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-500/10" />
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

    <div class="relative z-[1] flex w-full min-w-0 items-center justify-between gap-4 px-4 sm:px-7">
      <!-- Logo -->
      <router-link to="/" class="shrink-0 text-base font-semibold tracking-tight text-white drop-shadow-sm sm:text-lg">
        校园心理健康评估与预防系统
      </router-link>

      <!-- Desktop nav -->
      <nav class="nav-desktop flex min-w-0 flex-1 flex-wrap items-center justify-end gap-0.5 sm:gap-1">
        <ThemeToggle variant="header" />
        <el-divider direction="vertical" class="!mx-1 !h-4 opacity-30" />

        <!-- 学生登录态 -->
        <template v-if="studentAuth.isLoggedIn">
          <el-dropdown trigger="click" @command="onStudentMenu">
            <span class="nav-chip">
              <span class="opacity-80 text-xs">学生</span>
              <span class="font-semibold truncate max-w-[7rem]">{{ studentDisplayName }}</span>
              <span class="opacity-60 text-[10px]">▾</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="personal">个人中心</el-dropdown-item>
                <el-dropdown-item command="relogin">切换账号</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <el-button v-else type="primary" text @click="goStudentLogin">学生登录</el-button>

        <!-- 管理员登录态 -->
        <template v-if="adminAuth.isLoggedIn">
          <el-dropdown trigger="click" @command="onAdminMenu">
            <span class="nav-chip">
              <span class="opacity-80 text-xs">管理员</span>
              <span class="font-semibold truncate max-w-[7rem]">{{ adminDisplayName }}</span>
              <span class="opacity-60 text-[10px]">▾</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="personal">管理员中心</el-dropdown-item>
                <el-dropdown-item command="relogin">切换账号</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <el-button v-else type="primary" text @click="$router.push('/admin/login')">管理员登录</el-button>

        <el-divider direction="vertical" class="!mx-1 !h-4 opacity-30" />

        <template v-if="showStudentNav">
          <el-button type="primary" text @click="$router.push('/evaluation')">心理测评</el-button>
          <el-button type="primary" text @click="$router.push('/appointment')">咨询预约</el-button>
          <el-button type="primary" text @click="$router.push('/personal')">个人中心</el-button>
        </template>
        <el-button type="primary" text @click="$router.push('/resources')">心理资源库</el-button>

        <template v-if="studentAuth.isLoggedIn">
          <el-divider direction="vertical" class="!mx-1 !h-4 opacity-30" />
          <el-button type="primary" text @click="$router.push('/ai-chat')">心灵树洞</el-button>
        </template>
        <template v-if="adminAuth.isLoggedIn">
          <el-divider direction="vertical" class="!mx-1 !h-4 opacity-30" />
          <el-button type="primary" text @click="$router.push('/admin/personal')">管理员中心</el-button>
          <el-button type="primary" text @click="$router.push('/admin/dashboard')">数据大屏</el-button>
        </template>
      </nav>

      <!-- Mobile hamburger -->
      <button class="nav-hamburger" @click="mobileOpen = !mobileOpen" aria-label="菜单">
        <svg v-if="!mobileOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Mobile menu -->
    <transition name="slide-down">
      <div v-if="mobileOpen" class="nav-mobile">
        <ThemeToggle variant="header" />
        <template v-if="studentAuth.isLoggedIn">
          <el-button type="primary" text @click="navigate('/personal')">个人中心</el-button>
          <el-button type="primary" text @click="navigate('/evaluation')">心理测评</el-button>
          <el-button type="primary" text @click="navigate('/appointment')">咨询预约</el-button>
          <el-button type="primary" text @click="navigate('/ai-chat')">心灵树洞</el-button>
          <el-button type="danger" text @click="onStudentMenu('logout')">退出学生</el-button>
        </template>
        <template v-else>
          <el-button type="primary" text @click="navigate('/login')">学生登录</el-button>
        </template>
        <el-divider class="!my-1 opacity-30" />
        <el-button type="primary" text @click="navigate('/resources')">心理资源库</el-button>
        <template v-if="adminAuth.isLoggedIn">
          <el-button type="primary" text @click="navigate('/admin/statistic')">数据统计</el-button>
          <el-button type="primary" text @click="navigate('/admin/dashboard')">数据大屏</el-button>
          <el-button type="primary" text @click="navigate('/admin/personal')">管理员中心</el-button>
          <el-button type="danger" text @click="onAdminMenu('logout')">退出管理员</el-button>
        </template>
        <template v-else>
          <el-button type="primary" text @click="navigate('/admin/login')">管理员登录</el-button>
        </template>
      </div>
    </transition>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useStudentAuthStore } from '@/stores/studentAuth'
import { useAdminAuthStore } from '@/stores/adminAuth'

const router = useRouter()
const studentAuth = useStudentAuthStore()
const adminAuth = useAdminAuthStore()
const mobileOpen = ref(false)

const showStudentNav = computed(() => !adminAuth.isLoggedIn || studentAuth.isLoggedIn)
const studentDisplayName = computed(() => studentAuth.username?.trim() || '同学')
const adminDisplayName = computed(() => adminAuth.adminUsername?.trim() || '管理员')

function navigate(path) {
  mobileOpen.value = false
  router.push(path)
}

function goStudentLogin() {
  router.push({ path: '/login', query: { relogin: '1' } })
}

function onStudentMenu(cmd) {
  if (cmd === 'personal') router.push('/personal')
  if (cmd === 'relogin') router.push({ path: '/login', query: { relogin: '1' } })
  if (cmd === 'logout') {
    studentAuth.clearSession()
    ElMessage.success('已退出学生账号')
    router.push('/login')
  }
}

function onAdminMenu(cmd) {
  if (cmd === 'personal') router.push('/admin/personal')
  if (cmd === 'relogin') router.push({ path: '/admin/login', query: { relogin: '1' } })
  if (cmd === 'logout') {
    adminAuth.clearSession()
    ElMessage.success('已退出管理员')
    router.push('/admin/login')
  }
}
</script>

<style scoped>
.app-header {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  min-height: 4.25rem;
  align-items: center;
  overflow: hidden;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(115deg, #115e59 0%, #0f766e 28%, #0d9488 52%, #0e7490 78%, #155e75 100%);
  box-shadow: 0 4px 24px rgba(15, 118, 110, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.dark .app-header {
  border-bottom-color: rgba(94, 234, 212, 0.12);
  background: linear-gradient(125deg, #042f2e 0%, #0c4a3e 35%, #134e4a 65%, #164e63 100%);
  box-shadow: 0 4px 28px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.nav-chip {
  display: inline-flex;
  max-width: 11rem;
  cursor: pointer;
  align-items: center;
  gap: 0.35rem;
  border-radius: 6px;
  padding: 0.35rem 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.92);
}

.nav-chip:hover,
.nav-chip:focus-visible {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.14);
}

.nav :deep(.el-button.is-text) {
  color: rgba(255, 255, 255, 0.92) !important;
}
.nav :deep(.el-button.is-text:hover) {
  color: #ffffff !important;
  background-color: rgba(255, 255, 255, 0.14) !important;
}

/* ── 响应式 ── */
.nav-hamburger {
  display: none;
  color: white;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
}

.nav-mobile {
  display: none;
  width: 100%;
  padding: 0.75rem 1rem;
  flex-direction: column;
  gap: 0.25rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
}

@media (max-width: 768px) {
  .nav-desktop { display: none; }
  .nav-hamburger { display: block; }
  .nav-mobile { display: flex; }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
