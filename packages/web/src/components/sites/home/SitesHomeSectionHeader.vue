<script setup lang="ts">
defineProps<{
  title: string
  titleId: string
  hint?: string
}>()
</script>

<template>
  <div class="sites-section-header">
    <div class="sites-section-header__title-row">
      <h2 :id="titleId" class="sites-section-header__title">
        <slot name="icon" />
        <span>{{ title }}</span>
      </h2>
      <span v-if="hint" class="sites-section-header__hint" :title="hint" aria-label="Section info">
        i
      </span>
    </div>

    <div v-if="$slots.actions" class="sites-section-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.sites-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.sites-section-header__title-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.sites-section-header__title {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0;
  color: var(--sh-text-strong, #f5f5f5);
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.sites-section-header__title :deep(svg) {
  width: 1.35rem;
  height: 1.35rem;
  color: var(--sh-accent, #ff8c1a);
}

.sites-section-header__hint {
  display: inline-flex;
  width: 1.25rem;
  height: 1.25rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--sh-border-strong, rgba(255, 255, 255, 0.12));
  border-radius: 9999px;
  color: var(--sh-text-muted, rgba(255, 255, 255, 0.55));
  font-size: 0.7rem;
  font-weight: 700;
  font-style: italic;
  line-height: 1;
}

.sites-section-header__actions {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .sites-section-header__title {
    font-size: 1.35rem;
  }
}
</style>
