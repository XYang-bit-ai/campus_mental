<template>
  <div>
    <!-- 用户信息 -->
    <el-card class="mb-4">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-semibold">个人中心</span>
          <el-button type="danger" text @click="onLogout">退出登录</el-button>
        </div>
      </template>
      <el-descriptions :column="2">
        <el-descriptions-item label="用户名">{{ userInfo.username }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ userInfo.register_time }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="16">
      <!-- 测评记录 -->
      <el-col :md="12" :xs="24" class="mb-4">
        <el-card>
          <template #header><span class="font-semibold">我的测评记录</span></template>
          <SkeletonCard v-if="evalLoading" :lines="4" />
          <template v-else>
            <el-table :data="evalList" style="width: 100%" empty-text="暂无测评记录">
              <el-table-column prop="scale_type" label="量表" width="100" />
              <el-table-column prop="total_score" label="总分" width="80" />
              <el-table-column prop="emotion_label" label="情绪标签" width="120" />
              <el-table-column label="AI 来源" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.ai_generated ? 'success' : 'info'" size="small">
                    {{ row.ai_generated ? (row.llm_backend === 'ollama' ? 'Ollama' : row.llm_backend === 'deepseek' ? 'DeepSeek' : 'AI') : '模板' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="create_time" label="时间" />
              <el-table-column label="操作" width="80" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="openDetail(row)">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button class="mt-3" type="primary" size="small" @click="$router.push('/evaluation')">去测评</el-button>
          </template>
        </el-card>
      </el-col>

      <!-- 预约记录 -->
      <el-col :md="12" :xs="24" class="mb-4">
        <el-card>
          <template #header><span class="font-semibold">我的预约</span></template>
          <SkeletonCard v-if="apptLoading" :lines="4" />
          <template v-else>
            <el-table :data="appointments" style="width: 100%" empty-text="暂无预约记录">
              <el-table-column prop="date" label="日期" width="120" />
              <el-table-column prop="time" label="时间" width="120" />
              <el-table-column prop="status" label="状态" width="100" />
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button v-if="row.status === '已预约'" type="danger" link size="small" @click="onCancel(row)">取消</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button class="mt-3" type="primary" size="small" @click="$router.push('/appointment')">预约咨询</el-button>
          </template>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷入口 -->
    <div class="flex flex-wrap gap-3">
      <el-button type="success" @click="$router.push('/resources')">心理科普资源库</el-button>
      <el-button type="primary" plain @click="$router.push('/ai-chat')">心灵树洞 · AI 聊聊</el-button>
    </div>

    <!-- 测评详情对话框 -->
    <el-dialog v-model="detailVisible" title="测评详情" width="520px" destroy-on-close>
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="量表">{{ detail.scale_type }}</el-descriptions-item>
        <el-descriptions-item label="总分">{{ detail.total_score }}</el-descriptions-item>
        <el-descriptions-item label="情绪标签">
          <el-tag>{{ detail.emotion_label }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="建议与点评">
          <div class="whitespace-pre-wrap leading-relaxed">{{ detail.suggestion }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="测评时间">{{ detail.create_time }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'
import { useStudentAuthStore } from '@/stores/studentAuth'
import SkeletonCard from '@/components/SkeletonCard.vue'

const router = useRouter()
const studentAuth = useStudentAuthStore()

const userInfo = reactive({ username: '', register_time: '' })
const evalList = ref([])
const appointments = ref([])
const evalLoading = ref(true)
const apptLoading = ref(true)
const detailVisible = ref(false)
const detail = ref(null)

async function loadUserInfo() {
  try {
    const { data } = await api.get('/api/v1/user/info')
    if (data.code === 200) Object.assign(userInfo, data.data)
  } catch { /* ignore */ }
}

async function loadEvalResults() {
  try {
    const { data } = await api.get('/api/v1/evaluation/get-my-results')
    if (data.code === 200) evalList.value = data.data.results || []
  } catch { /* ignore */ }
  finally { evalLoading.value = false }
}

async function loadAppointments() {
  try {
    const { data } = await api.get('/api/v1/appointment/my-list')
    if (data.code === 200) appointments.value = data.data.appointments || []
  } catch { /* ignore */ }
  finally { apptLoading.value = false }
}

async function onCancel(row) {
  try {
    const { data } = await api.post('/api/v1/appointment/cancel', { appointment_id: row.id })
    if (data.code === 200) {
      ElMessage.success('取消成功')
      loadAppointments()
    } else {
      ElMessage.error(data.msg || '取消失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.msg || '服务器错误')
  }
}

function onLogout() {
  studentAuth.clearSession()
  ElMessage.success('已退出登录')
  router.push('/login')
}

async function openDetail(row) {
  try {
    const { data } = await api.get('/api/v1/evaluation/result-detail', { params: { result_id: row.id } })
    if (data.code === 200) {
      detail.value = data.data
      detailVisible.value = true
    }
  } catch { ElMessage.error('加载失败') }
}

onMounted(() => {
  if (!studentAuth.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  loadUserInfo()
  loadEvalResults()
  loadAppointments()
})
</script>
