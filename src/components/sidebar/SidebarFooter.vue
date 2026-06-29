<script setup lang="ts">
import { Home, Send, ShieldCheck } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

defineProps<{
  collapsed: boolean
  isActive: (path: string, exact?: boolean) => boolean
  isAdmin: boolean
  pendingAdminCount: number
}>()
</script>

<style scoped>
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

@media (prefers-reduced-motion: reduce) {
  .sidebar-rail-button,
  .sidebar-rail-tooltip {
    transition: none;
  }
}
</style>

<template>
  <!-- Collapsed footer -->
  <div v-if="collapsed" class="shrink-0 space-y-1 border-t border-gray-800 p-2">
    <RouterLink
      to="/"
      class="sidebar-rail-button"
      :class="
        isActive('/') ? 'text-white' : 'text-gray-400 hover:bg-accent-500/10 hover:text-white'
      "
      aria-label="Home"
    >
      <span
        v-if="isActive('/')"
        class="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-white"
      ></span>
      <Home class="h-4 w-4" />
      <span class="sidebar-rail-tooltip">Home</span>
    </RouterLink>

    <RouterLink
      to="/publish"
      class="sidebar-rail-button"
      :class="
        isActive('/publish') || isActive('/submit')
          ? 'text-white'
          : 'text-gray-400 hover:bg-accent-500/10 hover:text-white'
      "
      aria-label="Publish"
    >
      <span
        v-if="isActive('/publish') || isActive('/submit')"
        class="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-white"
      ></span>
      <Send class="h-4 w-4" />
      <span class="sidebar-rail-tooltip">Publish</span>
    </RouterLink>

    <RouterLink
      v-if="isAdmin"
      to="/admin"
      class="sidebar-rail-button"
      :class="
        isActive('/admin')
          ? 'text-white'
          : 'text-gray-400 hover:bg-accent-500/10 hover:text-white'
      "
      aria-label="Admin"
    >
      <span
        v-if="isActive('/admin')"
        class="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-white"
      ></span>
      <ShieldCheck class="h-4 w-4" />
      <span
        v-if="pendingAdminCount > 0"
        class="absolute -right-0.5 -top-0.5 h-4 min-w-[1rem] rounded-full bg-amber-500 px-1 text-center text-[9px] font-bold leading-4 text-[#1f1f1f]"
      >
        {{ pendingAdminCount }}
      </span>
      <span class="sidebar-rail-tooltip">Admin</span>
    </RouterLink>
  </div>

  <!-- Expanded footer -->
  <div v-else class="shrink-0 space-y-1 border-t border-gray-800 p-4">
    <RouterLink
      to="/"
      class="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-gray-400 transition-colors hover:bg-accent-500/10 hover:text-white"
      :class="isActive('/') ? 'bg-[#1f1f1f] text-white' : ''"
    >
      <Home
        class="h-4 w-4 transition-colors"
        :class="isActive('/') ? 'text-accent-400' : 'text-gray-500 group-hover:text-accent-400'"
      />
      <span class="text-xs font-medium">Home</span>
    </RouterLink>

    <RouterLink
      to="/publish"
      class="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-gray-400 transition-colors hover:bg-accent-500/10 hover:text-white"
      :class="isActive('/publish') || isActive('/submit') ? 'bg-[#1f1f1f] text-white' : ''"
    >
      <Send
        class="h-4 w-4 transition-colors"
        :class="
          isActive('/publish') || isActive('/submit')
            ? 'text-accent-400'
            : 'text-gray-500 group-hover:text-accent-400'
        "
      />
      <span class="text-xs font-medium">Publish</span>
    </RouterLink>

    <RouterLink
      v-if="isAdmin"
      to="/admin"
      class="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white transition-colors group rounded-md hover:bg-accent-500/10"
      :class="isActive('/admin') ? 'bg-[#1f1f1f] text-white' : ''"
    >
      <ShieldCheck class="w-4 h-4" />
      <span class="font-medium text-xs">Admin</span>
      <span
        v-if="pendingAdminCount > 0"
        class="ml-auto rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-[#1f1f1f]"
      >
        {{ pendingAdminCount }}
      </span>
    </RouterLink>
  </div>
</template>
