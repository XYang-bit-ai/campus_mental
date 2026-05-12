<template>
  <div class="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
    <ThemeToggle variant="floating" class="fixed right-4 top-20 z-50 md:right-8" />

    <el-card class="card w-full max-w-md shadow-lg dark:!border-slate-600 dark:!bg-slate-800/95">
      <h2 class="text-center text-xl font-semibold mb-6 text-slate-900 dark:text-slate-100">
        校园心理健康评估平台 · 学生登录
      </h2>

      <NoticeBanner v-if="studentAuth.isLoggedIn" variant="info" badge="已登录" title="欢迎回来" class="mb-5">
        <p>当前账号 <strong>{{ studentAuth.username }}</strong> 正在使用本系统。</p>
        <template #actions>
          <el-button type="primary" round size="small" @click="router.push('/evaluation')">前往心理测评</el-button>
          <el-button round size="small" @click="onLogoutCurrent">退出并重新登录</el-button>
        </template>
      </NoticeBanner>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" @keyup.enter="onSubmit" />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="form.remember">记住密码</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="onSubmit">登录</el-button>
          <el-button text @click="$router.push('/register')">注册账号</el-button>
          <el-button text @click="openResetDialog">忘记密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="resetVisible" title="重置密码" width="400px" destroy-on-close>
      <el-form :model="resetForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="resetForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="resetForm.new_password" type="password" show-password placeholder="请输入新密码（≥6位）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetVisible = false">取消</el-button>
        <el-button type="primary" :loading="resetLoading" @click="onResetPassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NoticeBanner from '@/components/NoticeBanner.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import api from '@/api'
import { useStudentAuthStore } from '@/stores/studentAuth'
import { useAdminAuthStore } from '@/stores/adminAuth'
import { safeInternalPath } from '@/utils/redirect'

const route = useRoute()
const router = useRouter()
const studentAuth = useStudentAuthStore()
const adminAuth = useAdminAuthStore()

const formRef = ref()
const loading = ref(false)
const form = reactive({ username: '', password: '', remember: false })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const resetVisible = ref(false)
const resetLoading = ref(false)
const resetForm = reactive({ username: '', new_password: '' })

onMounted(() => {
  const remembered = localStorage.getItem('remember_username')
  if (remembered) {
    form.username = remembered
    form.remember = true
  }
})

function onLogoutCurrent() {
  studentAuth.clearSession()
  router.replace({ path: '/login', query: {} })
  ElMessage.success('已退出，请重新登录')
}

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const { data } = await api.post('/api/v1/user/login', form)
    if (data.code === 200) {
      adminAuth.clearSession()
      studentAuth.setSession(data.data)
      if (form.remember) localStorage.setItem('remember_username', data.data.username)
      else localStorage.removeItem('remember_username')
      ElMessage.success('登录成功')
      const next = safeInternalPath(route.query.redirect) || '/evaluation'
      setTimeout(() => router.push(next), 300)
    } else {
      ElMessage.error(data.msg || '登录失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.msg || '服务器错误')
  } finally {
    loading.value = false
  }
}

function openResetDialog() {
  resetForm.username = form.username
  resetForm.new_password = ''
  resetVisible.value = true
}

async function onResetPassword() {
  if (!resetForm.username || !resetForm.new_password) {
    ElMessage.warning('请填写用户名和新密码')
    return
  }
  resetLoading.value = true
  try {
    const { data } = await api.post('/api/v1/user/reset-password', resetForm)
    if (data.code === 200) {
      ElMessage.success('密码重置成功，请使用新密码登录')
      resetVisible.value = false
    } else {
      ElMessage.error(data.msg || '重置失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.msg || '服务器错误')
  } finally {
    resetLoading.value = false
  }
}
</script>
