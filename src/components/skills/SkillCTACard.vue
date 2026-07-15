<script setup lang="ts">
import { ref } from 'vue'
import { Check, Copy, Share2 } from 'lucide-vue-next'

const props = defineProps<{
  installCommand: string
}>()

const copied = ref(false)

async function copyCommand() {
  if (!props.installCommand) return
  try {
    await navigator.clipboard.writeText(props.installCommand)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = props.installCommand
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div class="rounded-xl border border-gray-800 bg-[#1f1f1f] p-4">
    <button
      @click="copyCommand"
      class="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
      :class="copied ? 'bg-green-900 hover:bg-green-900' : ''"
    >
      <component :is="copied ? Check : Copy" class="h-4 w-4" />
      {{ copied ? 'Copied!' : 'Run this Skill' }}
    </button>

    <button
      class="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-700 py-2 text-sm text-gray-500 transition-colors hover:text-white"
      title="Share"
    >
      <Share2 class="h-4 w-4" />
      Share
    </button>
  </div>
</template>
