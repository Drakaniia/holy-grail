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

const imageLoaded = shallowRef(false)
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

// Reset state when logo URL changes
watch(
  () => props.logoUrl,
  () => {
    imageLoaded.value = false
    imageError.value = false
  },
)

function onImageLoad() {
  imageLoaded.value = true
}

function onImageError() {
  imageError.value = true
}
</script>

<template>
  <span
    class="cp-logo mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border text-sm transition-colors duration-75"
    :class="
      active
        ? 'cp-logo--active border-orange-500/40 bg-orange-500/10 text-orange-300'
        : 'border-white/[0.06] bg-white/[0.03] text-white/30 group-hover:border-white/[0.1] group-hover:text-white/50'
    "
  >
    <!-- Favicon image with fade-in -->
    <img
      v-if="shouldShowImage"
      :src="logoUrl || ''"
      :alt="`${title} logo`"
      class="h-5 w-5 object-contain transition-opacity duration-200"
      :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
      loading="lazy"
      decoding="async"
      @load="onImageLoad"
      @error="onImageError"
    />
    <!-- Fallback icon for collections -->
    <component
      :is="fallbackIcon"
      v-else-if="kind === 'collection'"
      class="h-4.5 w-4.5"
      aria-hidden="true"
    />
    <!-- Fallback initial for sites/skills -->
    <span v-else class="text-xs font-semibold">
      {{ fallbackInitial }}
    </span>
  </span>
</template>

<style scoped>
.cp-logo {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

/* Light mode */
:global(html.light .cp-logo) {
  border-color: rgba(180, 160, 140, 0.5);
  background: rgba(200, 180, 150, 0.2);
  color: rgba(61, 50, 38, 0.45);
}

:global(html.light .group:hover .cp-logo) {
  border-color: rgba(255, 140, 26, 0.3);
  background: rgba(255, 140, 26, 0.1);
  color: #b85a00;
}

:global(html.light .cp-logo--active) {
  border-color: rgba(255, 140, 26, 0.35);
  background: rgba(255, 140, 26, 0.12);
  color: #b85a00;
}
</style>
