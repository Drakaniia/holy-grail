import { computed, onMounted, onUnmounted, shallowRef } from 'vue'
import { scheduleIdleTask } from '@/lib/idle'
import type { useAuthStore } from '@/stores/auth'

type AuthStore = ReturnType<typeof useAuthStore>

const LOAD_DELAY_MS = 3500
const LOAD_TIMEOUT_MS = 7000

export function useDeferredAuthStatus() {
  const auth = shallowRef<AuthStore | null>(null)
  let cancelScheduledLoad: (() => void) | undefined
  let disposed = false
  let loadPromise: Promise<AuthStore | null> | null = null

  async function loadAuth() {
    if (auth.value) return auth.value
    if (loadPromise) return loadPromise

    loadPromise = (async () => {
      const { useAuthStore } = await import('@/stores/auth')

      if (disposed) {
        return null
      }

      const store = useAuthStore()
      auth.value = store
      await store.initialize()

      return store
    })().finally(() => {
      loadPromise = null
    })

    return loadPromise
  }

  onMounted(() => {
    cancelScheduledLoad = scheduleIdleTask(
      () => {
        void loadAuth()
      },
      {
        delay: LOAD_DELAY_MS,
        timeout: LOAD_TIMEOUT_MS,
      },
    )
  })

  onUnmounted(() => {
    disposed = true
    cancelScheduledLoad?.()
  })

  return {
    auth,
    isAuthenticated: computed(() => auth.value?.isAuthenticated ?? false),
  }
}
