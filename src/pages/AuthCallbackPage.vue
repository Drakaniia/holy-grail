<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()
const statusMessage = shallowRef('Completing sign in...')
const statusDetail = shallowRef('Keep this tab open while Holy Grail finishes the secure callback.')
const isTakingLong = shallowRef(false)
const CALLBACK_SLOW_MS = 7000
const CALLBACK_TIMEOUT_MS = 22000
let slowTimer: ReturnType<typeof window.setTimeout> | null = null
let timeoutTimer: ReturnType<typeof window.setTimeout> | null = null

function getSafeQueryNextPath() {
  const next = route.query.next

  if (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')) {
    return next
  }

  return null
}

type OAuthCompletion = Awaited<ReturnType<typeof auth.completeOAuthRedirect>>

function clearTimers() {
  if (slowTimer) {
    window.clearTimeout(slowTimer)
    slowTimer = null
  }

  if (timeoutTimer) {
    window.clearTimeout(timeoutTimer)
    timeoutTimer = null
  }
}

function completeWithTimeout(): Promise<OAuthCompletion> {
  return new Promise((resolve) => {
    let settled = false

    slowTimer = window.setTimeout(() => {
      if (settled) {
        return
      }

      isTakingLong.value = true
      statusMessage.value = 'Still completing sign in...'
      statusDetail.value = 'Mobile browsers can pause the provider handoff. This will stop waiting if it cannot finish.'
    }, CALLBACK_SLOW_MS)

    timeoutTimer = window.setTimeout(() => {
      if (settled) {
        return
      }

      settled = true
      clearTimers()
      resolve({
        handled: true,
        ok: false,
        message: 'Sign in took too long on this device. Please try again from the same browser tab.',
      })
    }, CALLBACK_TIMEOUT_MS)

    void auth
      .completeOAuthRedirect()
      .then((result) => {
        if (settled) {
          return
        }

        settled = true
        clearTimers()
        resolve(result)
      })
      .catch((error: unknown) => {
        if (settled) {
          return
        }

        settled = true
        clearTimers()
        resolve({
          handled: true,
          ok: false,
          message: error instanceof Error ? error.message : 'Sign in could not be completed.',
        })
      })
      .finally(clearTimers)
  })
}

onMounted(async () => {
  const result = await completeWithTimeout()

  if (!result.handled) {
    await auth.initialize()
  }

  if (result.ok && auth.isAuthenticated) {
    statusMessage.value = 'Opening your account...'
    statusDetail.value = 'Signed in successfully.'
    toast.success(`Welcome, ${auth.displayName}.`, `Signed in with ${auth.providerLabel}.`)
    await router.replace(getSafeQueryNextPath() ?? auth.consumeStoredOAuthRedirectPath())
    return
  }

  statusMessage.value = result.message ?? 'Sign in could not be completed.'
  statusDetail.value = 'Returning you to the sign-in screen.'
  await router.replace({ name: 'login', query: { authError: statusMessage.value } })
})

onBeforeUnmount(clearTimers)
</script>

<template>
  <div class="auth-callback-shell flex min-h-screen items-center justify-center bg-[#1f1f1f] px-4 text-white">
    <div
      class="auth-callback-card flex max-w-sm items-start gap-3 border border-zinc-800 bg-[#1f1f1f] px-5 py-4 text-sm text-zinc-300"
    >
      <Loader2 class="auth-callback-spinner h-4 w-4 animate-spin text-accent-300" />
      <div class="min-w-0">
        <p class="auth-callback-title font-semibold text-white">{{ statusMessage }}</p>
        <p
          class="auth-callback-detail mt-1 leading-5 text-zinc-500"
          :class="isTakingLong ? 'text-accent-200' : ''"
        >
          {{ statusDetail }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
:global(html.light .auth-callback-shell) {
  background:
    radial-gradient(circle at top left, rgba(255, 140, 26, 0.13), transparent 34rem),
    var(--mocha-bg) !important;
  color: var(--mocha-text) !important;
}

:global(html.light .auth-callback-card) {
  border-color: var(--mocha-border) !important;
  background: var(--mocha-surface) !important;
  color: var(--mocha-text-soft) !important;
  box-shadow: 0 28px 70px rgba(86, 64, 45, 0.16) !important;
}

:global(html.light .auth-callback-title) {
  color: var(--mocha-text) !important;
}

:global(html.light .auth-callback-detail) {
  color: var(--mocha-muted) !important;
}

:global(html.light .auth-callback-spinner) {
  color: #cc6100 !important;
}
</style>
