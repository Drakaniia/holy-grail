import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { hasSupabaseConfig, supabase } from '@/lib/supabase'
import type { AuthCredentials } from '@/types/auth'

interface AuthActionResult {
  ok: boolean
  message?: string
  needsEmailConfirmation?: boolean
}

const AUTH_CONFIG_ERROR =
  'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.'

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Authentication request failed.'
}

function getRedirectUrl(path = '/account') {
  if (typeof window === 'undefined') {
    return path
  }

  return `${window.location.origin}${path}`
}

export const useAuthStore = defineStore('auth', () => {
  const session = shallowRef<Session | null>(null)
  const loading = shallowRef(false)
  const initializing = shallowRef(false)
  const initialized = shallowRef(false)
  const actionError = shallowRef<string | null>(null)

  const user = computed(() => session.value?.user ?? null)
  const isAuthenticated = computed(() => Boolean(user.value))
  const isConfigured = computed(() => hasSupabaseConfig)

  const displayName = computed(() => {
    const metadataName = user.value?.user_metadata?.full_name
    if (typeof metadataName === 'string' && metadataName.trim()) {
      return metadataName.trim()
    }

    return user.value?.email?.split('@')[0] ?? 'Member'
  })

  const avatarInitial = computed(() => displayName.value.slice(0, 1).toUpperCase())

  async function initialize() {
    if (initialized.value || initializing.value) {
      return
    }

    initializing.value = true

    if (!supabase) {
      initialized.value = true
      initializing.value = false
      return
    }

    const { data, error } = await supabase.auth.getSession()

    if (error) {
      actionError.value = error.message
    }

    session.value = data.session

    supabase.auth.onAuthStateChange((_event, nextSession) => {
      session.value = nextSession
    })

    initialized.value = true
    initializing.value = false
  }

  async function signIn(credentials: AuthCredentials): Promise<AuthActionResult> {
    if (!supabase) {
      actionError.value = AUTH_CONFIG_ERROR
      return { ok: false, message: AUTH_CONFIG_ERROR }
    }

    loading.value = true
    actionError.value = null

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        throw error
      }

      session.value = data.session
      return { ok: true }
    } catch (error) {
      const message = getAuthErrorMessage(error)
      actionError.value = message
      return { ok: false, message }
    } finally {
      loading.value = false
    }
  }

  async function signUp(credentials: AuthCredentials): Promise<AuthActionResult> {
    if (!supabase) {
      actionError.value = AUTH_CONFIG_ERROR
      return { ok: false, message: AUTH_CONFIG_ERROR }
    }

    loading.value = true
    actionError.value = null

    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName?.trim() || credentials.email.split('@')[0],
          },
          emailRedirectTo: getRedirectUrl('/account'),
        },
      })

      if (error) {
        throw error
      }

      session.value = data.session

      return {
        ok: true,
        needsEmailConfirmation: !data.session,
        message: data.session
          ? 'Account created. You are signed in.'
          : 'Check your email to confirm your account.',
      }
    } catch (error) {
      const message = getAuthErrorMessage(error)
      actionError.value = message
      return { ok: false, message }
    } finally {
      loading.value = false
    }
  }

  async function sendPasswordReset(email: string): Promise<AuthActionResult> {
    if (!supabase) {
      actionError.value = AUTH_CONFIG_ERROR
      return { ok: false, message: AUTH_CONFIG_ERROR }
    }

    loading.value = true
    actionError.value = null

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getRedirectUrl('/login'),
      })

      if (error) {
        throw error
      }

      return { ok: true, message: 'Password reset email sent.' }
    } catch (error) {
      const message = getAuthErrorMessage(error)
      actionError.value = message
      return { ok: false, message }
    } finally {
      loading.value = false
    }
  }

  async function signOut(): Promise<AuthActionResult> {
    if (!supabase) {
      session.value = null
      return { ok: true }
    }

    loading.value = true
    actionError.value = null

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      session.value = null
      return { ok: true }
    } catch (error) {
      const message = getAuthErrorMessage(error)
      actionError.value = message
      return { ok: false, message }
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    actionError.value = null
  }

  return {
    actionError,
    avatarInitial,
    clearError,
    displayName,
    initialize,
    initialized,
    initializing,
    isAuthenticated,
    isConfigured,
    loading,
    sendPasswordReset,
    session,
    signIn,
    signOut,
    signUp,
    user,
  }
})
