import { onUnmounted, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import posthog from 'posthog-js'
import { useAuthDialog } from '@/composables/useAuthDialog'
import type { Ref } from 'vue'

export interface AutoAuthPromptOptions {
  pageCountThreshold?: number
  delayMs?: number
  isAuthenticated?: Ref<boolean>
}

const AUTH_ROUTE_NAMES = new Set(['login', 'signup', 'auth-callback'])

function isAuthRouteName(name: unknown): boolean {
  return typeof name === 'string' && AUTH_ROUTE_NAMES.has(name)
}

function isAuthPath(path: string): boolean {
  return (
    path === '/login' ||
    path.startsWith('/login?') ||
    path.startsWith('/login#') ||
    path === '/signup' ||
    path.startsWith('/signup?') ||
    path.startsWith('/signup#') ||
    path === '/auth/callback' ||
    path.startsWith('/auth/callback?') ||
    path.startsWith('/auth/callback#')
  )
}

const pageVisitedCount = shallowRef(0)
const isDismissed = shallowRef(false)
const isShowing = shallowRef(false)

let timer: ReturnType<typeof setTimeout> | null = null
let autoTriggered = false
let isWatching = false

function clearTimer() {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

export function resetAutoAuthPromptForTest() {
  pageVisitedCount.value = 0
  isDismissed.value = false
  isShowing.value = false
  autoTriggered = false
  clearTimer()
  isWatching = false
}

export function useAutoAuthPrompt(options: AutoAuthPromptOptions = {}) {
  const route = useRoute()
  const { authDialogState, openAuthDialog } = useAuthDialog()
  const threshold = options.pageCountThreshold ?? 3
  const delayMs = options.delayMs ?? 5000
  const isAuthenticated = options.isAuthenticated

  function isCurrentAuthRoute(): boolean {
    if (isAuthRouteName(route.name)) return true
    if (isAuthPath(route.path) || isAuthPath(route.fullPath)) return true
    return false
  }

  function handleTrigger() {
    timer = null
    if (isDismissed.value) return
    if (isAuthenticated?.value) return
    if (autoTriggered) return
    if (authDialogState.value.isOpen) return
    // Double-check not on auth route at trigger time
    if (isCurrentAuthRoute()) return

    autoTriggered = true
    isShowing.value = true
    posthog.capture('auto_auth_modal_shown', {
      page_visited_count: pageVisitedCount.value,
      current_route: route.fullPath,
    })
    openAuthDialog('signup')
  }

  function scheduleTrigger() {
    clearTimer()
    if (isDismissed.value) return
    if (isAuthenticated?.value) return
    if (autoTriggered) return
    timer = setTimeout(handleTrigger, delayMs)
  }

  function dismiss() {
    isDismissed.value = true
    isShowing.value = false
    clearTimer()
    // Prevent future triggers even if not yet triggered
    autoTriggered = true
  }

  // Avoid setting up duplicate watchers if called multiple times (e.g. HMR)
  if (!isWatching) {
    isWatching = true

    watch(
      () => route.fullPath,
      () => {
        if (isDismissed.value) return
        if (autoTriggered) return
        if (isAuthenticated?.value) {
          clearTimer()
          return
        }
        if (isCurrentAuthRoute()) {
          clearTimer()
          return
        }
        if (pageVisitedCount.value >= threshold) return

        pageVisitedCount.value += 1

        if (pageVisitedCount.value >= threshold) {
          scheduleTrigger()
        }
      },
    )

    if (isAuthenticated) {
      watch(
        () => isAuthenticated.value,
        (authenticated) => {
          if (authenticated) {
            clearTimer()
          }
        },
      )
    }

    watch(
      () => authDialogState.value.isOpen,
      (isOpen, wasOpen) => {
        if (!isOpen && wasOpen && autoTriggered && !isDismissed.value) {
          // Auto-popup was closed -> mark dismissed so it never reappears
          isDismissed.value = true
          isShowing.value = false
          clearTimer()
        } else if (isOpen && autoTriggered) {
          isShowing.value = true
        } else if (!isOpen) {
          isShowing.value = false
        }
      },
    )
  }

  onUnmounted(() => {
    clearTimer()
  })

  return {
    pageVisitedCount,
    isDismissed,
    isShowing,
    dismiss,
  }
}
