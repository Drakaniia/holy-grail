import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import type { Session, User } from '@supabase/supabase-js'
import { hasSupabaseConfig, supabase } from '@/lib/supabase'
import { getAuthRedirectOrigin } from '@/lib/publicUrl'
import { getSupabaseFunctionErrorMessage } from '@/lib/supabaseErrors'
import type { AuthCredentials, AuthProvider } from '@/types/auth'

interface AuthActionResult {
  ok: boolean
  message?: string
  needsEmailConfirmation?: boolean
}

interface OAuthRedirectResult extends AuthActionResult {
  handled: boolean
}

interface ProfileMetadataUpdates {
  avatarUrl?: string | null
  bio?: string | null
  displayName?: string
}

interface DeleteAccountResponse {
  error?: string
  ok?: boolean
}

const AUTH_CONFIG_ERROR =
  'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.'
const EMAIL_RATE_LIMIT_ERROR =
  'Supabase email sending is rate limited for this project. Wait about an hour before trying again, or configure custom SMTP in Supabase Auth.'
const OAUTH_NEXT_STORAGE_KEY = 'holy-grail-oauth-next'

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

  if (
    /provider|oauth|external/i.test(message) &&
    /disabled|enable|unsupported|not found/i.test(message)
  ) {
    const label = getProviderLabel(provider)
    return `${label} sign-in is not enabled in Supabase Auth. Enable the ${label} provider and add its OAuth client credentials in the Supabase dashboard.`
  }

  return message
}

function getRedirectPath(path: string) {
  if (!path.startsWith('/') || path.startsWith('//')) {
    return '/account'
  }

  return path
}

function getRedirectUrl(path = '/account') {
  const redirectPath = getRedirectPath(path)
  const origin = getAuthRedirectOrigin()

  if (!origin) {
    return redirectPath
  }

  return `${origin}${redirectPath}`
}

function getOAuthCallbackUrl() {
  return getRedirectUrl('/auth/callback')
}

function storeOAuthRedirectPath(path = '/account') {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.setItem(OAUTH_NEXT_STORAGE_KEY, getRedirectPath(path))
  } catch {
  }
}

