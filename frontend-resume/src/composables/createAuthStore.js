import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

/**
 * Auth store factory — 消除 studentAuth / adminAuth 的重复模板。
 *
 * @param {string} id        - Pinia store id
 * @param {object} schema    - { stateKey: localStorageKey } 映射
 * @param {object} [options] - { idKey, usernameKey } 用于 isLoggedIn 计算
 */
export function createAuthStore(id, schema, options = {}) {
  const keys = Object.keys(schema)
  const idKey = options.idKey || keys.find((k) => k.endsWith('Id')) || keys[1]
  const usernameKey = options.usernameKey || keys.find((k) => k.toLowerCase().includes('username')) || keys[2]

  return defineStore(id, () => {
    // ── state ──
    const state = {}
    for (const key of keys) {
      const lsKey = schema[key]
      const raw = localStorage.getItem(lsKey)
      if (key.endsWith('Id')) {
        state[key] = ref(raw ? Number(raw) : null)
      } else {
        state[key] = ref(raw ?? '')
      }
    }

    const isLoggedIn = computed(() => Boolean(state[keys[0]].value)) // first key = token

    // ── actions ──
    function persist() {
      for (const key of keys) {
        const lsKey = schema[key]
        const val = state[key].value
        if (val != null && val !== '') localStorage.setItem(lsKey, String(val))
        else localStorage.removeItem(lsKey)
      }
    }

    function setSession(payload) {
      for (const key of keys) {
        // payload key 可能用 snake_case（access_token）或 camelCase
        const snakeKey = key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase())
        const val = payload[snakeKey] ?? payload[key]
        if (val != null) state[key].value = key.endsWith('Id') ? Number(val) : val
      }
      persist()
    }

    function clearSession() {
      for (const key of keys) {
        state[key].value = key.endsWith('Id') ? null : ''
        localStorage.removeItem(schema[key])
      }
    }

    return { ...state, isLoggedIn, setSession, clearSession }
  })
}
