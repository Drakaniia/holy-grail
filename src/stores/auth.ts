import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import type { Session, User } from '@supabase/supabase-js'
import { hasSupabaseConfig, supabase } from '@/lib/supabase'
import type { AuthCredentials, AuthProvider } from '@/types/auth'

interface AuthActionResult {
  ok: boolean
  message?: string
  needsEmailConfirmation?: boolean
}

const AUTH_CONFIG_ERROR =
  'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.'
const EMAIL_RATE_LIMIT_ERROR =
  'Supabase email sending is rate limited for this project. Wait about an hour before trying again, or configure custom SMTP in Supabase Auth.'

function getProviderLabel(provider: AuthProvider) {
  return provider === 'github' ? 'GitHub' : 'Google'
}

function getAuthErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return undefined
  }

  const code = (error as { code?: unknown }).code
  return typeof code === 'string' ? code : undefined
}

function getAuthErrorMessage(error: unknown): string {
  const code = getAuthErrorCode(error)
  if (code === 'over_email_send_rate_limit') {
    return EMAIL_RATE_LIMIT_ERROR
  }

  if (error instanceof Error && error.message) {
    if (/email rate limit exceeded/i.test(error.message)) {
      return EMAIL_RATE_LIMIT_ERROR
    }

    return error.message
  }

  return 'Authentication request failed.'
}

function getOAuthErrorMessage(error: unknown, provider: AuthProvider): string {
  const message = getAuthErrorMessage(error)

  if (/provider|oauth|external/i.test(message) && /disabled|enable|unsupported|not found/i.test(message)) {
    const label = getProviderLabel(provider)
    return `${label} sign-in is not enabled in Supabase Auth. Enable the ${label} provider and add its OAuth client credentials in the Supabase dashboard.`
  }

  return message
}

function getRedirectUrl(path = '/account') {
  if (typeof window === 'undefined') {
    return path
  }

  return `${window.location.origin}${path}`
}

function getMetadataValue(metadata: Record<string, unknown> | undefined, keys: string[]) {
  if (!metadata) {
    return null
  }

  for (const key of keys) {
    const value = metadata[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function getIdentityMetadata(user: User | null) {
  return (
    user?.identities
      ?.map(identity => identity.identity_data)
      .filter((metadata): metadata is Record<string, unknown> => Boolean(metadata)) ?? []
  )
}

function getUserMetadataValue(user: User | null, keys: string[]) {
  const metadataValue = getMetadataValue(user?.user_metadata, keys)
  if (metadataValue) {
    return metadataValue
  }

  for (const metadata of getIdentityMetadata(user)) {
    const identityValue = getMetadataValue(metadata, keys)
    if (identityValue) {
      return identityValue
    }
  }

  return null
}

async function getOAuthPreflightError(url: string, provider: AuthProvider): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const response = await fetch(url, { redirect: 'manual' })

    if (response.status >= 300 && response.status < 400) {
      return null
    }

    if (response.type === 'opaqueredirect') {
      return null
    }

    if (response.ok) {
      return null
    }

    const text = await response.text()
    const message = text
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (/unsupported provider|provider is not enabled/i.test(message)) {
      return getOAuthErrorMessage(new Error('provider is not enabled'), provider)
    }

    return message || `${getProviderLabel(provider)} sign-in is not available right now.`
  } catch {
    return null
  }
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
    const metadataName = getUserMetadataValue(user.value, ['full_name', 'name', 'user_name'])
    if (metadataName) {
      return metadataName
    }

    return user.value?.email?.split('@')[0] ?? 'Member'
  })

  const avatarUrl = computed(() =>
    getUserMetadataValue(user.value, ['avatar_url', 'picture', 'image', 'profile_image_url'])
  )
  const avatarInitial = computed(() => displayName.value.slice(0, 1).toUpperCase())
  const providerLabel = computed(() => {
    const providerValue = user.value?.app_metadata?.provider
    if (providerValue === 'github') {
      return 'GitHub'
    }

    if (providerValue === 'google') {
      return 'Google'
    }

    const providers = user.value?.app_metadata?.providers
    if (Array.isArray(providers)) {
      if (providers.includes('github')) {
        return 'GitHub'
      }

      if (providers.includes('google')) {
        return 'Google'
      }
    }

    return 'Email'
  })

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

  async function signInWithOAuth(
    provider: AuthProvider,
    redirectPath = '/account'
  ): Promise<AuthActionResult> {
    if (!supabase) {
      actionError.value = AUTH_CONFIG_ERROR
      return { ok: false, message: AUTH_CONFIG_ERROR }
    }

    loading.value = true
    actionError.value = null

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getRedirectUrl(redirectPath),
          skipBrowserRedirect: true,
        },
      })

      if (error) {
        throw error
      }

      if (!data.url) {
        throw new Error(`${getProviderLabel(provider)} sign-in could not start.`)
      }

      const preflightError = await getOAuthPreflightError(data.url, provider)
      if (preflightError) {
        throw new Error(preflightError)
      }

      window.location.assign(data.url)

      return { ok: true, message: `Redirecting to ${getProviderLabel(provider)}...` }
    } catch (error) {
      const message = getOAuthErrorMessage(error, provider)
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
    avatarUrl,
    clearError,
    displayName,
    initialize,
    initialized,
    initializing,
    isAuthenticated,
    isConfigured,
    loading,
    providerLabel,
    sendPasswordReset,
    session,
    signIn,
    signInWithOAuth,
    signOut,
    signUp,
    user,
  }
})
