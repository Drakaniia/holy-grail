<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppToast from './components/AppToast.vue'
import AuthDialogRoot from './components/auth/AuthDialogRoot.vue'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import MobileCategoryChips from './components/mobile/MobileCategoryChips.vue'
import MobileTabBar from './components/mobile/MobileTabBar.vue'
import { useAutoAuthPrompt } from '@/composables/useAutoAuthPrompt'
import { useDeferredAuthStatus } from '@/composables/useDeferredAuthStatus'

const CommandPalette = defineAsyncComponent(() => import('./components/search/CommandPalette.vue'))
const Sidebar = defineAsyncComponent(() => import('./components/Sidebar.vue'))

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'holy-grail-sidebar-collapsed'
const SIDEBAR_WIDTH_STORAGE_KEY = 'holy-grail-sidebar-width'
const SIDEBAR_DEFAULT_WIDTH_PX = 240
const SIDEBAR_MIN_WIDTH_PX = 200
/** The column may never eat into this much of the content area. */
const SIDEBAR_CONTENT_GUTTER_PX = 360

const route = useRoute()
const { isAuthenticated } = useDeferredAuthStatus()
useAutoAuthPrompt({ isAuthenticated })

const isAuthRoute = computed(() => route.name === 'login' || route.name === 'signup')
const isAuthCallbackRoute = computed(() => route.name === 'auth-callback')
const isStandaloneRoute = computed(
  () => route.name === 'docs' || route.name === 'changelog' || route.name === 'not-found',
)
const shouldRenderAppShell = computed(
  () => !isAuthCallbackRoute.value && !isStandaloneRoute.value && route.matched.length > 0,
)

const isSidebarCollapsed = shallowRef(getStoredSidebarCollapsed())
const sidebarWidth = shallowRef(getStoredSidebarWidth())
const isResizingSidebar = shallowRef(false)
const isMobileSidebarOpen = shallowRef(false)
const isCommandPaletteOpen = shallowRef(false)
const isCommandPaletteInstant = shallowRef(false)

let resizeStartX = 0
let resizeStartWidth = 0

function getStoredSidebarCollapsed() {
  if (typeof window === 'undefined') return false

  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function getStoredSidebarWidth() {
  if (typeof window === 'undefined') return SIDEBAR_DEFAULT_WIDTH_PX

  try {
    const stored = Number(window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY))
    return Number.isFinite(stored) && stored > 0 ? stored : SIDEBAR_DEFAULT_WIDTH_PX
  } catch {
    return SIDEBAR_DEFAULT_WIDTH_PX
  }
}

function persistSidebarCollapsed(collapsed: boolean) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed))
  } catch {}
}

function persistSidebarWidth(width: number) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(Math.round(width)))
  } catch {}
}

function getMaxSidebarWidth() {
  if (typeof window === 'undefined') return SIDEBAR_DEFAULT_WIDTH_PX

  return Math.max(SIDEBAR_MIN_WIDTH_PX, window.innerWidth - SIDEBAR_CONTENT_GUTTER_PX)
}

function setSidebarCollapsed(collapsed: boolean) {
  isSidebarCollapsed.value = collapsed
}

function toggleSidebar() {
  setSidebarCollapsed(!isSidebarCollapsed.value)
}

/** The only way back in when the column is retracted: a 16px invisible strip on the left edge. */
function revealSidebarFromEdge() {
  if (!isSidebarCollapsed.value) return

  setSidebarCollapsed(false)
}

