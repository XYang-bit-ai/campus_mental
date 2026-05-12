<template>
  <div class="max-w-2xl mx-auto">
    <el-card>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-semibold">管理员中心</span>
          <el-button type="danger" text @click="onLogout">退出登录</el-button>
        </div>
      </template>

      <el-descriptions :column="1" border class="mb-6">
        <el-descriptions-item label="管理员 ID">{{ adminAuth.adminId }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ adminAuth.adminUsername }}</el-descriptions-item>
      </el-descriptions>

      <h3 class="font-semibold mb-3">修改密码</h3>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="当前密码" prop="old_password">
          <el-input v-model="form.old_password" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="form.new_password" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="onChangePassword">修改密码</el-button>
        </el-form-item>
      </el-form>

      <el-divider />
      <div class="flex gap-3">
        <el-button type="primary" @click="$router.push('/admin/statistic')">数据统计</el-button>
        <el-button type="warning" @click="$router.push('/admin/dashboard')">数据大屏</el-button>
        <el-button @click="$router.push('/admin/evaluations')">测评记录</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'
import { useAdminAuthStore } from '@/stores/adminAuth'

const router = useRouter()
const adminAuth = useAdminAuthStore()

const formRef = ref()
const loading = ref(false)
const form = reactive({ old_password: '', new_password: '' })
const rules = {
  old_password: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
}

async function onChangePassword() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const { data } = await api.post('/api/v1/admin/change-password', form)
    if (data.code === 200) {
      ElMessage.success('密码修改成功')
      formRef.value.resetFields()
    } else {
      ElMessage.error(data.msg || '修改失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.msg || '服务器错误')
  } finally {
    loading.value = false
  }
}

function onLogout() {
  adminAuth.clearSession()
  ElMessage.success('已退出')
  router.push('/admin/login')
}
</script>
