<template>
  <div class="skeleton-card" :style="{ height }">
    <div v-if="title" class="skeleton-line skeleton-title" :style="{ width: titleWidth }" />
    <div v-for="i in lines" :key="i" class="skeleton-line" :style="{ width: i === lines ? '60%' : '100%' }" />
  </div>
</template>

<script setup>
defineProps({
  lines: { type: Number, default: 3 },
  title: { type: String, default: '' },
  titleWidth: { type: String, default: '40%' },
  height: { type: String, default: 'auto' },
})
</script>

<style scoped>
.skeleton-card {
  background: var(--app-bg-card, #fff);
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid var(--app-border, #e2e8f0);
}
.skeleton-line {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-bottom: 12px;
}
.skeleton-title {
  height: 20px;
  margin-bottom: 16px;
}
.dark .skeleton-line {
  background: linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%);
  background-size: 200% 100%;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
