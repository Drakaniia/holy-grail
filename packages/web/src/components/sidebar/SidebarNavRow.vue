<script setup lang="ts">
import type { Component } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

/**
 * The single row primitive for the whole column: 32px tall, a 32px icon slot so every label starts
 * at the same x, a truncating label, an optional plain `tabular-nums` count and an optional
 * disclosure chevron. Selection is a surface tint plus a foreground bump — never a left bar.
 */
const props = withDefaults(
  defineProps<{
    icon: Component
    label: string
    to?: string
    count?: number | null
    active?: boolean
    expandable?: boolean
    expanded?: boolean
    controls?: string
    buttonId?: string
    ariaLabel?: string
  }>(),
  {
    to: undefined,
    count: null,
    active: false,
    expandable: false,
    expanded: false,
    controls: undefined,
    buttonId: undefined,
    ariaLabel: undefined,
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
    :id="props.buttonId"
    :aria-label="props.ariaLabel"
    :aria-expanded="props.expandable ? props.expanded : undefined"
    :aria-controls="props.expandable ? props.controls : undefined"
    class="group/row relative flex h-8 w-full min-w-0 cursor-pointer items-center rounded-md pl-0.5 pr-2 text-sm transition-[background-color,color,transform] duration-150 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-sidebar-ring/60 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
    :class="
      props.active
        ? 'bg-sidebar-press text-sidebar-foreground'
        : 'text-sidebar-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground'
    "
    @click="emit('press')"
  >
    <span class="grid size-8 flex-none place-content-center">
      <component :is="props.icon" class="h-4 w-4" />
    </span>

    <span class="min-w-0 flex-1 truncate">{{ props.label }}</span>

    <span
      v-if="props.count !== null && props.count !== undefined"
      class="shrink-0 pl-2 text-xs tabular-nums"
      :class="
        props.active
          ? 'text-sidebar-foreground/70'
          : 'text-sidebar-muted-foreground/60 group-hover/row:text-sidebar-muted-foreground'
      "
    >
      {{ props.count }}
    </span>

    <span
      v-if="props.expandable"
      class="grid size-6 flex-none place-content-center rounded-sm transition-colors motion-reduce:transition-none group-hover/row:bg-sidebar-press group-active/row:bg-sidebar-hover"
    >
      <ChevronRight
        class="h-3 w-3 transition-transform duration-200 motion-reduce:transition-none"
        :class="{ 'rotate-90': props.expanded }"
      />
    </span>
  </component>
</template>
