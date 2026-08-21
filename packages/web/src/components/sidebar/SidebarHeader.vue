<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { SquareChevronLeft, SquareChevronRight } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import holyGrailLogo from '@/assets/holy-grail.png'

const SidebarAccountMenu = defineAsyncComponent(
  () => import('@/components/auth/SidebarAccountMenu.vue'),
)

defineProps<{
  collapsed: boolean
  isAuthenticated: boolean
}>()

const emit = defineEmits<{
  toggleCollapsed: []
}>()
</script>

<style scoped>
.sidebar-collapse-button {
  display: inline-flex;
  height: 2rem;
  width: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: 1px solid #1f1f1f;
  color: #6b7280;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease;
}

.sidebar-collapse-button:hover,
.sidebar-collapse-button:focus-visible {
  border-color: #374151;
  background: rgba(255, 140, 26, 0.1);
  color: #ffffff;
  outline: none;
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-collapse-button {
    transition: none;
  }
}
</style>

<template>
  <div
    class="relative z-[85] flex h-12 shrink-0 items-center border-b border-gray-800"
    :class="collapsed ? 'justify-center px-2' : 'gap-1 px-2'"
  >
    <template v-if="!collapsed">
      <SidebarAccountMenu v-if="isAuthenticated" />

      <RouterLink
        v-else
        to="/"
        class="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-white transition-colors hover:bg-accent-500/10"
        aria-label="Holy Grail home"
      >
        <img :src="holyGrailLogo" alt="" class="h-7 w-7 shrink-0 rounded" />
        <span class="truncate text-sm font-bold tracking-tight uppercase"> Holy Grail </span>
      </RouterLink>
    </template>

    <button
      type="button"
      class="sidebar-collapse-button"
      :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      @click="emit('toggleCollapsed')"
    >
      <SquareChevronRight v-if="collapsed" class="h-4 w-4" />
      <SquareChevronLeft v-else class="h-4 w-4" />
    </button>
  </div>
</template>
