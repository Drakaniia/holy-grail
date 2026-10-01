<script setup lang="ts">
import { ref, computed } from 'vue'
import { faviconUrl as buildFaviconUrl } from '@/lib/format'

const props = withDefaults(
  defineProps<{
    website: string
    name: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    size: 'md',
  },
)

const imageError = ref(false)

const faviconUrl = computed(() => buildFaviconUrl(props.website))

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return { container: 'w-10 h-10', image: 'w-6 h-6', letter: 'text-lg' }
    case 'lg':
      return { container: 'w-16 h-16', image: 'w-10 h-10', letter: 'text-3xl' }
    default:
      return { container: 'w-12 h-12', image: 'w-8 h-8', letter: 'text-xl' }
  }
})
</script>

<template>
  <div
    :class="[
      'rounded-lg bg-[#1f1f1f] border border-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden',
      sizeClasses.container,
    ]"
  >
    <img
      v-if="faviconUrl && !imageError"
      :src="faviconUrl"
      :alt="name"
      :class="[sizeClasses.image, 'object-contain']"
      @error="imageError = true"
    />
    <span v-else :class="[sizeClasses.letter, 'font-bold text-white']">{{
      name.charAt(0).toUpperCase()
    }}</span>
  </div>
</template>
