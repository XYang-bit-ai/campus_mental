<template>
  <div class="notice" :class="`notice--${variant}`">
    <div class="notice__accent" aria-hidden="true" />
    <div class="notice__inner">
      <div class="notice__head">
        <span class="notice__badge">{{ badge }}</span>
        <h3 class="notice__title">{{ title }}</h3>
      </div>
      <div class="notice__body"><slot /></div>
      <div v-if="$slots.actions" class="notice__actions"><slot name="actions" /></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'info', validator: (v) => ['info', 'error', 'success', 'warning'].includes(v) },
  badge: { type: String, required: true },
  title: { type: String, required: true },
})
</script>

<style scoped>
.notice {
  position: relative;
  margin-bottom: 1rem;
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(13, 148, 136, 0.22);
  background: linear-gradient(135deg, rgba(240, 253, 250, 0.95), rgba(224, 242, 241, 0.9), rgba(204, 251, 241, 0.85));
  box-shadow: 0 4px 14px rgba(15, 118, 110, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.7);
}
.dark .notice--info {
  border-color: rgba(45, 212, 191, 0.25);
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(17, 94, 89, 0.35), rgba(15, 23, 42, 0.95));
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(45, 212, 191, 0.12);
}
.notice--error {
  border-color: rgba(244, 63, 94, 0.28);
  background: linear-gradient(135deg, rgba(255, 241, 242, 0.96), rgba(254, 226, 226, 0.92), rgba(255, 228, 230, 0.88));
}
.dark .notice--error {
  border-color: rgba(251, 113, 133, 0.35);
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(136, 19, 55, 0.28), rgba(15, 23, 42, 0.96));
}
.notice__accent {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  border-radius: 12px 0 0 12px;
}
.notice--info .notice__accent { background: linear-gradient(180deg, #14b8a6, #0d9488, #0f766e); }
.notice--error .notice__accent { background: linear-gradient(180deg, #fb7185, #e11d48, #be123c); }
.notice__inner {
  position: relative;
  padding: 1rem 1rem 1rem 1.25rem;
  margin-left: 4px;
}
.notice__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.notice__badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.55rem;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  border-radius: 999px;
}
.notice--info .notice__badge { background: linear-gradient(120deg, #0d9488, #0e7490); }
.notice--error .notice__badge { background: linear-gradient(120deg, #e11d48, #be123c); }
.notice__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}
.notice--info .notice__title { color: #0f766e; }
.dark .notice--info .notice__title { color: #5eead4; }
.notice--error .notice__title { color: #be123c; }
.dark .notice--error .notice__title { color: #fda4af; }
.notice__body {
  font-size: 13px;
  line-height: 1.65;
  color: #334155;
}
.dark .notice__body { color: #cbd5e1; }
.notice__body :deep(p) { margin: 0 0 0.5rem; }
.notice__body :deep(p:last-child) { margin-bottom: 0; }
.notice__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.875rem;
}
</style>
