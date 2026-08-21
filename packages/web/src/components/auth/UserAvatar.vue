<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string | null
    initial: string
    label?: string
    shape?: 'circle' | 'rounded'
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    label: 'User profile',
    shape: 'rounded',
    size: 'md',
    src: null,
  },
)

const imageFailed = shallowRef(false)
const showImage = computed(() => Boolean(props.src && !imageFailed.value))
const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-8 w-8 text-xs'
    case 'lg':
      return 'h-16 w-16 text-2xl'
    case 'xl':
      return 'h-20 w-20 text-3xl'
    default:
      return 'h-10 w-10 text-sm'
  }
})
const shapeClass = computed(() => (props.shape === 'circle' ? 'rounded-full' : 'rounded-lg'))

watch(
  () => props.src,
  () => {
    imageFailed.value = false
  },
)
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center overflow-hidden border border-accent-500/30 bg-accent-500/10 font-bold text-accent-100"
    :class="[sizeClass, shapeClass]"
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
