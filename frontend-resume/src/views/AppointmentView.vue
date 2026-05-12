<template>
  <div class="max-w-xl mx-auto">
    <el-card>
      <template #header>
        <span class="font-semibold">咨询预约</span>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="预约日期" prop="date">
          <el-date-picker v-model="form.date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="时间段" prop="time">
          <el-select v-model="form.time" placeholder="选择时间段" style="width: 100%">
            <el-option label="09:00 - 10:00" value="09:00-10:00" />
            <el-option label="10:00 - 11:00" value="10:00-11:00" />
            <el-option label="14:00 - 15:00" value="14:00-15:00" />
            <el-option label="15:00 - 16:00" value="15:00-16:00" />
            <el-option label="16:00 - 17:00" value="16:00-17:00" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="可简要描述需求（选填）" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="onSubmit">提交预约</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'

const formRef = ref()
const loading = ref(false)
const form = reactive({ date: '', time: '', remark: '' })
const rules = {
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  time: [{ required: true, message: '请选择时间段', trigger: 'change' }],
}

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const { data } = await api.post('/api/v1/appointment/create', form)
    if (data.code === 200) {
      ElMessage.success('预约成功')
      formRef.value.resetFields()
    } else {
      ElMessage.error(data.msg || '预约失败')
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.msg || '服务器错误')
  } finally {
    loading.value = false
  }
}
</script>
