<script setup lang="ts">
import { ref, computed } from 'vue'
import { Check, Copy } from 'lucide-vue-next'

const props = defineProps<{
  installCommand: string
}>()

const emit = defineEmits<{
  'view-details': []
}>()

const segment = ref<'agent' | 'human'>('agent')
const copied = ref(false)

async function copyPrompt() {
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
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

const instructionText = computed(() =>
  segment.value === 'agent'
    ? 'Send this prompt to your agent to install the skill.'
    : 'Run this command in your terminal:',
)
</script>

<template>
  <div class="rounded-xl border border-gray-800 bg-[#1f1f1f] p-4">
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-base font-medium text-white">Installation Method</h3>
      <button
        @click="emit('view-details')"
        class="text-xs text-accent-500 transition-colors hover:text-accent-400"
      >
        View Details →
      </button>
    </div>

    <!-- Segmented control -->
    <div class="mb-4 inline-flex rounded-lg border border-gray-700 p-0.5">
      <button
        @click="segment = 'agent'"
        class="rounded-md px-3 py-1 text-xs font-medium transition-all"
        :class="
          segment === 'agent' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
        "
      >
        Agent
      </button>
      <button
        @click="segment = 'human'"
        class="rounded-md px-3 py-1 text-xs font-medium transition-all"
        :class="
          segment === 'human' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
        "
      >
        Human
      </button>
    </div>

    <p class="mb-2 text-xs text-gray-500">{{ instructionText }}</p>

    <pre
      class="mb-3 overflow-x-auto rounded-lg border border-gray-700 bg-gray-900 p-2.5 font-mono text-xs text-gray-300"
      >{{ installCommand }}</pre>

    <button
      @click="copyPrompt"
      class="flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-all"
      :class="
        copied
          ? 'border-green-800 text-green-400'
          : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
      "
    >
      <component :is="copied ? Check : Copy" class="h-3.5 w-3.5" />
      {{ copied ? 'Copied!' : 'Copy Prompt' }}
    </button>
  </div>
</template>
