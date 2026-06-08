<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppToast from './components/AppToast.vue'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'

const CommandPalette = defineAsyncComponent(() => import('./components/search/CommandPalette.vue'))
const Sidebar = defineAsyncComponent(() => import('./components/Sidebar.vue'))
const route = useRoute()
const isAuthRoute = computed(
  () => route.name === 'login' || route.name === 'signup' || route.name === 'auth-callback',
)
const isStandaloneRoute = computed(
  () =>
    route.name === 'home' ||
    route.name === 'docs' ||
    route.name === 'changelog' ||
    route.name === 'not-found',
)
const shouldRenderAppShell = computed(
  () => !isAuthRoute.value && !isStandaloneRoute.value && route.matched.length > 0,
)
const isMobileSidebarOpen = shallowRef(false)
const isCommandPaletteOpen = shallowRef(false)
const isDesktopShell = shallowRef(
  typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
)
let removeDesktopShellListener: (() => void) | undefined

function closeMobileSidebar() {
  isMobileSidebarOpen.value = false
}

function toggleMobileSidebar() {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value
}

function openCommandPalette() {
  if (!shouldRenderAppShell.value) return

  isCommandPaletteOpen.value = true
}

function handleGlobalShortcut(event: KeyboardEvent) {
  const key = event.key.toLowerCase()

  if ((event.ctrlKey || event.metaKey) && key === 'k') {
    event.preventDefault()
    openCommandPalette()
  }
}

watch(
  () => route.fullPath,
  () => {
    closeMobileSidebar()
    isCommandPaletteOpen.value = false
  },
)

onMounted(() => {
  window.addEventListener('keydown', handleGlobalShortcut)

  const desktopShellQuery = window.matchMedia('(min-width: 768px)')
  const updateDesktopShell = (event: MediaQueryListEvent) => {
    isDesktopShell.value = event.matches
  }

  isDesktopShell.value = desktopShellQuery.matches
  desktopShellQuery.addEventListener('change', updateDesktopShell)
  removeDesktopShellListener = () => {
    desktopShellQuery.removeEventListener('change', updateDesktopShell)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalShortcut)
  removeDesktopShellListener?.()
})
</script>

<template>
  <RouterView v-if="isAuthRoute || isStandaloneRoute" />

  <div v-else-if="shouldRenderAppShell" class="flex h-[100dvh] overflow-hidden bg-[#1f1f1f] text-white">
    <div v-if="isDesktopShell" class="hidden h-full w-64 shrink-0 md:block">
      <Sidebar />
    </div>

    <Transition name="mobile-sidebar">
      <div
        v-if="isMobileSidebarOpen"
        class="fixed inset-0 z-[70] md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
      >
        <button
          type="button"
          class="absolute inset-0 bg-[#1f1f1f]/70 backdrop-blur-sm"
          aria-label="Close navigation"
          @click="closeMobileSidebar"
        ></button>
        <div
          id="mobile-sidebar"
          class="relative h-full w-64 max-w-[calc(100vw-3rem)] shadow-2xl shadow-[#1f1f1f]/60"
        >
          <Sidebar />
        </div>
      </div>
    </Transition>

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <Navbar
        :mobile-menu-open="isMobileSidebarOpen"
        @toggle-mobile-menu="toggleMobileSidebar"
        @open-search="openCommandPalette"
      />
      <main class="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div class="flex min-h-full min-w-0 flex-col">
          <div class="min-w-0 flex-1">
            <RouterView />
          </div>
          <Footer />
        </div>
      </main>
    </div>

    <CommandPalette v-if="isCommandPaletteOpen" v-model:open="isCommandPaletteOpen" />
  </div>

  <AppToast />
</template>

<style scoped>
.mobile-sidebar-enter-active,
.mobile-sidebar-leave-active {
  transition: opacity 180ms ease;
}

.mobile-sidebar-enter-active > div,
.mobile-sidebar-leave-active > div {
  transition: transform 220ms ease;
}

.mobile-sidebar-enter-from,
.mobile-sidebar-leave-to {
  opacity: 0;
}

.mobile-sidebar-enter-from > div,
.mobile-sidebar-leave-to > div {
  transform: translateX(-100%);
}
</style>
