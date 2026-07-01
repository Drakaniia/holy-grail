<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppToast from './components/AppToast.vue'
import AuthDialogRoot from './components/auth/AuthDialogRoot.vue'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'

const CommandPalette = defineAsyncComponent(() => import('./components/search/CommandPalette.vue'))
const Sidebar = defineAsyncComponent(() => import('./components/Sidebar.vue'))
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'holy-grail-sidebar-collapsed'
const route = useRoute()
const isAuthRoute = computed(() => route.name === 'login' || route.name === 'signup')
const isAuthCallbackRoute = computed(() => route.name === 'auth-callback')
const isStandaloneRoute = computed(
  () =>
    route.name === 'home' ||
    route.name === 'docs' ||
    route.name === 'changelog' ||
    route.name === 'not-found',
)
const shouldRenderAppShell = computed(
  () => !isAuthCallbackRoute.value && !isStandaloneRoute.value && route.matched.length > 0,
)
const storedSidebarCollapsed = getStoredSidebarCollapsed()
const isSidebarCollapsed = shallowRef(storedSidebarCollapsed)
const isSidebarContentCollapsed = shallowRef(storedSidebarCollapsed)
const shouldReserveCollapsedRail = shallowRef(false)
const isMobileSidebarOpen = shallowRef(false)
const isCommandPaletteOpen = shallowRef(false)
const isDesktopShell = shallowRef(
  typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
)
const COLLAPSED_RAIL_WIDTH_PX = 72
const COLLAPSED_RAIL_COLLISION_BUFFER_PX = 4
const SIDEBAR_WIPE_DURATION_MS = 220
let removeDesktopShellListener: (() => void) | undefined
let collapsedRailReservationFrame: number | undefined
let sidebarContentCollapseTimer: number | undefined

function getStoredSidebarCollapsed() {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function persistSidebarCollapsed(collapsed: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed))
  } catch {}
}

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

function getFirstVisibleSiteCard() {
  if (typeof document === 'undefined') {
    return null
  }

  return (
    Array.from(document.querySelectorAll<HTMLElement>('.site-card')).find((card) => {
      const rect = card.getBoundingClientRect()

      return rect.width > 0 && rect.height > 0
    }) ?? null
  )
}

function updateCollapsedRailReservation() {
  if (typeof window === 'undefined' || !isDesktopShell.value || !isSidebarCollapsed.value) {
    shouldReserveCollapsedRail.value = false
    return
  }

  if (collapsedRailReservationFrame !== undefined) {
    window.cancelAnimationFrame(collapsedRailReservationFrame)
  }

  collapsedRailReservationFrame = window.requestAnimationFrame(() => {
    collapsedRailReservationFrame = undefined
    const firstVisibleCard = getFirstVisibleSiteCard()

    shouldReserveCollapsedRail.value = firstVisibleCard
      ? firstVisibleCard.getBoundingClientRect().left <
        COLLAPSED_RAIL_WIDTH_PX + COLLAPSED_RAIL_COLLISION_BUFFER_PX
      : false
  })
}

function clearCollapsedRailReservation() {
  if (typeof window !== 'undefined' && collapsedRailReservationFrame !== undefined) {
    window.cancelAnimationFrame(collapsedRailReservationFrame)
    collapsedRailReservationFrame = undefined
  }

  shouldReserveCollapsedRail.value = false
}

function clearSidebarContentCollapseTimer() {
  if (typeof window !== 'undefined' && sidebarContentCollapseTimer !== undefined) {
    window.clearTimeout(sidebarContentCollapseTimer)
    sidebarContentCollapseTimer = undefined
  }
}

function setSidebarCollapsed(collapsed: boolean) {
  clearSidebarContentCollapseTimer()

  if (collapsed) {
    isSidebarCollapsed.value = true

    if (typeof window === 'undefined') {
      isSidebarContentCollapsed.value = true
      return
    }

    sidebarContentCollapseTimer = window.setTimeout(() => {
      isSidebarContentCollapsed.value = true
      sidebarContentCollapseTimer = undefined
    }, SIDEBAR_WIPE_DURATION_MS)
    return
  }

  isSidebarContentCollapsed.value = false
  isSidebarCollapsed.value = false
  clearCollapsedRailReservation()
}