function consumeStoredOAuthRedirectPath() {
  if (typeof window === 'undefined') {
    return '/account'
  }

  try {
    const storedPath = window.sessionStorage.getItem(OAUTH_NEXT_STORAGE_KEY)
    window.sessionStorage.removeItem(OAUTH_NEXT_STORAGE_KEY)

    return storedPath ? getRedirectPath(storedPath) : '/account'
  } catch {
    return '/account'
  }
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
      ?.map((identity) => identity.identity_data)
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

export const useAuthStore = defineStore('auth', () => {
  const session = shallowRef<Session | null>(null)
  const loading = shallowRef(false)
  const initializing = shallowRef(false)
  const initialized = shallowRef(false)
  const accountDeleting = shallowRef(false)
  const profileSaving = shallowRef(false)
  const profileError = shallowRef<string | null>(null)
  const actionError = shallowRef<string | null>(null)
  let authStateSubscription: { unsubscribe: () => void } | null = null

  const user = computed(() => session.value?.user ?? null)
  const isAuthenticated = computed(() => Boolean(user.value))
  const isConfigured = computed(() => hasSupabaseConfig)

  const displayName = computed(() => {
    const metadataName = getUserMetadataValue(user.value, [
      'display_name',
      'full_name',
      'name',
      'user_name',
    ])
    if (metadataName) {
      return metadataName
    }

    return user.value?.email?.split('@')[0] ?? 'Member'
  })

  const avatarUrl = computed(() =>
    getUserMetadataValue(user.value, ['avatar_url', 'picture', 'image', 'profile_image_url']),
  )
  const bio = computed(() => getUserMetadataValue(user.value, ['bio']))
  const username = computed(() => {
    const metadataUsername = getUserMetadataValue(user.value, [
      'preferred_username',
      'user_name',
      'login',
      'nickname',
    ])

    return metadataUsername ?? user.value?.email?.split('@')[0] ?? 'member'
  })
  const profileHandle = computed(() => `@${username.value}`)
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

  function ensureAuthStateListener() {
    if (!supabase) {
      return
    }

    if (authStateSubscription) {
      return
    }

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      session.value = nextSession
    })

    authStateSubscription = data.subscription
  }

  function getOAuthCallbackParams() {
    if (typeof window === 'undefined') {
      return null
    }

    const url = new URL(window.location.href)
    const params = new URLSearchParams(url.search)

    if (url.hash) {
      const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
      const hashParams = new URLSearchParams(hash)

      for (const [key, value] of hashParams.entries()) {
        if (!params.has(key)) {
          params.set(key, value)
        }
      }
    }

    return params
  }

  function getOAuthCallbackError(params: URLSearchParams) {
    const errorDescription = params.get('error_description') || params.get('error')

    return errorDescription?.replace(/\+/g, ' ').trim() || null
  }

  async function completeOAuthRedirect(): Promise<OAuthRedirectResult> {
    if (!supabase) {
      return { handled: false, ok: false, message: AUTH_CONFIG_ERROR }
    }

    const params = getOAuthCallbackParams()
    const code = params?.get('code')?.trim()
    const callbackError = params ? getOAuthCallbackError(params) : null

    if (!code && !callbackError) {
      return { handled: false, ok: true }
    }

    ensureAuthStateListener()
    loading.value = true
    actionError.value = null

    try {
      if (callbackError) {
        throw new Error(callbackError)
      }

      if (!code) {
        throw new Error('OAuth callback did not include a session code.')
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        throw error
      }

      session.value = data.session
      initialized.value = true

      return { handled: true, ok: true }
    } catch (error) {
      const message = getAuthErrorMessage(error)
      actionError.value = message
      session.value = null
      initialized.value = true

      return { handled: true, ok: false, message }
    } finally {
      loading.value = false
    }
  }

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

    ensureAuthStateListener()

    const { data, error } = await supabase.auth.getSession()

    if (error) {
      actionError.value = error.message
    }

    session.value = data.session

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
    redirectPath = '/account',
  ): Promise<AuthActionResult> {
    if (!supabase) {
      actionError.value = AUTH_CONFIG_ERROR
      return { ok: false, message: AUTH_CONFIG_ERROR }
    }

    loading.value = true
    actionError.value = null

    try {
      storeOAuthRedirectPath(redirectPath)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getOAuthCallbackUrl(),
        },
      })

      if (error) {
        throw error
      }

      if (!data.url && typeof window === 'undefined') {
        throw new Error(`${getProviderLabel(provider)} sign-in could not start.`)
      }

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

  async function updateProfile(updates: ProfileMetadataUpdates): Promise<AuthActionResult> {
    if (!supabase) {
      profileError.value = AUTH_CONFIG_ERROR
      return { ok: false, message: AUTH_CONFIG_ERROR }
    }

    if (!user.value) {
      const message = 'Sign in to update your profile.'
      profileError.value = message
      return { ok: false, message }
    }

    const nextMetadata: Record<string, unknown> = { ...user.value.user_metadata }

    if (updates.displayName !== undefined) {
      const nextDisplayName = updates.displayName.trim()
      if (!nextDisplayName) {
        const message = 'Display name is required.'
        profileError.value = message
        return { ok: false, message }
      }

      nextMetadata.display_name = nextDisplayName
      nextMetadata.full_name = nextDisplayName
      nextMetadata.name = nextDisplayName
    }

    if (updates.avatarUrl !== undefined) {
      nextMetadata.avatar_url = updates.avatarUrl
    }

    if (updates.bio !== undefined) {
      const nextBio = updates.bio?.trim()
      nextMetadata.bio = nextBio || null
    }

    profileSaving.value = true
    profileError.value = null

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: nextMetadata,
      })

      if (error) {
        throw error
      }

      if (data.user && session.value) {
        session.value = {
          ...session.value,
          user: data.user,
        }
      }

      return { ok: true }
    } catch (error) {
      const message = getAuthErrorMessage(error)
      profileError.value = message
      return { ok: false, message }
    } finally {
      profileSaving.value = false
    }
  }

  async function deleteAccount(emailConfirmation: string): Promise<AuthActionResult> {
    if (!supabase) {
      actionError.value = AUTH_CONFIG_ERROR
      return { ok: false, message: AUTH_CONFIG_ERROR }
    }

    if (!user.value) {
      const message = 'Sign in to delete your account.'
      actionError.value = message
      return { ok: false, message }
    }

    const confirmedEmail = emailConfirmation.trim().toLowerCase()
    const currentEmail = user.value.email?.trim().toLowerCase()
    if (!currentEmail || confirmedEmail !== currentEmail) {
      const message = 'Type your account email to confirm deletion.'
      actionError.value = message
      return { ok: false, message }
    }

    accountDeleting.value = true
    actionError.value = null

    try {
      const { data, error } = await supabase.functions.invoke<DeleteAccountResponse>(
        'delete-account',
        {
          body: { email: confirmedEmail },
        },
      )

      if (error) {
        throw error
      }

      if (!data?.ok) {
        throw new Error(data?.error || 'Account could not be deleted.')
      }

      session.value = null
      return { ok: true }
    } catch (error) {
      const message = await getSupabaseFunctionErrorMessage(
        error,
        'Account could not be deleted.',
      )
      actionError.value = message
      return { ok: false, message }
    } finally {
      accountDeleting.value = false
    }
  }

  function clearError() {
    actionError.value = null
    profileError.value = null
  }

  return {
    accountDeleting,
    actionError,
    avatarInitial,
    avatarUrl,
    bio,
    clearError,
    completeOAuthRedirect,
    consumeStoredOAuthRedirectPath,
    deleteAccount,
    displayName,
    initialize,
    initialized,
    initializing,
    isAuthenticated,
    isConfigured,
    loading,
    profileError,
    profileHandle,
    profileSaving,
    providerLabel,
    sendPasswordReset,
    session,
    signIn,
    signInWithOAuth,
    signOut,
    signUp,
    updateProfile,
    user,
    username,
  }
})
