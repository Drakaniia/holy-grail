<script setup lang="ts">
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'

export interface PublishStepItem {
  id: string
  label: string
  description: string
}

const props = defineProps<{
  steps: PublishStepItem[]
  activeStep: string
  completedStepIds: string[]
}>()

const activeStepIndex = computed(() => props.steps.findIndex(step => step.id === props.activeStep))

function isCompleted(stepId: string) {
  return props.completedStepIds.includes(stepId)
}

function getStepState(step: PublishStepItem, index: number) {
  if (step.id === props.activeStep) return 'current'
  if (isCompleted(step.id)) return 'complete'
  if (index < activeStepIndex.value) return 'complete'
  return 'upcoming'
}
</script>

<template>
  <ol class="grid gap-2 sm:grid-cols-3" aria-label="Publish progress">
    <li v-for="(step, index) in props.steps" :key="step.id">
      <div
        class="flex h-full gap-3 border px-4 py-3 transition"
        :class="[
          getStepState(step, index) === 'current'
            ? 'border-accent-400/70 bg-accent-500/10 text-white'
            : 'border-gray-800 bg-[#1f1f1f] text-gray-500',
          getStepState(step, index) === 'complete' ? 'border-emerald-400/30 text-gray-300' : '',
        ]"
      >
        <span
          class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border text-xs font-bold"
          :class="
            getStepState(step, index) === 'complete'
              ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
              : getStepState(step, index) === 'current'
                ? 'border-accent-300/60 bg-accent-400/15 text-accent-100'
                : 'border-gray-800 text-gray-600'
          "
        >
          <Check v-if="getStepState(step, index) === 'complete'" class="h-3.5 w-3.5" />
          <span v-else>{{ index + 1 }}</span>
        </span>
        <span class="min-w-0">
          <span class="block text-sm font-bold">{{ step.label }}</span>
          <span class="mt-1 block text-xs leading-5 text-gray-500">{{ step.description }}</span>
        </span>
      </div>
    </li>
  </ol>
</template>
