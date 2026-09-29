<script setup lang="ts">
import type { Component } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Compass, Plug, Puzzle, Search, Sparkles } from 'lucide-vue-next'

interface MobileTab {
  name: string
  icon: Component
  to: string
  matches: (path: string) => boolean
}

const emit = defineEmits<{
  openSearch: []
}>()

const route = useRoute()

const tabs: MobileTab[] = [
  {
    name: 'Browse',
    icon: Compass,
    to: '/',
    matches: (path) => path === '/' || path === '/sites' || path.startsWith('/sites/'),
  },
  {
    name: 'Extensions',
    icon: Puzzle,
    to: '/extensions/writing',
    matches: (path) => path.startsWith('/extensions'),
  },
  {
    name: 'MCP',
    icon: Plug,
    to: '/mcp/development',
    matches: (path) => path.startsWith('/mcp'),
  },
  {
    name: 'Skills',
    icon: Sparkles,
    to: '/skills/skills',
    matches: (path) => path.startsWith('/skills'),
  },
]
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t border-gray-800 bg-[#1f1f1f]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden supports-[backdrop-filter]:bg-[#1f1f1f]/80"
    aria-label="Primary"
  >
    <ul class="flex h-14 items-stretch">
      <li v-for="tab in tabs" :key="tab.name" class="min-w-0 flex-1">
        <RouterLink
          :to="tab.to"
          class="flex h-full min-w-0 select-none flex-col items-center justify-center gap-0.5 py-1.5 transition-[scale] duration-100 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
          :aria-current="tab.matches(route.path) ? 'page' : undefined"
        >
          <component
            :is="tab.icon"
            class="h-5 w-5"
            :class="tab.matches(route.path) ? 'text-white' : 'text-gray-400'"
          />
          <span
            class="truncate text-[10px] leading-none font-medium"
            :class="tab.matches(route.path) ? 'text-white' : 'text-gray-400'"
          >
            {{ tab.name }}
          </span>
        </RouterLink>
      </li>

      <li class="min-w-0 flex-1">
        <button
          type="button"
          class="flex h-full w-full min-w-0 select-none flex-col items-center justify-center gap-0.5 py-1.5 text-gray-400 transition-[scale,color] duration-100 hover:text-white active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
          aria-label="Open smart search"
          @click="emit('openSearch')"
        >
          <Search class="h-5 w-5" />
          <span class="truncate text-[10px] leading-none font-medium">Search</span>
        </button>
      </li>
    </ul>
  </nav>
</template>
