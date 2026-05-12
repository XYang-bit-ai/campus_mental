<template>
  <div>
    <el-card>
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-semibold">心理科普资源库</span>
          <el-select v-model="type" placeholder="资源类型" style="width: 160px" @change="onFilterChange">
            <el-option label="全部" value="" />
            <el-option label="文章" value="article" />
            <el-option label="音频" value="audio" />
          </el-select>
        </div>
      </template>

      <!-- 骨架屏 -->
      <el-row v-if="loading" :gutter="16">
        <el-col v-for="i in 6" :key="i" :xs="24" :sm="12" :md="8" :lg="6">
          <SkeletonCard class="mb-4" :lines="2" />
        </el-col>
      </el-row>

      <!-- 资源列表 -->
      <el-row v-else-if="list.length" :gutter="16">
        <el-col v-for="item in list" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="mb-4 cursor-pointer hover:shadow-md transition-shadow" @click="$router.push(`/resources/${item.id}`)">
            <div class="font-semibold mb-2 text-slate-900 dark:text-slate-100">{{ item.title }}</div>
            <div class="flex justify-between text-xs text-slate-400">
              <el-tag :type="item.type === 'article' ? '' : 'success'" size="small">
                {{ item.type === 'article' ? '文章' : '音频' }}
              </el-tag>
              <span>{{ item.create_time }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 空状态 -->
      <el-empty v-else description="暂无资源" />

      <!-- 分页 -->
      <div v-if="total > pageSize" class="mt-4 text-right">
        <el-pagination
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
import { ElMessage } from 'element-plus'
import api from '@/api'
import SkeletonCard from '@/components/SkeletonCard.vue'

const type = ref('')
const page = ref(1)
const pageSize = 10
const total = ref(0)
const list = ref([])
const loading = ref(true)

async function loadData() {
  loading.value = true
  try {
    const { data } = await api.get('/api/v1/resource/list', {
      params: { type: type.value || undefined, page: page.value },
    })
    if (data.code === 200) {
      total.value = data.data.total
      list.value = data.data.list
    } else {
      ElMessage.error(data.msg || '获取失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.msg || '服务器错误')
  } finally {
    loading.value = false
  }
}

function onFilterChange() {
  page.value = 1
  loadData()
}

function onPageChange(p) {
  page.value = p
  loadData()
}

onMounted(loadData)
</script>
