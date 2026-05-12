<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1 class="dashboard-title">心理健康数据可视化大屏</h1>
      <div class="dashboard-meta">
        <span class="font-mono text-sm opacity-70">{{ clock }}</span>
        <ThemeToggle variant="floating" />
        <el-button type="primary" link @click="loadAll">刷新</el-button>
        <el-button type="warning" link @click="$router.push('/admin/statistic')">数据统计</el-button>
        <el-button type="danger" link @click="onLogout">退出</el-button>
      </div>
    </header>

    <div class="flex flex-wrap items-center gap-3 mb-5">
      <el-date-picker v-model="dateRange" type="daterange" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" :teleported="false" class="max-w-[320px]" />
      <el-button type="primary" @click="loadAll">应用筛选</el-button>
      <span class="text-xs opacity-50">情绪与量表统计均按所选日期范围汇总</span>
    </div>

    <!-- KPI -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">测评人次（区间内）</div>
        <div class="kpi-value">{{ kpiTotal }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">情绪类别数</div>
        <div class="kpi-value">{{ emotionStats.length }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">量表类型数</div>
        <div class="kpi-value">{{ scaleStats.length }}</div>
      </div>
    </div>

    <!-- 图表 -->
    <div class="charts-grid">
      <div ref="emotionChartRef" class="chart-panel" />
      <div ref="scaleChartRef" class="chart-panel" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import ThemeToggle from '@/components/ThemeToggle.vue'
import api from '@/api'
import { useAdminAuthStore } from '@/stores/adminAuth'
import { useECharts, echarts } from '@/composables/useECharts'

const router = useRouter()
const adminAuth = useAdminAuthStore()

const dateRange = ref([])
const emotionStats = ref([])
const scaleStats = ref([])
const emotionChartRef = ref(null)
const scaleChartRef = ref(null)
const clock = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))

setInterval(() => { clock.value = dayjs().format('YYYY-MM-DD HH:mm:ss') }, 1000)

const kpiTotal = computed(() => emotionStats.value.reduce((s, i) => s + (i.count || 0), 0))

const chartTheme = { backgroundColor: 'transparent', textStyle: { color: '#c8d7f0' } }

function emotionOption() {
  return {
    ...chartTheme,
    title: { text: '情绪标签分布', left: 'center', top: 8, textStyle: { color: '#e8f1ff', fontSize: 16 } },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['38%', '62%'],
      center: ['50%', '55%'],
      data: emotionStats.value.map((i) => ({ name: i.label, value: i.count })),
      label: { color: '#c8d7f0', formatter: '{b}\n{c}人 ({d}%)' },
      itemStyle: { borderColor: '#0b1020', borderWidth: 2 },
    }],
  }
}

function scaleOption() {
  return {
    ...chartTheme,
    title: { text: '量表使用次数', left: 'center', top: 8, textStyle: { color: '#e8f1ff', fontSize: 16 } },
    tooltip: { trigger: 'axis' },
    grid: { left: 56, right: 28, bottom: 40, top: 52 },
    xAxis: {
      type: 'category',
      data: scaleStats.value.map((i) => i.scale_type),
      axisLabel: { color: '#8fa4c8', interval: 0 },
      axisLine: { lineStyle: { color: '#2a3f5f' } },
    },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: '#8fa4c8' }, splitLine: { lineStyle: { color: '#1e2a44' } } },
    series: [{
      type: 'bar',
      data: scaleStats.value.map((i) => i.count),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#66b1ff' },
          { offset: 1, color: '#409eff' },
        ]),
        borderRadius: [4, 4, 0, 0],
      },
    }],
  }
}

useECharts(emotionChartRef, emotionOption, { watchSource: emotionStats })
useECharts(scaleChartRef, scaleOption, { watchSource: scaleStats })

function dateParams() {
  if (dateRange.value?.length === 2) return { start_time: dateRange.value[0], end_time: dateRange.value[1] }
  return {}
}

async function loadAll() {
  if (!adminAuth.isLoggedIn) return router.push('/admin/login')
  try {
    const { data: perm } = await api.get('/api/v1/admin/check-permission')
    if (perm.code !== 200) return router.push('/admin/login')

    const params = dateParams()
    const [eRes, sRes] = await Promise.all([
      api.get('/api/v1/admin/statistic/emotion', { params }),
      api.get('/api/v1/admin/statistic/scale', { params }),
    ])
    if (eRes.data.code === 200) emotionStats.value = eRes.data.data.emotion_stats || []
    if (sRes.data.code === 200) scaleStats.value = sRes.data.data.scale_stats || []
  } catch {
    ElMessage.error('加载失败')
  }
}

function onLogout() {
  adminAuth.clearSession()
  ElMessage.success('已退出')
  router.push('/admin/login')
}

onMounted(loadAll)
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  padding: 20px 24px 32px;
  background: radial-gradient(ellipse 120% 80% at 50% -20%, #1a2847 0%, #0b1020 45%);
  color: #e8f1ff;
  box-sizing: border-box;
}
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}
.dashboard-title {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-shadow: 0 0 24px rgba(64, 158, 255, 0.35);
}
.dashboard-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.kpi-card {
  background: linear-gradient(145deg, rgba(26, 40, 71, 0.9), rgba(15, 22, 40, 0.95));
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}
.kpi-label { font-size: 13px; color: #8fa4c8; margin-bottom: 8px; }
.kpi-value { font-size: 28px; font-weight: 700; color: #66b1ff; font-variant-numeric: tabular-nums; }
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 20px;
}
.chart-panel {
  height: 380px;
  background: rgba(15, 22, 40, 0.6);
  border: 1px solid rgba(64, 158, 255, 0.15);
  border-radius: 12px;
  padding: 8px;
  box-sizing: border-box;
}
</style>
