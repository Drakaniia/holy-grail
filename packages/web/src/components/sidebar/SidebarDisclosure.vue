<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

/**
 * Disclosure region that animates between its measured height and 0 (never `max-height`), then
 * releases the fixed height to `auto` so late content (icons, longer labels) can never clip.
 *
 * Closed content stays mounted but `inert`, so hidden rows are unreachable by tab and by AT.
 */
const props = withDefaults(
  defineProps<{
    open: boolean
    labelledby?: string
  }>(),
  {
    labelledby: undefined,
  },
)

const DURATION_MS = 200
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)'

const region = ref<HTMLElement | null>(null)
let settleTimer: number | undefined

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function releaseHeight(open: boolean) {
  const el = region.value
  if (!el) return

  el.style.transition = ''
  if (open) {
    el.style.height = 'auto'
    el.style.overflow = 'visible'
  } else {
    el.style.height = '0px'
    el.style.overflow = 'hidden'
  }
}

function clearSettleTimer() {
  if (typeof window !== 'undefined' && settleTimer !== undefined) {
    window.clearTimeout(settleTimer)
    settleTimer = undefined
  }
}

function apply(open: boolean, animate: boolean) {
  const el = region.value
  if (!el) return

  clearSettleTimer()

  if (!animate || prefersReducedMotion()) {
    releaseHeight(open)
    return
  }

  const from = el.getBoundingClientRect().height
  const to = open ? el.scrollHeight : 0

  el.style.transition = 'none'
  el.style.height = `${from}px`
  el.style.overflow = 'hidden'
  void el.offsetHeight
  el.style.transition = `height ${DURATION_MS}ms ${EASING}`
  el.style.height = `${to}px`

  // Fallback for the case where the height never actually changes (no transitionend fires).
  settleTimer = window.setTimeout(() => releaseHeight(open), DURATION_MS + 60)
}

function handleTransitionEnd(event: TransitionEvent) {
  if (event.target !== event.currentTarget || event.propertyName !== 'height') return
  if (settleTimer === undefined) return

  clearSettleTimer()
  releaseHeight(props.open)
}

watch(
  () => props.open,
  (open) => apply(open, true),
)

onMounted(() => apply(props.open, false))

onBeforeUnmount(clearSettleTimer)
</script>

<template>
  <div
    ref="region"
    role="region"
    :aria-labelledby="props.labelledby"
    :aria-hidden="!props.open"
    @transitionend="handleTransitionEnd"
  >
    <div :inert="props.open ? undefined : true">
      <slot />
    </div>
  </div>
</template>
