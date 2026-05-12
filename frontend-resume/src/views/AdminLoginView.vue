<template>
  <div class="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
    <el-card class="w-full max-w-md shadow-lg dark:!border-slate-600 dark:!bg-slate-800/95">
      <h2 class="text-center text-xl font-semibold mb-6 text-slate-900 dark:text-slate-100">管理员登录</h2>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入管理员用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" @keyup.enter="onSubmit" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="onSubmit">登录</el-button>
          <el-button text @click="registerVisible = true">受控注册</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-dialog v-model="registerVisible" title="受控注册管理员" width="400px" destroy-on-close>
      <el-form :model="regForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="regForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="regForm.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="注册密钥">
          <el-input v-model="regForm.secret" type="password" show-password placeholder="管理员注册密钥" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="registerVisible = false">取消</el-button>
        <el-button type="primary" :loading="regLoading" @click="onRegister">注册</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
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
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const registerVisible = ref(false)
const regLoading = ref(false)
const regForm = reactive({ username: '', password: '', secret: '' })

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const { data } = await api.post('/api/v1/admin/login', form)
    if (data.code === 200) {
      studentAuth.clearSession()
      adminAuth.setSession(data.data)
      ElMessage.success('管理员登录成功')
      const next = safeInternalPath(route.query.redirect) || '/admin/statistic'
      router.push(next)
    } else {
      ElMessage.error(data.msg || '登录失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.msg || '服务器错误')
  } finally {
    loading.value = false
  }
}

async function onRegister() {
  if (!regForm.username || !regForm.password || !regForm.secret) {
    return ElMessage.warning('请填写完整信息')
  }
  regLoading.value = true
  try {
    const { data } = await api.post('/api/v1/admin/register', regForm)
    if (data.code === 200) {
      ElMessage.success('注册成功，请登录')
      registerVisible.value = false
    } else {
      ElMessage.error(data.msg || '注册失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.msg || '注册失败')
  } finally {
    regLoading.value = false
  }
}
</script>
