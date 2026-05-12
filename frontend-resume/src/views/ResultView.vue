<template>
  <div class="max-w-2xl mx-auto">
    <el-card v-if="result">
      <h2 class="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">测评结果</h2>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="量表类型">{{ result.scale_type }}</el-descriptions-item>
        <el-descriptions-item label="总分">
          <span class="text-rose-500 font-bold text-lg">{{ result.total_score }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="情绪标签">
          <el-tag>{{ result.emotion_label }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="建议与点评">
          <div class="leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-200">
            {{ result.suggestion }}
          </div>
        </el-descriptions-item>
      </el-descriptions>

      <div class="mt-6 flex gap-3">
        <el-button type="primary" @click="$router.push('/evaluation')">再次测评</el-button>
        <el-button @click="$router.push('/personal')">个人中心</el-button>
      </div>
    </el-card>

    <SkeletonCard v-else :lines="5" title />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'
import SkeletonCard from '@/components/SkeletonCard.vue'

const route = useRoute()
const result = ref(null)

async function loadResult() {
  // 优先从 sessionStorage 读（提交后直接跳转的场景）
  const cached = sessionStorage.getItem('last_result')
  if (cached) {
    try { result.value = JSON.parse(cached) } catch { /* ignore */ }
  }

  // 如果有 result_id 参数，从接口拿最新
  const id = route.query.result_id
  if (id) {
    try {
      const { data } = await api.get('/api/v1/evaluation/result-detail', { params: { result_id: id } })
      if (data.code === 200) result.value = data.data
    } catch (e) {
      ElMessage.error(e.response?.data?.msg || '加载结果失败')
    }
  }
}

onMounted(loadResult)
</script>
