<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthCredentialsForm from '@/components/auth/AuthCredentialsForm.vue'
import AuthFeatureRail from '@/components/auth/AuthFeatureRail.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import type { AuthCredentials, AuthMode, AuthProvider } from '@/types/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()
const notice = shallowRef<string | null>(null)

const mode = computed<AuthMode>(() => (route.meta.authMode === 'signup' ? 'signup' : 'login'))
const callbackError = computed(() =>
  typeof route.query.authError === 'string' ? route.query.authError : null,
)
const formError = computed(() => callbackError.value || auth.actionError)

watch(
  mode,
  () => {
    notice.value = null
    auth.clearError()
  },
  { immediate: true },
)

function getRedirectTarget() {
  const redirect = route.query.redirect

  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect
  }

  return '/account'
}

async function handleSubmit(credentials: AuthCredentials) {
  const result =
    mode.value === 'signup' ? await auth.signUp(credentials) : await auth.signIn(credentials)

  if (!result.ok) {
    notice.value = null
    return
  }

  if (result.needsEmailConfirmation) {
    notice.value = result.message ?? 'Check your email to confirm your account.'
    return
  }

  toast.success(`Welcome, ${auth.displayName}.`, 'Your Holy Grail account is ready.')
  await router.push(getRedirectTarget())
}

async function handlePasswordReset(email: string) {
  const result = await auth.sendPasswordReset(email)

  if (result.ok) {
    notice.value = result.message ?? 'Password reset email sent.'
  }
}

async function handleOAuth(provider: AuthProvider) {
  const result = await auth.signInWithOAuth(provider, getRedirectTarget())

  if (!result.ok) {
    notice.value = null
    return
  }

  notice.value = result.message ?? 'Redirecting...'
}
</script>

<template>
  <div class="min-h-full bg-black text-white">
    <div
      class="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
    >
      <RouterLink
        to="/sites/platforms"
        class="inline-flex w-fit items-center gap-2 text-sm font-bold uppercase tracking-normal text-white"
      >
        <span
          class="flex h-7 w-7 items-center justify-center border border-zinc-700 bg-zinc-950 text-accent-300"
        >
          HG
        </span>
        Holy Grail
      </RouterLink>

      <div class="grid flex-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <AuthFeatureRail :mode="mode" />

        <div class="flex min-h-[620px] items-center">
          <AuthCredentialsForm
            class="w-full"
            :disabled="!auth.isConfigured"
            :error="formError"
            :loading="auth.loading"
            :mode="mode"
            :notice="notice"
            @oauth="handleOAuth"
            @request-password-reset="handlePasswordReset"
            @submit="handleSubmit"
          />
        </div>
      </div>
    </div>
  </div>
</template>
