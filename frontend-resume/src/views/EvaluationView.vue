<template>
  <div class="max-w-3xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-semibold text-slate-900 dark:text-slate-100">心理健康测评</h1>
      <div v-if="questions.length" class="flex items-center gap-3">
        <span class="text-sm text-slate-500 dark:text-slate-400">
          已答 {{ answeredCount }} / {{ questions.length }}
        </span>
        <el-progress
          :percentage="progressPercent"
          :stroke-width="8"
          :show-text="false"
          style="width: 120px"
        />
        <span class="text-lg font-bold text-rose-500">{{ totalScore }} 分</span>
      </div>
    </div>

    <el-card>
      <!-- AI 配置提示 -->
      <el-alert v-if="aiHint" class="mb-4" type="info" :closable="false" show-icon :title="aiHint" />

      <!-- 量表选择 -->
      <el-form inline class="mb-4">
        <el-form-item label="量表类型">
          <el-select v-model="scaleType" @change="loadQuestions">
            <el-option label="PHQ-9" value="PHQ-9" />
            <el-option label="SCL-90" value="SCL-90" />
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 骨架屏 -->
      <template v-if="pageLoading">
        <SkeletonCard v-for="i in 3" :key="i" class="mb-4" :lines="2" title />
      </template>

      <!-- 题目列表 -->
      <template v-else-if="questions.length">
        <div v-for="(q, idx) in questions" :key="q.id" class="question-item">
          <div class="q-title">
            <span class="q-number">{{ idx + 1 }}</span>
            {{ q.content }}
          </div>
          <el-radio-group v-model="answers[idx]" @change="calcTotal">
            <el-radio-button :label="0">0 分（无）</el-radio-button>
            <el-radio-button :label="1">1 分（轻度）</el-radio-button>
            <el-radio-button :label="2">2 分（中度）</el-radio-button>
            <el-radio-button :label="3">3 分（重度）</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <!-- 空状态 -->
      <el-empty v-else description="暂无题目" />

      <!-- 提交 -->
      <div class="mt-8 text-center">
        <el-button type="primary" size="large" :disabled="!canSubmit" :loading="submitting" @click="onSubmit">
          提交测评
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import api from '@/api'
import { useStudentAuthStore } from '@/stores/studentAuth'
import SkeletonCard from '@/components/SkeletonCard.vue'

const router = useRouter()
const studentAuth = useStudentAuthStore()

const scaleType = ref('PHQ-9')
const questions = ref([])
const answers = ref([])
const totalScore = ref(0)
const submitting = ref(false)
const pageLoading = ref(true)
const aiHint = ref('')

const answeredCount = computed(() => answers.value.filter((v) => v !== null).length)
const progressPercent = computed(() =>
  questions.value.length ? Math.round((answeredCount.value / questions.value.length) * 100) : 0,
)
const canSubmit = computed(() => questions.value.length > 0 && answeredCount.value === questions.value.length)

async function loadQuestions() {
  pageLoading.value = true
  try {
    const { data } = await api.get('/api/v1/evaluation/get-questions', {
      params: { scale_type: scaleType.value },
    })
    if (data.code === 200) {
      questions.value = data.data.questions || []
      answers.value = Array(questions.value.length).fill(null)
      totalScore.value = 0
    } else {
      ElMessage.error(data.msg || '获取题目失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.msg || '服务器错误')
  } finally {
    pageLoading.value = false
  }
}

function calcTotal() {
  totalScore.value = answers.value.reduce((sum, v) => sum + (v ?? 0), 0)
}

async function onSubmit() {
  if (!canSubmit.value) return ElMessage.warning('请完成所有题目')
  if (!studentAuth.isLoggedIn) return router.push('/login')

  submitting.value = true
  try {
    const { data } = await api.post(
      '/api/v1/evaluation/calculate-result',
      { scale_type: scaleType.value, scores: answers.value },
      { timeout: 120000 },
    )
    if (data.code === 200) {
      sessionStorage.setItem('last_result', JSON.stringify(data.data))
      ElMessage.success('测评完成')
      if (data.data?.ai_user_hint) ElMessage.warning(data.data.ai_user_hint)
      const q = data.data?.id != null ? { result_id: String(data.data.id) } : {}
      setTimeout(() => router.push({ path: '/result', query: q }), 300)
    } else {
      ElMessage.error(data.msg || '测评失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.msg || '服务器错误')
  } finally {
    submitting.value = false
  }
}

async function checkAiConfig() {
  try {
    const { data } = await api.get('/api/v1/ai/public-config')
    if (data.code === 200 && data.data && !data.data.deepseek_configured) {
      aiHint.value = '未配置 DeepSeek：将优先使用本机 Ollama；若未安装，提交后仅生成规则模板建议。'
    }
  } catch { /* ignore */ }
}

onMounted(async () => {
  await checkAiConfig()
  loadQuestions()
})
</script>

<style scoped>
.question-item {
  margin-top: 1.25rem;
  padding: 1rem;
  border-radius: 10px;
  background: var(--app-bg-page);
  border: 1px solid var(--app-border);
}
.q-title {
  margin-bottom: 0.75rem;
  font-size: 15px;
  line-height: 1.6;
  color: var(--app-text-primary);
}
.q-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #0d9488;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  margin-right: 0.5rem;
}
</style>
