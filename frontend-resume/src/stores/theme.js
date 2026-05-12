import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'campus_theme'

function applyHtmlClass(isDark) {
  document.documentElement.classList.toggle('dark', isDark)
}

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(
    typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'dark',
  )

  function toggle() {
    isDark.value = !isDark.value
    localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
    applyHtmlClass(isDark.value)
  }

  function syncFromStorage() {
    const dark = localStorage.getItem(STORAGE_KEY) === 'dark'
    isDark.value = dark
    applyHtmlClass(dark)
  }

  return { isDark, toggle, syncFromStorage }
})
