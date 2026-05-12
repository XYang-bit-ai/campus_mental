<template>
  <div class="max-w-3xl mx-auto">
    <el-card v-if="resource">
      <h1 class="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">{{ resource.title }}</h1>
      <div class="flex items-center gap-3 mb-6 text-sm text-slate-400">
        <el-tag :type="resource.type === 'article' ? '' : 'success'" size="small">
          {{ resource.type === 'article' ? '文章' : '音频' }}
        </el-tag>
        <span>{{ resource.create_time }}</span>
      </div>
      <div class="prose prose-slate dark:prose-invert max-w-none leading-relaxed whitespace-pre-wrap">
        {{ resource.content }}
      </div>
      <div class="mt-8">
        <el-button @click="$router.push('/resources')">返回资源库</el-button>
      </div>
    </el-card>
    <SkeletonCard v-else :lines="8" title />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'
import SkeletonCard from '@/components/SkeletonCard.vue'

const route = useRoute()
const resource = ref(null)

onMounted(async () => {
  try {
    const { data } = await api.get(`/api/v1/resource/${route.params.id}`)
    if (data.code === 200) resource.value = data.data
    else ElMessage.error(data.msg || '加载失败')
  } catch (e) {
    ElMessage.error(e.response?.data?.msg || '服务器错误')
  }
})
</script>
