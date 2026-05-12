<template>
  <div class="max-w-[800px] mx-auto">
    <!-- 介绍卡片 -->
    <el-card class="mb-4" shadow="never">
      <h2 class="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">心灵树洞 · AI 陪伴倾诉</h2>
      <p class="text-sm leading-relaxed text-slate-500 dark:text-slate-400 mb-3">
        可与 AI 进行多轮文字交流，缓解压力与梳理情绪；回复以流式逐段显示。
      </p>
      <NoticeBanner
        v-if="config"
        :variant="config.chat_available ? 'info' : 'error'"
        badge="提示"
        :title="config.chat_available ? '本机 Ollama 或 DeepSeek 可用' : 'AI 当前不可用'"
      />
    </el-card>

    <!-- 对话面板 -->
    <el-card shadow="hover" class="flex flex-col" style="min-height: 480px">
      <div ref="scrollRef" class="messages-area">
        <div v-for="(m, i) in messages" :key="i" class="bubble-wrap" :class="m.role">
          <div class="bubble-meta">
            <span class="bubble-label">{{ m.role === 'user' ? '我' : '心灵树洞' }}</span>
            <span class="bubble-time">{{ m.time }}</span>
          </div>
          <div class="bubble">{{ m.content }}</div>
        </div>
        <div v-if="sse.loading.value && !sse.streaming.value" class="typing-indicator">
          <span class="dot" /><span class="dot" /><span class="dot" />
        </div>
      </div>

      <div class="input-area">
        <el-input
          v-model="draft"
          type="textarea"
          :rows="3"
          maxlength="2000"
          show-word-limit
          placeholder="说说此刻的心情（Ctrl+Enter 发送）"
          :disabled="sse.loading.value || (config && !config.chat_available)"
          @keydown.ctrl.enter="send"
        />
        <el-button
          type="primary"
          class="shrink-0 mb-1"
          :loading="sse.loading.value"
          :disabled="(config && !config.chat_available) || !draft.trim()"
          @click="send"
        >
          发送
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import NoticeBanner from '@/components/NoticeBanner.vue'
import api from '@/api'
import { useStudentAuthStore } from '@/stores/studentAuth'
import { useSSE } from '@/composables/useSSE'

const studentAuth = useStudentAuthStore()
const config = ref(null)
const draft = ref('')
const scrollRef = ref(null)

const messages = ref([
  {
    role: 'assistant',
    content: '你好，我是心灵树洞助手。你可以慢慢说，我会认真听。今天有什么想聊的吗？',
    time: dayjs().format('HH:mm'),
  },
])

const sse = useSSE()

async function loadConfig() {
  try {
    const { data } = await api.get('/api/v1/ai/public-config')
    if (data.code === 200) config.value = data.data
  } catch {
    config.value = { chat_available: true }
  }
}

function scrollBottom() {
  nextTick(() => {
    const el = scrollRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

watch(() => messages.value.length, scrollBottom)

async function send() {
  const text = draft.value.trim()
  if (!text || sse.loading.value) return
  if (config.value && !config.value.chat_available) return

  const now = dayjs().format('HH:mm')
  messages.value.push({ role: 'user', content: text, time: now })
  draft.value = ''

  const assistantIdx = messages.value.length
  messages.value.push({ role: 'assistant', content: '', time: '' })

  const historyPayload = messages.value
    .slice(0, assistantIdx)
    .map(({ role, content }) => ({ role, content }))

  await sse.start({
    url: '/api/v1/ai/chat/stream',
    token: studentAuth.accessToken,
    payload: { messages: historyPayload },
    onChunk(chunk) {
      messages.value[assistantIdx].content += chunk
      scrollBottom()
    },
    onError(msg) {
      ElMessage.error(msg)
      messages.value.splice(assistantIdx, 1)
    },
    onDone() {
      if (!messages.value[assistantIdx].content.trim()) {
        messages.value.splice(assistantIdx, 1)
        ElMessage.warning('未收到回复，请重试')
      } else {
        messages.value[assistantIdx].time = dayjs().format('HH:mm')
      }
    },
  })
}

onMounted(loadConfig)
</script>

<style scoped>
.messages-area {
  flex: 1;
  max-height: min(50vh, 440px);
  overflow-y: auto;
  padding: 8px 4px 16px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--app-border);
}

.bubble-wrap {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.bubble-wrap.user {
  align-items: flex-end;
}

.bubble-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 4px;
}
.bubble-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--app-text-muted);
}
.bubble-time {
  font-size: 11px;
  color: var(--app-text-muted);
  opacity: 0.7;
}

.bubble {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 12px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
}
.bubble-wrap.assistant .bubble {
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  color: #303133;
}
.bubble-wrap.user .bubble {
  background: #409eff;
  color: #fff;
}
.dark .bubble-wrap.assistant .bubble {
  background: #1e293b;
  border-color: #334155;
  color: #f1f5f9;
}
.dark .bubble-wrap.user .bubble {
  background: #0ea5e9;
  border-color: #0284c7;
}

/* 打字指示器 */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--app-text-muted);
  animation: bounce 1.4s infinite ease-in-out;
}
.dot:nth-child(1) { animation-delay: 0s; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.input-area {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}
.input-area :deep(.el-textarea) { flex: 1; }
</style>
