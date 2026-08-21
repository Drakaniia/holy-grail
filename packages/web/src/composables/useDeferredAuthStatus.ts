import { computed, onMounted, onUnmounted, shallowRef } from 'vue'
import { scheduleIdleTask } from '@/lib/idle'
import type { useAuthStore } from '@/stores/auth'

type AuthStore = ReturnType<typeof useAuthStore>

interface DeferredAuthStatusOptions {
  delay?: number
  immediate?: boolean
  timeout?: number
}

export function useDeferredAuthStatus(options: DeferredAuthStatusOptions = {}) {
  const auth = shallowRef<AuthStore | null>(null)
  const isLoading = shallowRef(false)
  let cancelScheduledLoad: (() => void) | undefined
  let disposed = false
  let loadPromise: Promise<AuthStore | null> | null = null

  async function loadAuth() {
    if (auth.value) return auth.value
    if (loadPromise) return loadPromise

    isLoading.value = true

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
      isLoading.value = false
      loadPromise = null
    })

    return loadPromise
  }

  onMounted(() => {
    if (options.immediate) {
      void loadAuth()
      return
    }

    cancelScheduledLoad = scheduleIdleTask(
      () => {
        void loadAuth()
      },
      {
        delay: options.delay ?? 3500,
        timeout: options.timeout ?? 7000,
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
    isLoading,
    loadAuth,
  }
}
