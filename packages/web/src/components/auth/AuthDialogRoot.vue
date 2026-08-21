<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthDialog from '@/components/auth/AuthDialog.vue'
import { useAuthDialog } from '@/composables/useAuthDialog'
import { useAuthStore } from '@/stores/auth'
import { trackSignup } from '@/lib/analytics'
import { useToastStore } from '@/stores/toast'
import type { AuthCredentials, AuthMode, AuthProvider } from '@/types/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()
const { authDialogState, closeAuthDialog, openAuthDialog } = useAuthDialog()

const isAuthRoute = computed(() => route.name === 'login' || route.name === 'signup')

const shouldShowDialog = computed(() => authDialogState.value.isOpen || isAuthRoute.value)

const authMode = computed<AuthMode | 'reset'>(() => {
  if (authDialogState.value.isOpen) {
    return authDialogState.value.mode
  }
  if (route.name === 'signup') return 'signup'
  return 'login'
})

const isDirectOpen = computed(() => authDialogState.value.isOpen && !isAuthRoute.value)

const formError = computed(() => {
  if (authDialogState.value.isOpen) return null
  if (typeof route.query.authError === 'string') return route.query.authError
  return auth.actionError
})

function handleClose() {
  if (isDirectOpen.value) {
    closeAuthDialog()
  } else if (isAuthRoute.value) {
    // Always navigate to home when closing from an auth route.
    // Using router.back() is unsafe post-logout: the previous history entry
    // is often a protected route (e.g. /account) which the navigation guard
    // immediately redirects back to /login, creating an inescapable loop.
    router.push('/')
  }
}

function handleSwitchMode(mode: AuthMode) {
  if (authDialogState.value.isOpen) {
    openAuthDialog(mode)
  } else {
    const routeName = mode === 'signup' ? 'signup' : 'login'
    router.push({ name: routeName, query: route.query })
  }
}

async function handleSubmit(credentials: AuthCredentials) {
  const result =
    authMode.value === 'signup' ? await auth.signUp(credentials) : await auth.signIn(credentials)

  if (!result.ok) return

  if (result.needsEmailConfirmation) {
    // Keep dialog open with confirmation notice
    return
  }

  if (authMode.value === 'signup') {
    trackSignup()
  }

  toast.success(`Welcome, ${auth.displayName}.`, 'Your Holy Grail account is ready.')
  handleClose()
}

async function handleOAuth(provider: AuthProvider) {
  await auth.signInWithOAuth(provider, getRedirectTarget())
}

async function handlePasswordReset(email: string) {
  await auth.sendPasswordReset(email)
}

function getRedirectTarget() {
  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect
  }
  return '/account'
}
</script>

<template>
  <AuthDialog
    v-if="shouldShowDialog"
    :disabled="!auth.isConfigured"
    :error="formError"
    :loading="auth.loading"
    :mode="authMode"
    :notice="null"
    @close="handleClose"
    @submit="handleSubmit"
    @oauth="handleOAuth"
    @request-password-reset="handlePasswordReset"
    @switch-mode="handleSwitchMode"
  />
</template>
