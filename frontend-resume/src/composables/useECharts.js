import { ref, onMounted, onUnmounted, watch, nextTick, shallowRef } from 'vue'
import * as echarts from 'echarts/core'
import { PieChart, BarChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  PieChart, BarChart, LineChart,
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent, DatasetComponent, CanvasRenderer,
])

/**
 * ECharts composable — 统一 init / resize / dispose / 主题切换。
 *
 * @param {import('vue').Ref<HTMLElement>} elRef - 容器 ref
 * @param {() => object} getOption - 返回 ECharts option 的函数
 * @param {object} [opts]
 * @param {import('vue').Ref} [opts.watchSource] - 额外的响应式依赖
 */
export function useECharts(elRef, getOption, opts = {}) {
  const chart = shallowRef(null)

  function init() {
    if (!elRef.value) return
    chart.value = echarts.init(elRef.value)
    chart.value.setOption(getOption())
  }

  function refresh() {
    if (chart.value) {
      chart.value.setOption(getOption(), true)
    }
  }

  function handleResize() {
    chart.value?.resize()
  }

  onMounted(() => {
    init()
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    chart.value?.dispose()
    chart.value = null
  })

  if (opts.watchSource) {
    watch(opts.watchSource, async () => {
      await nextTick()
      if (chart.value) refresh()
      else init()
    }, { deep: true })
  }

  return { chart, refresh, handleResize }
}

export { echarts }
