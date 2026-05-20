<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string | null
    initial: string
    label?: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    label: 'User profile',
    size: 'md',
    src: null,
  }
)

const imageFailed = shallowRef(false)
const showImage = computed(() => Boolean(props.src && !imageFailed.value))
const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-8 w-8 text-xs'
    case 'lg':
      return 'h-16 w-16 text-2xl'
    default:
      return 'h-10 w-10 text-sm'
  }
})

watch(
  () => props.src,
  () => {
    imageFailed.value = false
  }
)
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-accent-500/30 bg-accent-500/10 font-bold text-accent-100"
    :class="sizeClass"
  >
    <img
      v-if="showImage"
      :src="src || ''"
      :alt="label"
      class="h-full w-full object-cover"
      referrerpolicy="no-referrer"
      @error="imageFailed = true"
    />
    <span v-else>{{ initial }}</span>
  </span>
</template>
