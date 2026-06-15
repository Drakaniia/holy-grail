<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  UserRound,
} from 'lucide-vue-next'
import type { AuthCredentials, AuthMode, AuthProvider } from '@/types/auth'

const props = defineProps<{
  disabled: boolean
  error: string | null
  loading: boolean
  mode: AuthMode
  notice: string | null
}>()

const emit = defineEmits<{
  oauth: [provider: AuthProvider]
  requestPasswordReset: [email: string]
  submit: [credentials: AuthCredentials]
}>()

const email = shallowRef('')
const fullName = shallowRef('')
const password = shallowRef('')
const confirmPassword = shallowRef('')
const showPassword = shallowRef(false)
const validationMessage = shallowRef<string | null>(null)

const isSignup = computed(() => props.mode === 'signup')
const isFormDisabled = computed(() => props.disabled || props.loading)
const authTitle = computed(() => (isSignup.value ? 'Create account' : 'Welcome back'))
const authSubtitle = computed(() =>
  isSignup.value
    ? 'Use an email and password to start a secured Holy Grail account.'
    : 'Sign in with the email connected to your Holy Grail account.',
)
const switchPrompt = computed(() => (isSignup.value ? 'Already have access?' : 'Need a workspace?'))
const switchRoute = computed(() => (isSignup.value ? '/login' : '/signup'))
const switchLabel = computed(() => (isSignup.value ? 'Sign in' : 'Create one'))
const submitLabel = computed(() => (isSignup.value ? 'Create account' : 'Sign in'))
const passwordInputType = computed(() => (showPassword.value ? 'text' : 'password'))
const passwordAutocomplete = computed(() => (isSignup.value ? 'new-password' : 'current-password'))

const passwordStrength = computed(() => {
  if (!password.value) return { label: 'No password', width: '0%', className: 'bg-[#1f1f1f]' }
  if (password.value.length >= 12) {
    return { label: 'Strong', width: '100%', className: 'bg-emerald-400' }
  }
  if (password.value.length >= 8) {
    return { label: 'Good', width: '66%', className: 'bg-accent-400' }
  }

  return { label: 'Too short', width: '33%', className: 'bg-red-400' }
})

watch(
  () => props.mode,
  () => {
    password.value = ''
    confirmPassword.value = ''
    fullName.value = ''
    validationMessage.value = null
  },
)

function validateForm() {
  const normalizedEmail = email.value.trim()

  if (!normalizedEmail) {
    return 'Email is required.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return 'Enter a valid email address.'
  }

  if (password.value.length < 8) {
    return 'Password must be at least 8 characters.'
  }

  if (isSignup.value && password.value !== confirmPassword.value) {
    return 'Passwords do not match.'
  }

  return null
}

function handleSubmit() {
  const error = validateForm()
  validationMessage.value = error

  if (error) {
    return
  }

  emit('submit', {
    email: email.value.trim(),
    fullName: fullName.value.trim() || undefined,
    password: password.value,
  })
}

function requestPasswordReset() {
  const normalizedEmail = email.value.trim()

  if (!normalizedEmail) {
    validationMessage.value = 'Enter your email before requesting a reset link.'
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    validationMessage.value = 'Enter a valid email before requesting a reset link.'
    return
  }

  validationMessage.value = null
  emit('requestPasswordReset', normalizedEmail)
}
</script>

