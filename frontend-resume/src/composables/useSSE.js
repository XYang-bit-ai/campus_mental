import { ref } from 'vue'

/**
 * SSE (Server-Sent Events) composable — 封装 Fetch + ReadableStream 解析。
 *
 * @param {object} opts
 * @param {string} opts.url
 * @param {string} [opts.token]
 * @param {function} opts.onChunk  - (text: string) => void
 * @param {function} [opts.onError] - (message: string) => void
 * @param {function} [opts.onDone]  - () => void
 */
export function useSSE() {
  const loading = ref(false)
  const streaming = ref(false)
  let abortCtrl = null

  async function start({ url, token, payload, onChunk, onError, onDone }) {
    if (loading.value) return
    loading.value = true
    streaming.value = false
    abortCtrl = new AbortController()

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        signal: abortCtrl.signal,
      })

      const ct = (res.headers.get('content-type') || '').toLowerCase()

      // 后端返回 JSON（错误或非流式降级）
      if (ct.includes('application/json')) {
        const j = await res.json()
        if (!res.ok || (j.code != null && j.code !== 200)) {
          throw new Error(j.msg || j.detail || `HTTP ${res.status}`)
        }
        throw new Error('未收到流式数据')
      }

      if (!res.ok) throw new Error(`请求失败 (${res.status})`)

      const reader = res.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const dec = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += dec.decode(value, { stream: true })
        const blocks = buffer.split('\n\n')
        buffer = blocks.pop() ?? ''

        for (const block of blocks) {
          for (const line of block.split('\n')) {
            const trimmed = line.trim()
            if (!trimmed.startsWith('data: ')) continue
            let data
            try { data = JSON.parse(trimmed.slice(6)) } catch { continue }

            if (data.type === 'chunk' && data.text) {
              streaming.value = true
              onChunk(data.text)
            } else if (data.type === 'error') {
              throw new Error(data.message || 'AI 暂时无法响应')
            }
          }
        }
      }

      onDone?.()
    } catch (e) {
      if (e.name !== 'AbortError') {
        onError?.(e.message || '网络错误')
      }
    } finally {
      loading.value = false
      streaming.value = false
      abortCtrl = null
    }
  }

  function abort() {
    abortCtrl?.abort()
  }

  return { loading, streaming, start, abort }
}
