<script setup lang="ts">
import { ref, computed } from 'vue'
import { Check, Copy } from 'lucide-vue-next'

const props = defineProps<{
  installCommand: string
}>()

const segment = ref<'agent' | 'human'>('agent')
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
  <section>
    <h2 class="mb-4 text-2xl font-semibold text-white">Installation Method</h2>

    <!-- Segmented Control -->
    <div class="mb-6 inline-flex rounded-lg border border-gray-700 bg-[#1f1f1f] p-0.5">
      <button
        @click="segment = 'agent'"
        class="rounded-md px-4 py-1.5 text-sm font-medium transition-all"
        :class="
          segment === 'agent' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
        "
      >
        I'm an Agent
      </button>
      <button
        @click="segment = 'human'"
        class="rounded-md px-4 py-1.5 text-sm font-medium transition-all"
        :class="
          segment === 'human' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'
        "
      >
        I'm a Human
      </button>
    </div>

    <!-- Instruction + Command -->
    <div class="rounded-xl border border-gray-800 bg-[#1f1f1f] p-5">
      <p class="mb-3 text-sm text-gray-400">{{ instructionText }}</p>

      <div class="flex items-stretch gap-2">
        <pre
          class="flex-1 overflow-x-auto rounded-lg border border-gray-700 bg-gray-900 p-3 font-mono text-sm text-gray-300"
          >{{ installCommand }}</pre>
        <button
          @click="copyCommand"
          class="flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all"
          :class="
            copied
              ? 'border-green-800 text-green-400'
              : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'
          "
        >
          <component :is="copied ? Check : Copy" class="h-4 w-4" />
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
      </div>
    </div>
  </section>
</template>