function startSidebarResize(event: PointerEvent) {
  if (event.button !== 0) return

  event.preventDefault()
  resizeStartX = event.clientX
  resizeStartWidth = sidebarWidth.value
  isResizingSidebar.value = true

  window.addEventListener('pointermove', handleSidebarResize)
  window.addEventListener('pointerup', endSidebarResize, { once: true })
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function handleSidebarResize(event: PointerEvent) {
  const next = resizeStartWidth + (event.clientX - resizeStartX)
  sidebarWidth.value = Math.min(
    getMaxSidebarWidth(),
    Math.max(SIDEBAR_MIN_WIDTH_PX, Math.round(next)),
  )
}

function endSidebarResize() {
  if (!isResizingSidebar.value) return

  isResizingSidebar.value = false
  window.removeEventListener('pointermove', handleSidebarResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  persistSidebarWidth(sidebarWidth.value)
}

function resetSidebarWidth() {
  sidebarWidth.value = SIDEBAR_DEFAULT_WIDTH_PX
  persistSidebarWidth(SIDEBAR_DEFAULT_WIDTH_PX)
}

function closeMobileSidebar() {
  isMobileSidebarOpen.value = false
}

function toggleMobileSidebar() {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value
}

function openCommandPalette(instant = false) {
  if (!shouldRenderAppShell.value) return

  isCommandPaletteInstant.value = instant
  isCommandPaletteOpen.value = true
}

function handleGlobalShortcut(event: KeyboardEvent) {
  const key = event.key.toLowerCase()

  if (!(event.ctrlKey || event.metaKey) || event.altKey) return

  if (key === 'k') {
    event.preventDefault()
    // Keyboard-initiated opens skip the transition entirely — this path runs hundreds of times a day.
    openCommandPalette(true)
    return
  }

  if (key === 'b' && shouldRenderAppShell.value) {
    event.preventDefault()
    // Below md there is no docked column, so the same chord drives the drawer instead of doing nothing.
    if (window.matchMedia('(min-width: 768px)').matches) {
      toggleSidebar()
    } else {
      toggleMobileSidebar()
    }
  }
}

/**
 * The column hands its space back through `margin-left`, not `width`: a shrinking width re-wraps
 * every label and the pinned promo card on each frame, so the collapse reads as a jolt. Holding the
 * width and sliding the whole box out keeps that text laid out exactly once.
 */
const sidebarShellStyle = computed(() => ({
  width: `${sidebarWidth.value}px`,
  marginLeft: isSidebarCollapsed.value ? `-${sidebarWidth.value}px` : '0px',
  opacity: isSidebarCollapsed.value ? '0' : '1',
}))

watch(isSidebarCollapsed, (collapsed) => {
  persistSidebarCollapsed(collapsed)
})

watch(
  () => route.fullPath,
  () => {
    closeMobileSidebar()
    isCommandPaletteOpen.value = false
  },
)

onMounted(() => {
  window.addEventListener('keydown', handleGlobalShortcut)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalShortcut)
  window.removeEventListener('pointermove', handleSidebarResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
})
</script>

<template>
  <RouterView v-if="isAuthCallbackRoute || isStandaloneRoute" />

  <div
    v-else-if="shouldRenderAppShell || isAuthRoute"
    class="flex h-[100dvh] overflow-hidden bg-[#1f1f1f] text-white"
  >
    <!-- Left-edge reveal zone: the column is gone, this strip is how it comes back. -->
    <div
      v-if="isSidebarCollapsed"
      class="fixed top-0 left-0 z-50 hidden h-full w-4 md:block"
      aria-hidden="true"
      @pointerenter="revealSidebarFromEdge"
    ></div>

    <aside
      class="desktop-sidebar-shell relative z-[70] hidden h-full min-w-0 shrink-0 md:block"
      :class="{
        'desktop-sidebar-shell--collapsed': isSidebarCollapsed,
        'pointer-events-none': isSidebarCollapsed,
      }"
      :style="sidebarShellStyle"
      aria-label="Main navigation"
    >
      <Sidebar :collapsed="isSidebarCollapsed" @collapse="setSidebarCollapsed(true)" />

      <!-- Resize: an 8px hit area plus a 4px grip, both col-resize; double-click resets. -->
      <div
        class="absolute inset-y-0 right-0 z-10 hidden w-2 cursor-col-resize md:block"
        aria-hidden="true"
        @pointerdown="startSidebarResize"
      ></div>
      <div
        class="absolute inset-y-0 right-0 z-10 hidden w-1 cursor-col-resize transition-colors md:block"
        :class="
          isResizingSidebar
            ? 'bg-accent-500/40'
            : 'bg-transparent hover:bg-sidebar-border active:bg-accent-500/40'
        "
        title="Drag to resize · double-click to reset"
        aria-hidden="true"
        @pointerdown="startSidebarResize"
        @dblclick="resetSidebarWidth"
      ></div>
    </aside>

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
          <Sidebar :collapsible="false" />
        </div>
      </div>
    </Transition>

    <div
      class="flex min-w-0 flex-1 flex-col overflow-hidden pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0"
    >
      <Navbar :mobile-menu-open="isMobileSidebarOpen" @toggle-mobile-menu="toggleMobileSidebar" />
      <MobileCategoryChips />
      <main class="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div class="flex min-h-full min-w-0 flex-col">
          <div class="min-w-0 flex-1">
            <RouterView />
          </div>
          <Footer />
        </div>
      </main>
    </div>

    <MobileTabBar @open-search="openCommandPalette" />

    <CommandPalette
      v-if="isCommandPaletteOpen"
      v-model:open="isCommandPaletteOpen"
      :instant="isCommandPaletteInstant"
    />
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
  max-width: calc(100% - 360px);
  overflow: hidden;
  /* Explicit properties only: `transition: all` would animate max-width and the hairline border. */
  transition:
    margin-left 200ms cubic-bezier(0.4, 0, 0.2, 1),
    opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  .desktop-sidebar-shell {
    transition: none;
  }

  /* The mobile drawer fades in place instead of sliding across the viewport. */
  .mobile-sidebar-enter-active,
  .mobile-sidebar-leave-active,
  .mobile-sidebar-enter-active > div,
  .mobile-sidebar-leave-active > div {
    transition: opacity 160ms ease;
  }

  .mobile-sidebar-enter-from > div,
  .mobile-sidebar-leave-to > div {
    transform: none;
  }
}
</style>
