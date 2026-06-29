<script setup lang="ts">
import { Puzzle, Search, Sparkles } from 'lucide-vue-next'
import type { SidebarNavGroup, SidebarNavItem } from './sidebarNav'

defineProps<{
  groups: SidebarNavGroup[]
  isActive: (path: string, exact?: boolean) => boolean
  getGroupCount: (group: string) => number
  getItemCount: (route: string) => number
  showExtensionsSection: boolean
  showSkillsSection: boolean
  extensionCategories: SidebarNavItem[]
  skillsNav: SidebarNavItem[]
  totalSkillCount: number
}>()

const emit = defineEmits<{
  openSearch: []
}>()
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1f1f1f;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #374151;
}

.sidebar-rail-button {
  position: relative;
  display: flex;
  height: 2.25rem;
  width: 100%;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.sidebar-rail-button:focus-visible {
  outline: 1px solid #ff8c1a;
  outline-offset: 2px;
}

.sidebar-rail-button--plain {
  color: #6b7280;
}

.sidebar-rail-group {
  position: relative;
}

.sidebar-rail-group:hover > .sidebar-rail-button,
.sidebar-rail-group:has(:focus-visible) > .sidebar-rail-button {
  background: rgba(255, 140, 26, 0.1);
  color: #ffffff;
}

.sidebar-rail-tooltip {
  pointer-events: none;
  position: absolute;
  left: calc(100% + 0.5rem);
  top: 50%;
  z-index: 105;
  transform: translate(-0.25rem, -50%);
  visibility: hidden;
  white-space: nowrap;
  border-radius: 0.375rem;
  border: 1px solid #374151;
  background: #1f1f1f;
  padding: 0.35rem 0.5rem;
  color: #e5e7eb;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  opacity: 0;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.42);
  transition:
    opacity 140ms ease,
    transform 140ms ease,
    visibility 140ms ease;
}

.sidebar-rail-button:hover .sidebar-rail-tooltip,
.sidebar-rail-button:focus-visible .sidebar-rail-tooltip {
  transform: translate(0, -50%);
  visibility: visible;
  opacity: 1;
}

.sidebar-rail-flyout {
  pointer-events: none;
  position: absolute;
  left: 100%;
  top: 0;
  z-index: 100;
  width: 16rem;
  transform: translateX(-0.25rem);
  visibility: hidden;
  overflow: hidden;
  border: 1px solid #1f1f1f;
  border-radius: 0.5rem;
  background: #1f1f1f;
  opacity: 0;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.46);
  transition:
    opacity 160ms ease,
    transform 160ms ease,
    visibility 160ms ease;
}

.sidebar-rail-group:hover .sidebar-rail-flyout,
.sidebar-rail-group:has(:focus-visible) .sidebar-rail-flyout {
  pointer-events: auto;
  transform: translateX(0);
  visibility: visible;
  opacity: 1;
}

.sidebar-flyout-link {
  display: flex;
  min-height: 2rem;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.375rem;
  padding: 0.5rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  transition:
    background-color 150ms ease,
    color 150ms ease;
}

.sidebar-flyout-link:focus-visible {
  outline: 1px solid #ff8c1a;
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-rail-button,
  .sidebar-rail-tooltip,
  .sidebar-rail-flyout,
  .sidebar-flyout-link {
    transition: none;
  }
}
</style>

