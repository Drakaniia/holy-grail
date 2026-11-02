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
      <span v-if="hint" class="sites-section-header__hint" :title="hint" :aria-label="hint">
        i
      </span>
    </div>

    <span class="sites-section-header__rule" aria-hidden="true"></span>

    <div v-if="$slots.actions" class="sites-section-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
/*
  Section titles sit on a ledger rule instead of a boxed card header: the hairline
  carries the section break, so the page needs no alternating fills to read as sections.
*/
.sites-section-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1rem;
}

.sites-section-header__title-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-shrink: 0;
  min-width: 0;
}

.sites-section-header__title {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  color: var(--sh-text-strong, #f5f5f5);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.sites-section-header__title :deep(svg) {
  width: 1rem;
  height: 1rem;
  color: var(--sh-text-muted, rgba(255, 255, 255, 0.5));
}

.sites-section-header__rule {
  height: 1px;
  flex: 1;
  background: var(--sh-border, rgba(255, 255, 255, 0.08));
}

.sites-section-header__hint {
  display: inline-flex;
  width: 1.1rem;
  height: 1.1rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--sh-border, rgba(255, 255, 255, 0.12));
  border-radius: 9999px;
  color: var(--sh-text-muted, rgba(255, 255, 255, 0.5));
  cursor: help;
  font-size: 0.62rem;
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
  .sites-section-header {
    gap: 0.6rem;
  }
}
</style>
