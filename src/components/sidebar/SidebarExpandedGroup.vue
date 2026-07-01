<script setup lang="ts">
import type { Component } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import type { SidebarNavItem, SiteGroup } from './sidebarNav'

defineProps<{
  icon: Component
  name: string
  route: string
  group: SiteGroup | string
  isExpanded: boolean
  isGroupActive: boolean
  visibleItems: SidebarNavItem[]
  showGroup: boolean
  getGroupCount: (group: SiteGroup | string) => number
  getItemCount: (route: string) => number
  isItemActive: (route: string) => boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()
</script>

<style scoped>
.sidebar-group-shell {
  display: grid;
  grid-template-rows: 1fr;
  overflow: hidden;
}

.sidebar-group-inner {
  min-height: 0;
  overflow: hidden;
}

.sidebar-group-enter-active,
.sidebar-group-leave-active {
  transition:
    grid-template-rows 180ms ease,
    opacity 160ms ease,
    transform 180ms ease;
}

.sidebar-group-enter-from,
.sidebar-group-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
  transform: translateY(-4px);
}

.sidebar-group-enter-to,
.sidebar-group-leave-from {
  grid-template-rows: 1fr;
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-group-enter-active,
  .sidebar-group-leave-active {
    transition: none;
  }
}
</style>

<template>
  <li v-if="showGroup">
    <button
      type="button"
      class="w-full flex items-center rounded-md text-left transition-colors group text-xs"
      :class="
        isGroupActive
          ? 'bg-[#1f1f1f] text-white'
          : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
      "
      :aria-expanded="isExpanded"
      :aria-controls="`sidebar-${group}-branch`"
      :aria-label="`Toggle ${name} sites`"
      @click="emit('toggle')"
    >
      <span class="min-w-0 flex-1 flex items-center gap-3 px-2 py-1.5">
        <component :is="icon" class="w-3.5 h-3.5 flex-shrink-0" />
        <span class="min-w-0 flex-1 truncate font-medium">{{ name }}</span>
        <span
          class="shrink-0 rounded px-1.5 text-[10px] font-semibold tabular-nums"
          :class="isGroupActive ? 'text-zinc-300' : 'text-gray-600 group-hover:text-gray-300'"
        >
          {{ getGroupCount(group) }}
        </span>
      </span>
      <ChevronRight
        class="mr-2 w-3 h-3 text-gray-600 transition-transform duration-200 ease-out group-hover:text-gray-300"
        :class="{ 'rotate-90': isExpanded }"
      />
    </button>
  </li>

  <Transition name="sidebar-group">
    <li
      v-if="isExpanded && visibleItems.length > 0"
      :id="`sidebar-${group}-branch`"
      class="sidebar-group-shell"
    >
      <ul class="sidebar-group-inner ml-4 space-y-0.5">
        <li v-for="item in visibleItems" :key="item.name">
          <RouterLink
            :to="item.route"
            class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors group relative text-xs"
            :class="
              isItemActive(item.route)
                ? 'bg-[#1f1f1f] text-white'
                : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
            "
          >
            <div
              v-if="isItemActive(item.route)"
              class="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-white"
            ></div>
            <component :is="item.icon" class="w-3.5 h-3.5" />
            <span class="min-w-0 flex-1 truncate font-medium">{{ item.name }}</span>
            <span
              class="ml-auto shrink-0 rounded px-1.5 text-[10px] font-semibold tabular-nums"
              :class="
                isItemActive(item.route)
                  ? 'text-zinc-300'
                  : 'text-gray-600 group-hover:text-gray-300'
              "
            >
              {{ getItemCount(item.route) }}
            </span>
          </RouterLink>
        </li>
      </ul>
    </li>
  </Transition>
</template>
