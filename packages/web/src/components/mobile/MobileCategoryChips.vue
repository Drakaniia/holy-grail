<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  getSectionChips,
  getSidebarSectionForPath,
  isActive,
  sidebarSections,
} from '@/components/sidebar/sidebarNav'

/**
 * One-thumb category hopping: the desktop tree collapses to a horizontal strip under the navbar,
 * scoped to whichever top-level section the current route belongs to.
 */
const route = useRoute()

const section = computed(() => {
  const key = getSidebarSectionForPath(route.path)
  return key ? (sidebarSections.find((entry) => entry.key === key) ?? null) : null
})

const chips = computed(() => (section.value ? getSectionChips(section.value.key) : []))

function isActiveChip(path: string) {
  return isActive(path, route.path, false)
}
</script>

<template>
  <div v-if="section && chips.length" class="shrink-0 border-b border-gray-800 md:hidden">
    <div
      class="flex items-center gap-1.5 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <span class="shrink-0 pr-0.5 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
        {{ section.name }}
      </span>

      <RouterLink
        v-for="chip in chips"
        :key="chip.route"
        :to="chip.route"
        class="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors"
        :class="
          isActiveChip(chip.route)
            ? 'border-transparent bg-[#1f1f1f] text-white'
            : 'border-gray-800 text-gray-400 hover:text-white'
        "
        :aria-current="isActiveChip(chip.route) ? 'page' : undefined"
      >
        <component :is="chip.icon" class="h-3.5 w-3.5" />
        <span>{{ chip.name }}</span>
      </RouterLink>
    </div>
  </div>
</template>
