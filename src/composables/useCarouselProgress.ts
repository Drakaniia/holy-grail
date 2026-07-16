import { computed, onMounted, onUnmounted, shallowRef, watch, type Ref } from 'vue'

const SLIDE_DURATION_MS = 6000
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export function useCarouselProgress(options: {
  slideCount: Ref<number>
  durationMs?: number
  autoplay?: Ref<boolean> | boolean
}) {
  const durationMs = options.durationMs ?? SLIDE_DURATION_MS
  const activeIndex = shallowRef(0)
  const progress = shallowRef(0)
  const isPaused = shallowRef(false)
  const direction = shallowRef<1 | -1>(1)

  let frameId = 0
  let lastTimestamp = 0
  let elapsedMs = 0
  let prefersReducedMotion = false

  const autoplayEnabled = computed(() => {
    if (typeof options.autoplay === 'boolean') return options.autoplay
    if (options.autoplay) return options.autoplay.value
    return true
  })

  const canNavigate = computed(() => options.slideCount.value > 1)

  function clampIndex(index: number) {
    const count = options.slideCount.value
    if (count <= 0) return 0
    return ((index % count) + count) % count
  }

  function resetProgress() {
    elapsedMs = 0
    progress.value = 0
    lastTimestamp = 0
  }

  function goTo(index: number, nextDirection: 1 | -1 = 1) {
    if (!canNavigate.value && index === activeIndex.value) return
    direction.value = nextDirection
    activeIndex.value = clampIndex(index)
    resetProgress()
  }

  function next() {
    goTo(activeIndex.value + 1, 1)
  }

  function prev() {
    goTo(activeIndex.value - 1, -1)
  }

  function pause() {
    isPaused.value = true
  }

  function resume() {
    isPaused.value = false
    lastTimestamp = 0
  }

  function tick(timestamp: number) {
    frameId = window.requestAnimationFrame(tick)

    if (
      !autoplayEnabled.value ||
      isPaused.value ||
      prefersReducedMotion ||
      options.slideCount.value <= 1
    ) {
      lastTimestamp = 0
      return
    }

    if (!lastTimestamp) {
      lastTimestamp = timestamp
      return
    }

    elapsedMs += timestamp - lastTimestamp
    lastTimestamp = timestamp
    progress.value = Math.min(1, elapsedMs / durationMs)

    if (elapsedMs >= durationMs) {
      next()
    }
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      pause()
    } else {
      resume()
    }
  }

  watch(
    () => options.slideCount.value,
    (count) => {
      if (activeIndex.value >= count) {
        goTo(0, 1)
      }
    },
  )

  onMounted(() => {
    prefersReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches
    frameId = window.requestAnimationFrame(tick)
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })

  onUnmounted(() => {
    if (frameId) window.cancelAnimationFrame(frameId)
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  return {
    activeIndex,
    progress,
    direction,
    isPaused,
    canNavigate,
    goTo,
    next,
    prev,
    pause,
    resume,
  }
}