<template>
  <nav
    class="min-h-0 flex-1 overflow-visible px-2 py-3"
    aria-label="Collapsed navigation"
  >
    <ul class="space-y-1">
      <li>
        <button
          type="button"
          class="sidebar-rail-button sidebar-rail-button--plain"
          aria-label="Search tabs"
          @click="emit('openSearch')"
        >
          <Search class="h-4 w-4" />
          <span class="sidebar-rail-tooltip">Search tabs</span>
        </button>
      </li>

      <li v-for="group in groups" :key="group.group" class="sidebar-rail-group">
        <RouterLink
          :to="group.route"
          class="sidebar-rail-button"
          :class="
            isActive(group.route, false)
              ? 'text-white'
              : 'text-gray-400 hover:bg-accent-500/10 hover:text-white'
          "
          :aria-label="`${group.name} sites`"
        >
          <span
            v-if="isActive(group.route, false)"
            class="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-white"
          ></span>
          <component :is="group.icon" class="h-4 w-4" />
        </RouterLink>

        <div class="sidebar-rail-flyout">
          <div class="border-b border-gray-800 px-3 py-2">
            <div class="flex items-center gap-2">
              <component :is="group.icon" class="h-4 w-4 text-gray-400" />
              <span class="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                {{ group.name }}
              </span>
              <span class="rounded px-1.5 text-[10px] font-semibold text-gray-500">
                {{ getGroupCount(group.group) }}
              </span>
            </div>
          </div>

          <div class="custom-scrollbar max-h-[min(30rem,calc(100vh-7rem))] overflow-y-auto p-2">
            <RouterLink
              v-for="item in group.items"
              :key="item.name"
              :to="item.route"
              class="sidebar-flyout-link"
              :class="
                isActive(item.route)
                  ? 'bg-[#1f1f1f] text-white'
                  : 'text-gray-400 hover:bg-accent-500/10 hover:text-white'
              "
            >
              <component :is="item.icon" class="h-3.5 w-3.5 shrink-0" />
              <span class="min-w-0 flex-1 truncate">{{ item.name }}</span>
              <span
                class="ml-auto shrink-0 rounded px-1.5 text-[10px] font-semibold text-gray-600"
              >
                {{ getItemCount(item.route) }}
              </span>
            </RouterLink>
          </div>
        </div>
      </li>

      <li v-if="showExtensionsSection" class="sidebar-rail-group pt-3">
        <RouterLink
          to="/extensions/writing"
          class="sidebar-rail-button"
          :class="
            isActive('/extensions', false)
              ? 'text-white'
              : 'text-gray-400 hover:bg-accent-500/10 hover:text-white'
          "
          aria-label="Extensions"
        >
          <span
            v-if="isActive('/extensions', false)"
            class="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-white"
          ></span>
          <Puzzle class="h-4 w-4" />
        </RouterLink>

        <div class="sidebar-rail-flyout">
          <div class="border-b border-gray-800 px-3 py-2">
            <div class="flex items-center gap-2">
              <Puzzle class="h-4 w-4 text-gray-400" />
              <span class="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                Extensions
              </span>
            </div>
          </div>

          <div class="p-2">
            <RouterLink
              v-for="item in extensionCategories"
              :key="item.name"
              :to="item.route"
              class="sidebar-flyout-link"
              :class="
                isActive(item.route)
                  ? 'bg-[#1f1f1f] text-white'
                  : 'text-gray-400 hover:bg-accent-500/10 hover:text-white'
              "
            >
              <component :is="item.icon" class="h-3.5 w-3.5 shrink-0" />
              <span class="min-w-0 flex-1 truncate">{{ item.name }}</span>
              <span
                class="ml-auto shrink-0 rounded px-1.5 text-[10px] font-semibold text-gray-600"
              >
                {{ getItemCount(item.route) }}
              </span>
            </RouterLink>
          </div>
        </div>
      </li>

      <li v-if="showSkillsSection" class="sidebar-rail-group pt-3">
        <RouterLink
          to="/skills/skills"
          class="sidebar-rail-button"
          :class="
            isActive('/skills', false)
              ? 'text-white'
              : 'text-gray-400 hover:bg-accent-500/10 hover:text-white'
          "
          aria-label="Skills"
        >
          <span
            v-if="isActive('/skills', false)"
            class="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-white"
          ></span>
          <Sparkles class="h-4 w-4" />
        </RouterLink>

        <div class="sidebar-rail-flyout">
          <div class="border-b border-gray-800 px-3 py-2">
            <div class="flex items-center gap-2">
              <Sparkles class="h-4 w-4 text-gray-400" />
              <span class="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                Skills
              </span>
              <span class="rounded px-1.5 text-[10px] font-semibold text-gray-500">
                {{ totalSkillCount }}
              </span>
            </div>
          </div>

          <div class="p-2">
            <RouterLink
              v-for="item in skillsNav"
              :key="item.name"
              :to="item.route"
              class="sidebar-flyout-link"
              :class="
                isActive(item.route)
                  ? 'bg-[#1f1f1f] text-white'
                  : 'text-gray-400 hover:bg-accent-500/10 hover:text-white'
              "
            >
              <component :is="item.icon" class="h-3.5 w-3.5 shrink-0" />
              <span class="min-w-0 flex-1 truncate">{{ item.name }}</span>
              <span
                class="ml-auto shrink-0 rounded px-1.5 text-[10px] font-semibold text-gray-600"
              >
                {{ getItemCount(item.route) }}
              </span>
            </RouterLink>
          </div>
        </div>
      </li>
    </ul>
  </nav>
</template>
