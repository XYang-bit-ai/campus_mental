<template>
  <div>
    <el-card>
      <template #header>
        <div class="flex items-center justify-between flex-wrap gap-2">
          <span class="font-semibold">数据统计</span>
          <div class="flex flex-wrap gap-2">
            <el-button type="danger" text @click="onLogout">退出管理员</el-button>
          </div>
        </div>
      </template>

      <div class="flex flex-wrap items-center gap-3 mb-4">
        <el-date-picker v-model="dateRange" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
        <el-button type="primary" @click="loadStats">筛选</el-button>
        <el-button type="success" :loading="exporting" @click="onExportCsv">导出 CSV</el-button>
        <el-button type="warning" @click="$router.push('/admin/dashboard')">数据大屏</el-button>
        <el-button @click="$router.push('/admin/evaluations')">测评记录</el-button>
      </div>

      <!-- 图表 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div ref="emotionChartRef" class="h-[300px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50" />
        <div ref="scaleChartRef" class="h-[300px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50" />
      </div>

      <!-- 统计列表 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4">
          <h3 class="font-semibold mb-2">情绪标签统计</h3>
          <ul class="space-y-1 text-sm">
            <li v-for="item in emotionStats" :key="item.label" class="flex justify-between">
              <span>{{ item.label }}</span>
              <span class="font-mono text-teal-600 dark:text-teal-400">{{ item.count }} 人</span>
            </li>
            <li v-if="!emotionStats.length" class="text-slate-400">暂无数据</li>
          </ul>
        </div>
        <div class="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4">
          <h3 class="font-semibold mb-2">量表类型统计</h3>
          <ul class="space-y-1 text-sm">
            <li v-for="item in scaleStats" :key="item.scale_type" class="flex justify-between">
              <span>{{ item.scale_type }}</span>
              <span class="font-mono text-teal-600 dark:text-teal-400">{{ item.count }} 次</span>
            </li>
            <li v-if="!scaleStats.length" class="text-slate-400">暂无数据</li>
          </ul>
        </div>
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
import { useECharts } from '@/composables/useECharts'

const router = useRouter()
const adminAuth = useAdminAuthStore()

const dateRange = ref([])
const emotionStats = ref([])
const scaleStats = ref([])
const exporting = ref(false)
const emotionChartRef = ref(null)
const scaleChartRef = ref(null)

function emotionOption() {
  return {
    title: { text: '情绪标签分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['36%', '68%'],
      data: emotionStats.value.map((i) => ({ name: i.label, value: i.count })),
      label: { formatter: '{b}\n{c}人 ({d}%)' },
    }],
  }
}

function scaleOption() {
  return {
    title: { text: '量表使用次数', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: scaleStats.value.map((i) => i.scale_type), axisLabel: { interval: 0 } },
    yAxis: { type: 'value', minInterval: 1 },
    grid: { left: 48, right: 24, bottom: 32, top: 48 },
    series: [{ type: 'bar', data: scaleStats.value.map((i) => i.count), itemStyle: { color: '#0d9488', borderRadius: [4, 4, 0, 0] } }],
  }
}

const { refresh: refreshEmotion } = useECharts(emotionChartRef, emotionOption, { watchSource: emotionStats })
const { refresh: refreshScale } = useECharts(scaleChartRef, scaleOption, { watchSource: scaleStats })

function dateParams() {
  if (dateRange.value?.length === 2) return { start_time: dateRange.value[0], end_time: dateRange.value[1] }
  return {}
}

async function loadStats() {
  if (!adminAuth.isLoggedIn) return router.push('/admin/login')
  try {
    const { data: permData } = await api.get('/api/v1/admin/check-permission')
    if (permData.code !== 200) return router.push('/admin/login')

    const params = dateParams()
    const [emotionRes, scaleRes] = await Promise.all([
      api.get('/api/v1/admin/statistic/emotion', { params }),
      api.get('/api/v1/admin/statistic/scale', { params }),
    ])
    if (emotionRes.data.code === 200) emotionStats.value = emotionRes.data.data.emotion_stats || []
    if (scaleRes.data.code === 200) scaleStats.value = scaleRes.data.data.scale_stats || []
  } catch {
    ElMessage.error('获取统计数据失败')
  }
}

async function onExportCsv() {
  if (!adminAuth.isLoggedIn) return router.push('/admin/login')
  exporting.value = true
  try {
    const res = await api.get('/api/v1/admin/export/evaluations.csv', { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'evaluations_export.csv'
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('已开始下载')
  } catch {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

function onLogout() {
  adminAuth.clearSession()
  ElMessage.success('已退出')
  router.push('/admin/login')
}

onMounted(loadStats)
</script>