function toggleSidebarCollapsed() {
  setSidebarCollapsed(!isSidebarCollapsed.value)
}

function handleGlobalShortcut(event: KeyboardEvent) {
  const key = event.key.toLowerCase()

  if ((event.ctrlKey || event.metaKey) && key === 'k') {
    event.preventDefault()
    openCommandPalette()
  }
}

watch(isSidebarCollapsed, persistSidebarCollapsed)

watch(
  () => route.fullPath,
  () => {
    closeMobileSidebar()
    clearCollapsedRailReservation()
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
  clearCollapsedRailReservation()
  clearSidebarContentCollapseTimer()
  removeDesktopShellListener?.()
})
</script>

<template>
  <RouterView v-if="isAuthCallbackRoute || isStandaloneRoute" />

  <div
    v-else-if="shouldRenderAppShell || isAuthRoute"
    class="flex h-[100dvh] overflow-hidden bg-[#1f1f1f] text-white"
  >
    <div
      v-if="isDesktopShell"
      class="desktop-sidebar-shell group relative z-[70] hidden h-full min-w-0 shrink-0 md:block"
      :class="{
        'desktop-sidebar-shell--collapsed': isSidebarCollapsed,
        'desktop-sidebar-shell--rail-ready': isSidebarContentCollapsed,
        'desktop-sidebar-shell--reserve': shouldReserveCollapsedRail,
      }"
      aria-label="Main navigation"
      @pointerenter="updateCollapsedRailReservation"
      @pointerleave="clearCollapsedRailReservation"
      @focusin="updateCollapsedRailReservation"
      @focusout="clearCollapsedRailReservation"
    >
      <div
        v-if="isSidebarCollapsed"
        class="sidebar-edge-hitbox absolute inset-y-0 left-0 z-[72] w-3"
      ></div>
      <div
        class="desktop-sidebar-panel relative z-[80] h-full"
        :class="{ 'desktop-sidebar-panel--rail': isSidebarContentCollapsed }"
      >
        <Sidebar
          :collapsed="isSidebarContentCollapsed"
          @toggle-collapsed="toggleSidebarCollapsed"
          @open-search="openCommandPalette"
        />
      </div>
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

  <AuthDialogRoot />
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

.desktop-sidebar-shell {
  width: 16rem;
  overflow: hidden;
  transition: width 220ms ease;
}

.desktop-sidebar-shell--collapsed {
  width: 0.75rem;
}

.desktop-sidebar-panel {
  width: 16rem;
  max-width: 16rem;
}

.desktop-sidebar-panel--rail {
  width: 4.5rem;
  max-width: 4.5rem;
}

.desktop-sidebar-shell--collapsed.desktop-sidebar-shell--rail-ready .desktop-sidebar-panel {
  pointer-events: none;
  transform: translateX(calc(-100% + 0.75rem));
  transition: transform 180ms ease;
  will-change: transform;
}

.desktop-sidebar-shell--collapsed.desktop-sidebar-shell--rail-ready:hover,
.desktop-sidebar-shell--collapsed.desktop-sidebar-shell--rail-ready:has(:focus-visible) {
  overflow: visible;
}

.desktop-sidebar-shell--collapsed.desktop-sidebar-shell--rail-ready:hover .desktop-sidebar-panel,
.desktop-sidebar-shell--collapsed.desktop-sidebar-shell--rail-ready:has(:focus-visible)
  .desktop-sidebar-panel {
  animation: sidebar-rail-wipe-in 180ms ease both;
  pointer-events: auto;
  transform: translateX(0);
}

.desktop-sidebar-shell--collapsed.desktop-sidebar-shell--rail-ready.desktop-sidebar-shell--reserve:hover,
.desktop-sidebar-shell--collapsed.desktop-sidebar-shell--rail-ready.desktop-sidebar-shell--reserve:has(
    :focus-visible
  ) {
  width: 4.5rem;
}

.sidebar-edge-hitbox {
  background: transparent;
}

@keyframes sidebar-rail-wipe-in {
  from {
    transform: translateX(calc(-100% + 0.75rem));
  }

  to {
    transform: translateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .desktop-sidebar-shell,
  .desktop-sidebar-panel {
    animation: none;
    transition: none;
  }
}
</style>
