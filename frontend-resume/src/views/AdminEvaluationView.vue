<template>
  <div>
    <el-card>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-semibold">测评记录管理</span>
          <div class="flex gap-2">
            <el-button type="primary" @click="$router.push('/admin/statistic')">数据统计</el-button>
            <el-button type="danger" text @click="onLogout">退出</el-button>
          </div>
        </div>
      </template>

      <el-table :data="list" style="width: 100%" empty-text="暂无测评记录">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="学生" width="120" />
        <el-table-column prop="scale_type" label="量表" width="100" />
        <el-table-column prop="total_score" label="总分" width="80" />
        <el-table-column prop="emotion_label" label="情绪标签" width="120" />
        <el-table-column label="AI 来源" width="100">
          <template #default="{ row }">
            <el-tag :type="row.ai_generated ? 'success' : 'info'" size="small">
              {{ row.ai_generated ? (row.llm_backend || 'AI') : '模板' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="时间" />
      </el-table>

      <div class="mt-4 text-right">
        <el-pagination
          v-if="total > pageSize"
          background
          layout="prev, pager, next"
          :total="total"
          :page-size="pageSize"
          @current-change="onPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'
import { useAdminAuthStore } from '@/stores/adminAuth'

const router = useRouter()
const adminAuth = useAdminAuthStore()

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 20

async function loadData() {
  if (!adminAuth.isLoggedIn) return router.push('/admin/login')
  try {
    const { data } = await api.get('/api/v1/admin/evaluation/list', { params: { page: page.value, page_size: pageSize } })
    if (data.code === 200) {
      list.value = data.data.list || []
      total.value = data.data.total || 0
    }
  } catch {
    ElMessage.error('加载失败')
  }
}

function onPageChange(p) {
  page.value = p
  loadData()
}

function onLogout() {
  adminAuth.clearSession()
  ElMessage.success('已退出')
  router.push('/admin/login')
}

onMounted(loadData)
</script>
