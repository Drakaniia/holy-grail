<script setup lang="ts">
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'

/** 28px square icon control for the footer strip, with an optional pill badge (e.g. pending reviews). */
const props = withDefaults(
  defineProps<{
    icon: Component
    label: string
    to?: string
    badge?: number
  }>(),
  {
    to: undefined,
    badge: 0,
  },
)

const emit = defineEmits<{
  press: []
}>()
</script>

<template>
  <component
    :is="props.to ? RouterLink : 'button'"
    :to="props.to"
    :type="props.to ? undefined : 'button'"
    :aria-label="props.label"
    :title="props.label"
    class="relative inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-sidebar-muted-foreground transition-[background-color,color,transform] duration-150 hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-sidebar-ring/60 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
    @click="emit('press')"
  >
    <component :is="props.icon" class="h-4 w-4" />
    <span
      v-if="props.badge > 0"
      class="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-semibold leading-none text-[#1f1f1f]"
    >
      {{ props.badge }}
    </span>
  </component>
</template>
