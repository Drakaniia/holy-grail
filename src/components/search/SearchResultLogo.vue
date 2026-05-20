<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { Compass, Globe2, Sparkles } from 'lucide-vue-next'
import type { SmartSearchKind } from '@/composables/useSmartSearch'

const props = defineProps<{
  kind: SmartSearchKind
  title: string
  logoUrl: string | null
  active?: boolean
}>()

const imageError = shallowRef(false)

const fallbackIcon = computed(() => {
  switch (props.kind) {
    case 'collection':
      return Compass
    case 'site':
      return Globe2
    case 'skill':
      return Sparkles
    default:
      return Sparkles
  }
})

const shouldShowImage = computed(() => Boolean(props.logoUrl) && !imageError.value)
const fallbackInitial = computed(() => props.title.charAt(0).toUpperCase())

watch(
  () => props.logoUrl,
  () => {
    imageError.value = false
  },
)
</script>

<template>
  <span
    class="result-logo mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-800 bg-black text-gray-400 transition-colors group-hover:border-gray-700 group-hover:text-accent-300"
    :class="active ? 'result-logo--active border-accent-600/70 text-accent-300' : ''"
  >
    <img
      v-if="shouldShowImage"
      :src="logoUrl || ''"
      :alt="`${title} logo`"
      class="h-7 w-7 object-contain"
      loading="lazy"
      decoding="async"
      @error="imageError = true"
    />
    <component
      :is="fallbackIcon"
      v-else-if="kind === 'collection'"
      class="h-5 w-5"
      aria-hidden="true"
    />
    <span v-else class="text-sm font-bold text-white">
      {{ fallbackInitial }}
    </span>
  </span>
</template>

<style scoped>
.result-logo {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

:global(html.light .result-logo) {
  border-color: rgba(203, 182, 162, 0.82) !important;
  background: rgba(255, 245, 232, 0.82) !important;
  color: var(--mocha-muted) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

:global(html.light .group:hover .result-logo) {
  border-color: rgba(255, 140, 26, 0.38) !important;
  background: rgba(255, 140, 26, 0.1) !important;
  color: #9a4f00 !important;
}

:global(html.light .result-logo--active) {
  border-color: rgba(255, 140, 26, 0.42) !important;
  background: rgba(255, 140, 26, 0.14) !important;
  color: #9a4f00 !important;
}
</style>
