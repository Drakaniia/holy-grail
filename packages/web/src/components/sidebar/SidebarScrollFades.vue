<script setup lang="ts">
import { onBeforeUnmount, shallowRef, watch } from 'vue'

/**
 * The two gradient scrims the reference column floats over its list: a 40px top fade that appears
 * once the list has scrolled off its first row, and a 48px bottom fade that disappears at the end
 * of the list. Both are transparent to the pointer and fade over 300ms, so the list can bleed to
 * the column edges without ever looking clipped by the header or the pinned promo card.
 */
const props = defineProps<{
  scroller: HTMLElement | null
}>()

const hasScrolled = shallowRef(false)
const atBottom = shallowRef(true)

let observer: ResizeObserver | undefined

function sync() {
  const el = props.scroller
  if (!el) {
    hasScrolled.value = false
    atBottom.value = true
    return
  }

  hasScrolled.value = el.scrollTop > 0
  atBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
}

function detach() {
  props.scroller?.removeEventListener('scroll', sync)
  observer?.disconnect()
  observer = undefined
}

function attach(el: HTMLElement) {
  el.addEventListener('scroll', sync, { passive: true })

  // The list grows as icons and counts stream in, so a resize has to re-check the end offset.
  observer = new ResizeObserver(sync)
  observer.observe(el)

  sync()
}

watch(
  () => props.scroller,
  (el, previous) => {
    previous?.removeEventListener('scroll', sync)
    observer?.disconnect()
    observer = undefined

    if (el) attach(el)
    else sync()
  },
  { immediate: true },
)

onBeforeUnmount(detach)
</script>

<template>
  <div
    aria-hidden="true"
    class="sidebar-scroll-fade sidebar-scroll-fade--top pointer-events-none absolute inset-x-0 top-0 h-10 transition-opacity duration-300 motion-reduce:transition-none"
    :class="hasScrolled ? 'opacity-100' : 'opacity-0'"
  ></div>
  <div
    aria-hidden="true"
    class="sidebar-scroll-fade sidebar-scroll-fade--bottom pointer-events-none absolute inset-x-0 bottom-0 h-12 transition-opacity duration-300 motion-reduce:transition-none"
    :class="atBottom ? 'opacity-0' : 'opacity-100'"
  ></div>
</template>

<style scoped>
/* Alpha over the column surface rather than a fixed gray, so both palettes keep the seam soft. */
.sidebar-scroll-fade--top {
  background-image: linear-gradient(
    to bottom,
    var(--color-sidebar),
    color-mix(in oklab, var(--color-sidebar) 50%, transparent),
    transparent
  );
}

.sidebar-scroll-fade--bottom {
  background-image: linear-gradient(
    to top,
    var(--color-sidebar),
    color-mix(in oklab, var(--color-sidebar) 50%, transparent),
    transparent
  );
}
</style>
