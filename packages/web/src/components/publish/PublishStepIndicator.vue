<script setup lang="ts">
import { computed } from 'vue'

interface PublishStepItem {
  id: string
  label: string
  description: string
  doneLabel?: string
}

const props = defineProps<{
  steps: PublishStepItem[]
  activeStep: string
  completedStepIds: string[]
}>()

type StepState = 'current' | 'complete' | 'upcoming'

const activeStepIndex = computed(() =>
  props.steps.findIndex((step) => step.id === props.activeStep),
)

function resolveState(stepIndex: number): StepState {
  const step = props.steps[stepIndex]
  if (!step) return 'upcoming'
  if (step.id === props.activeStep) return 'current'
  if (props.completedStepIds.includes(step.id) || stepIndex < activeStepIndex.value) {
    return 'complete'
  }
  return 'upcoming'
}

/** Numbered once, here, so the rail, the step headers and the ticket all read 01 / 02 / 03. */
const railSteps = computed(() =>
  props.steps.map((step, index) => ({
    ...step,
    numeral: String(index + 1).padStart(2, '0'),
    state: resolveState(index),
  })),
)
</script>

<template>
  <nav class="publish-rail" aria-label="Submission progress">
    <ol class="publish-rail__list">
      <li
        v-for="step in railSteps"
        :key="step.id"
        class="publish-rail__item"
        :class="`is-${step.state}`"
      >
        <span class="publish-rail__num" aria-hidden="true">{{ step.numeral }}</span>
        <span class="publish-rail__copy">
          <span
            class="publish-rail__label"
            :aria-current="step.state === 'current' ? 'step' : undefined"
          >
            {{ step.label }}
          </span>
          <span class="publish-rail__desc">
            {{ step.state === 'complete' && step.doneLabel ? step.doneLabel : step.description }}
          </span>
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
/*
  The rail is a ledger edge, not a card row: one continuous hairline whose colour
  carries the state (orange for the step you are on, brighter grey for recorded
  steps). No fills, no badges, so the numeral stays the only mark.
*/
.publish-rail__list {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}

.publish-rail__item {
  display: grid;
  grid-template-columns: 2.25rem minmax(0, 1fr);
  gap: 0.35rem;
  align-items: baseline;
  border-left: 2px solid var(--p-border, rgba(255, 255, 255, 0.08));
  padding: 0.7rem 0 0.7rem 0.9rem;
  transition: border-color 200ms ease;
}

.publish-rail__item.is-current {
  border-left-color: var(--p-accent, #ff8c1a);
}

.publish-rail__item.is-complete {
  border-left-color: var(--p-border-strong, rgba(255, 255, 255, 0.2));
}

.publish-rail__num {
  color: var(--p-text-muted, rgba(255, 255, 255, 0.56));
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.publish-rail__item.is-current .publish-rail__num {
  color: var(--p-accent, #ff8c1a);
  font-weight: 700;
}

.publish-rail__copy {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.publish-rail__label {
  color: var(--p-text-muted, rgba(255, 255, 255, 0.56));
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.publish-rail__item.is-current .publish-rail__label,
.publish-rail__item.is-complete .publish-rail__label {
  color: var(--p-text-strong, #f4f4f4);
}

.publish-rail__desc {
  color: var(--p-text-muted, rgba(255, 255, 255, 0.56));
  font-size: 0.76rem;
  line-height: 1.5;
}

.publish-rail__item.is-current .publish-rail__desc {
  color: var(--p-text-soft, rgba(255, 255, 255, 0.72));
}
</style>
