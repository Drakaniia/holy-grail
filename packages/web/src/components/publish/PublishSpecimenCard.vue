<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  resourceTypeLabel: string
  name: string
  url: string
  category: string
  description: string
}>()

const trimmedName = computed(() => props.name.trim())
const initial = computed(() => (trimmedName.value ? trimmedName.value.charAt(0).toUpperCase() : ''))

/** Domain only: the catalog tile never shows a full URL, so the preview does not either. */
const host = computed(() => {
  const raw = props.url.trim()
  if (!raw) return ''
  try {
    return new URL(raw).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
})
</script>

<template>
  <aside class="specimen" aria-labelledby="publish-specimen-title">
    <h3 id="publish-specimen-title" class="specimen__title">As it would appear</h3>

    <div class="specimen__card">
      <div class="specimen__head">
        <span class="specimen__mark" aria-hidden="true">{{ initial }}</span>
        <div class="specimen__identity">
          <p class="specimen__name">{{ trimmedName || 'Untitled submission' }}</p>
          <p class="specimen__host">{{ host || 'No domain yet' }}</p>
        </div>
      </div>

      <p class="specimen__desc">{{ description.trim() || 'No description yet.' }}</p>

      <p class="specimen__meta">
        <span>{{ resourceTypeLabel }}</span>
        <span class="specimen__sep" aria-hidden="true">/</span>
        <span>{{ category || 'Category not set' }}</span>
      </p>
    </div>

    <p class="specimen__note">
      This is your own entry rendered the way the catalog lists it. Fields update as you type.
    </p>
  </aside>
</template>

<style scoped>
.specimen {
  display: grid;
  gap: 0.7rem;
  align-content: start;
}

.specimen__title {
  margin: 0;
  color: var(--p-text-muted, rgba(255, 255, 255, 0.56));
  font-size: 0.78rem;
  font-weight: 500;
}

.specimen__card {
  display: grid;
  gap: 0.9rem;
  border: 1px solid var(--p-border, rgba(255, 255, 255, 0.08));
  border-radius: 10px;
  background: var(--p-surface, #212121);
  padding: 1rem;
}

.specimen__head {
  display: flex;
  gap: 0.7rem;
  align-items: center;
  min-width: 0;
}

.specimen__mark {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 2.4rem;
  height: 2.4rem;
  border: 1px solid var(--p-border, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  color: var(--p-text-soft, rgba(255, 255, 255, 0.72));
  font-size: 1rem;
  font-weight: 600;
}

.specimen__identity {
  min-width: 0;
}

.specimen__name {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--p-text-strong, #f4f4f4);
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.4;
}

.specimen__host {
  margin: 0.15rem 0 0;
  overflow-wrap: anywhere;
  color: var(--p-text-muted, rgba(255, 255, 255, 0.56));
  font-size: 0.74rem;
}

.specimen__desc {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  color: var(--p-text-soft, rgba(255, 255, 255, 0.72));
  font-size: 0.82rem;
  line-height: 1.6;
}

.specimen__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0;
  border-top: 1px solid var(--p-border, rgba(255, 255, 255, 0.08));
  padding-top: 0.75rem;
  color: var(--p-text-muted, rgba(255, 255, 255, 0.56));
  font-size: 0.74rem;
  line-height: 1.5;
}

.specimen__sep {
  color: color-mix(in srgb, var(--p-text-muted, #8f8f99) 60%, transparent);
}

.specimen__note {
  margin: 0;
  color: var(--p-text-muted, rgba(255, 255, 255, 0.56));
  font-size: 0.72rem;
  line-height: 1.6;
}
</style>