<template>
  <section
    class="auth-card border border-zinc-800 bg-[#1f1f1f] p-6 text-white shadow-2xl shadow-[#1f1f1f]/30 sm:p-8"
  >
    <div class="mb-8 flex items-start justify-between gap-6">
      <div>
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-accent-300">
          Holy Grail Auth
        </p>
        <h2 class="auth-title text-3xl font-bold tracking-normal text-white">{{ authTitle }}</h2>
        <p class="auth-copy mt-3 max-w-md text-sm leading-6 text-zinc-400">
          {{ authSubtitle }}
        </p>
      </div>
      <div
        class="auth-icon-panel flex h-12 w-12 flex-shrink-0 items-center justify-center border border-zinc-700 bg-[#1f1f1f]"
      >
        <UserRound class="h-5 w-5 text-accent-300" />
      </div>
    </div>

    <div
      v-if="disabled"
      class="auth-warning mb-5 border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100"
    >
      Supabase env vars are missing. Create <code>.env.local</code> from <code>.env.example</code>,
      then restart <code>bun dev</code>.
    </div>

    <div
      v-if="notice"
      class="auth-success mb-5 flex gap-3 border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-100"
    >
      <CheckCircle2 class="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{{ notice }}</span>
    </div>

    <div
      v-if="error || validationMessage"
      class="auth-error mb-5 flex gap-3 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-100"
    >
      <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{{ validationMessage || error }}</span>
    </div>

    <div class="mb-6 grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        class="auth-social-button flex h-12 items-center justify-center gap-2 border border-zinc-700 bg-[#1f1f1f] px-4 text-sm font-semibold text-zinc-100 transition hover:border-sky-300/50 hover:bg-[#1f1f1f] disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isFormDisabled"
        @click="emit('oauth', 'google')"
      >
        <svg class="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
          <path
            fill="#4285f4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34a853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#fbbc05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z"
          />
          <path
            fill="#ea4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      <button
        type="button"
        class="auth-social-button flex h-12 items-center justify-center gap-2 border border-zinc-700 bg-[#1f1f1f] px-4 text-sm font-semibold text-zinc-100 transition hover:border-zinc-300 hover:bg-[#1f1f1f] disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isFormDisabled"
        @click="emit('oauth', 'github')"
      >
        <svg class="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.29 9.41 7.86 10.94.58.1.79-.25.79-.56v-2.18c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.16 1.18.92-.26 1.9-.38 2.88-.39.98.01 1.96.13 2.88.39 2.19-1.49 3.15-1.18 3.15-1.18.63 1.59.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.77 1.06.77 2.13v3.2c0 .31.21.67.79.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"
          />
        </svg>
        <span>Continue with GitHub</span>
      </button>
    </div>

    <div class="mb-6 flex items-center gap-3">
      <span class="auth-divider-line h-px flex-1 bg-[#1f1f1f]"></span>
      <span
        class="auth-divider-label text-xs font-semibold uppercase tracking-widest text-zinc-600"
      >
        or use email
      </span>
      <span class="auth-divider-line h-px flex-1 bg-[#1f1f1f]"></span>
    </div>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <label v-if="isSignup" class="block">
        <span
          class="auth-field-label mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500"
        >
          Name
        </span>
        <span class="relative block">
          <UserRound class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            v-model="fullName"
            :disabled="isFormDisabled"
            autocomplete="name"
            class="auth-input h-12 w-full border border-zinc-700 bg-[#1f1f1f] pl-10 pr-3 text-sm text-white outline-none transition focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Your name"
            type="text"
          />
        </span>
      </label>

      <label class="block">
        <span
          class="auth-field-label mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500"
        >
          Email
        </span>
        <span class="relative block">
          <Mail class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            v-model="email"
            :disabled="isFormDisabled"
            autocomplete="email"
            class="auth-input h-12 w-full border border-zinc-700 bg-[#1f1f1f] pl-10 pr-3 text-sm text-white outline-none transition focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="you@example.com"
            type="email"
          />
        </span>
      </label>

      <label class="block">
        <span
          class="auth-field-label mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500"
        >
          Password
        </span>
        <span class="relative block">
          <KeyRound class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            v-model="password"
            :disabled="isFormDisabled"
            :type="passwordInputType"
            :autocomplete="passwordAutocomplete"
            class="auth-input h-12 w-full border border-zinc-700 bg-[#1f1f1f] pl-10 pr-12 text-sm text-white outline-none transition focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Minimum 8 characters"
          />
          <button
            type="button"
            class="auth-eye-button absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-white"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" class="h-4 w-4" />
            <Eye v-else class="h-4 w-4" />
          </button>
        </span>
      </label>

      <div v-if="isSignup" class="space-y-5">
        <div>
          <div
            class="auth-meter-label mb-2 flex items-center justify-between text-xs text-zinc-500"
          >
            <span>Password strength</span>
            <span>{{ passwordStrength.label }}</span>
          </div>
          <div class="auth-meter-track h-1.5 bg-[#1f1f1f]">
            <div
              class="h-full transition-all duration-300"
              :class="passwordStrength.className"
              :style="{ width: passwordStrength.width }"
            ></div>
          </div>
        </div>

        <label class="block">
          <span
            class="auth-field-label mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500"
          >
            Confirm password
          </span>
          <span class="relative block">
            <KeyRound class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              v-model="confirmPassword"
              :disabled="isFormDisabled"
              :type="passwordInputType"
              autocomplete="new-password"
              class="auth-input h-12 w-full border border-zinc-700 bg-[#1f1f1f] pl-10 pr-3 text-sm text-white outline-none transition focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Repeat password"
            />
          </span>
        </label>
      </div>

      <div v-if="!isSignup" class="flex justify-end">
        <button
          type="button"
          class="auth-link-muted text-xs font-semibold uppercase tracking-widest text-zinc-500 transition hover:text-accent-300"
          :disabled="isFormDisabled"
          @click="requestPasswordReset"
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        class="auth-submit flex h-12 w-full items-center justify-center gap-2 bg-white px-4 text-sm font-bold text-[#1f1f1f] transition hover:bg-accent-200 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isFormDisabled"
      >
        <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
        <span>{{ loading ? 'Working...' : submitLabel }}</span>
        <ArrowRight v-if="!loading" class="h-4 w-4" />
      </button>
    </form>

    <div class="auth-switch mt-6 border-t border-zinc-800 pt-5 text-sm text-zinc-500">
      {{ switchPrompt }}
      <RouterLink
        :to="switchRoute"
        class="auth-switch-link ml-1 font-semibold text-accent-300 hover:text-accent-200"
      >
        {{ switchLabel }}
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
:global(html.light .auth-card) {
  border-color: var(--mocha-border) !important;
  background: var(--mocha-surface) !important;
  color: var(--mocha-text) !important;
  box-shadow: 0 28px 70px rgba(86, 64, 45, 0.16) !important;
}

:global(html.light .auth-title) {
  color: var(--mocha-text) !important;
}

:global(html.light .auth-copy),
:global(html.light .auth-field-label),
:global(html.light .auth-divider-label),
:global(html.light .auth-meter-label),
:global(html.light .auth-switch) {
  color: var(--mocha-text-soft) !important;
}

:global(html.light .auth-icon-panel) {
  border-color: var(--mocha-border) !important;
  background: var(--mocha-surface-strong) !important;
}

:global(html.light .auth-social-button) {
  border-color: var(--mocha-border) !important;
  background: var(--mocha-surface-strong) !important;
  color: var(--mocha-text) !important;
}

:global(html.light .auth-social-button:hover) {
  border-color: #ff8c1a !important;
  background: rgba(255, 140, 26, 0.1) !important;
}

:global(html.light .auth-divider-line),
:global(html.light .auth-switch) {
  border-color: var(--mocha-border) !important;
}

:global(html.light .auth-divider-line),
:global(html.light .auth-meter-track) {
  background: var(--mocha-surface-muted) !important;
}

:global(html.light .auth-input) {
  border-color: var(--mocha-border) !important;
  background: var(--mocha-bg) !important;
  color: var(--mocha-text) !important;
}

:global(html.light .auth-input:focus) {
  border-color: #ff8c1a !important;
}

:global(html.light .auth-input::placeholder) {
  color: var(--mocha-faint) !important;
}

:global(html.light .auth-eye-button:hover),
:global(html.light .auth-link-muted:hover),
:global(html.light .auth-switch-link) {
  color: #cc6100 !important;
}

:global(html.light .auth-submit) {
  border: 1px solid var(--mocha-border) !important;
  background: #ffffff !important;
  color: #1f1f1f !important;
}

:global(html.light .auth-submit:hover) {
  background: rgba(255, 140, 26, 0.16) !important;
}

:global(html.light .auth-warning) {
  border-color: rgba(217, 119, 6, 0.35) !important;
  background: rgba(245, 158, 11, 0.12) !important;
  color: #6d3b05 !important;
}

:global(html.light .auth-success) {
  border-color: rgba(5, 150, 105, 0.3) !important;
  background: rgba(16, 185, 129, 0.1) !important;
  color: #075e45 !important;
}

:global(html.light .auth-error) {
  border-color: rgba(220, 38, 38, 0.28) !important;
  background: rgba(248, 113, 113, 0.1) !important;
  color: #7f1d1d !important;
}
</style>
