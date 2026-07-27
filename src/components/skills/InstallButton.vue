<script setup lang="ts">
import { computed } from 'vue'
import { Check, Copy, Loader2 } from 'lucide-vue-next'
import type { InstallStatus } from '@/services/grailInstaller'

const props = defineProps<{
  status: InstallStatus
  isInstalled: boolean
  command: string
}>()

const emit = defineEmits<{
  install: []
}>()

const label = computed(() => {
  if (props.isInstalled) return 'Installed'
  switch (props.status) {
    case 'copying':
      return 'Copying...'
    case 'copied':
      return 'Copied!'
    case 'installing':
      return 'Installing...'
    case 'error':
      return 'Try Again'
    default:
      return 'Use This Skill'
  }
})

const icon = computed(() => {
  if (props.isInstalled || props.status === 'copied') return Check
  if (props.status === 'copying' || props.status === 'installing') return Loader2
  return Copy
})
</script>

<template>
  <button
    :disabled="isInstalled || status === 'installing' || status === 'copying'"
    class="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
    :class="
      isInstalled
        ? 'border border-green-800 bg-green-900/20 text-green-400'
        : 'border border-accent-600 bg-accent-600/10 text-accent-400 hover:bg-accent-600/20 hover:text-accent-300'
    "
    @click="emit('install')"
  >
    <component
      :is="icon"
      class="h-4 w-4"
      :class="{ 'animate-spin': status === 'copying' || status === 'installing' }"
    />
    {{ label }}
  </button>
</template>
