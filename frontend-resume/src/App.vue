<template>
  <div
    class="min-h-screen transition-colors duration-300"
    :class="hideChrome ? 'bg-[#0b1020]' : 'bg-slate-100 dark:bg-slate-950'"
  >
    <template v-if="!hideChrome">
      <AppHeader />
      <main class="p-4 sm:p-6 text-slate-900 dark:text-slate-100">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </template>
    <router-view v-else />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()
const hideChrome = computed(() => route.meta.fullscreen === true)
</script>

<style scoped>
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
