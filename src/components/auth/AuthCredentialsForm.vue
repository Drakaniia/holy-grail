<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Chrome,
  Eye,
  EyeOff,
  Github,
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
    : 'Sign in with the email connected to your Holy Grail account.'
)
const switchPrompt = computed(() =>
  isSignup.value ? 'Already have access?' : 'Need a workspace?'
)
const switchRoute = computed(() => (isSignup.value ? '/login' : '/signup'))
const switchLabel = computed(() => (isSignup.value ? 'Sign in' : 'Create one'))
const submitLabel = computed(() => (isSignup.value ? 'Create account' : 'Sign in'))
const passwordInputType = computed(() => (showPassword.value ? 'text' : 'password'))
const passwordAutocomplete = computed(() => (isSignup.value ? 'new-password' : 'current-password'))

const passwordStrength = computed(() => {
  if (!password.value) return { label: 'No password', width: '0%', className: 'bg-zinc-800' }
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
  }
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
  <section class="border border-zinc-800 bg-[#060606] p-6 text-white shadow-2xl shadow-black/30 sm:p-8">
    <div class="mb-8 flex items-start justify-between gap-6">
      <div>
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-accent-300">
          Holy Grail Auth
        </p>
        <h2 class="text-3xl font-bold tracking-normal text-white">{{ authTitle }}</h2>
        <p class="mt-3 max-w-md text-sm leading-6 text-zinc-400">{{ authSubtitle }}</p>
      </div>
      <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center border border-zinc-700 bg-zinc-950">
        <UserRound class="h-5 w-5 text-accent-300" />
      </div>
    </div>

    <div
      v-if="disabled"
      class="mb-5 border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100"
    >
      Supabase env vars are missing. Create <code>.env.local</code> from
      <code>.env.example</code>, then restart <code>bun dev</code>.
    </div>

    <div
      v-if="notice"
      class="mb-5 flex gap-3 border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-100"
    >
      <CheckCircle2 class="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{{ notice }}</span>
    </div>

    <div
      v-if="error || validationMessage"
      class="mb-5 flex gap-3 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-100"
    >
      <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{{ validationMessage || error }}</span>
    </div>

    <div class="mb-6 grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        class="flex h-12 items-center justify-center gap-2 border border-zinc-700 bg-zinc-950 px-4 text-sm font-semibold text-zinc-100 transition hover:border-sky-300/50 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isFormDisabled"
        @click="emit('oauth', 'google')"
      >
        <Chrome class="h-4 w-4 text-sky-300" />
        <span>Continue with Google</span>
      </button>

      <button
        type="button"
        class="flex h-12 items-center justify-center gap-2 border border-zinc-700 bg-zinc-950 px-4 text-sm font-semibold text-zinc-100 transition hover:border-zinc-300 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isFormDisabled"
        @click="emit('oauth', 'github')"
      >
        <Github class="h-4 w-4 text-zinc-200" />
        <span>Continue with GitHub</span>
      </button>
    </div>

    <div class="mb-6 flex items-center gap-3">
      <span class="h-px flex-1 bg-zinc-800"></span>
      <span class="text-xs font-semibold uppercase tracking-widest text-zinc-600">or use email</span>
      <span class="h-px flex-1 bg-zinc-800"></span>
    </div>

    <form class="space-y-5" @submit.prevent="handleSubmit">
      <label v-if="isSignup" class="block">
        <span class="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Name
        </span>
        <span class="relative block">
          <UserRound class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            v-model="fullName"
            :disabled="isFormDisabled"
            autocomplete="name"
            class="h-12 w-full border border-zinc-700 bg-black pl-10 pr-3 text-sm text-white outline-none transition focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Your name"
            type="text"
          />
        </span>
      </label>

      <label class="block">
        <span class="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Email
        </span>
        <span class="relative block">
          <Mail class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            v-model="email"
            :disabled="isFormDisabled"
            autocomplete="email"
            class="h-12 w-full border border-zinc-700 bg-black pl-10 pr-3 text-sm text-white outline-none transition focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="you@example.com"
            type="email"
          />
        </span>
      </label>

      <label class="block">
        <span class="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Password
        </span>
        <span class="relative block">
          <KeyRound class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            v-model="password"
            :disabled="isFormDisabled"
            :type="passwordInputType"
            :autocomplete="passwordAutocomplete"
            class="h-12 w-full border border-zinc-700 bg-black pl-10 pr-12 text-sm text-white outline-none transition focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Minimum 8 characters"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-white"
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
          <div class="mb-2 flex items-center justify-between text-xs text-zinc-500">
            <span>Password strength</span>
            <span>{{ passwordStrength.label }}</span>
          </div>
          <div class="h-1.5 bg-zinc-900">
            <div
              class="h-full transition-all duration-300"
              :class="passwordStrength.className"
              :style="{ width: passwordStrength.width }"
            ></div>
          </div>
        </div>

        <label class="block">
          <span class="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Confirm password
          </span>
          <span class="relative block">
            <KeyRound class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              v-model="confirmPassword"
              :disabled="isFormDisabled"
              :type="passwordInputType"
              autocomplete="new-password"
              class="h-12 w-full border border-zinc-700 bg-black pl-10 pr-3 text-sm text-white outline-none transition focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Repeat password"
            />
          </span>
        </label>
      </div>

      <div v-if="!isSignup" class="flex justify-end">
        <button
          type="button"
          class="text-xs font-semibold uppercase tracking-widest text-zinc-500 transition hover:text-accent-300"
          :disabled="isFormDisabled"
          @click="requestPasswordReset"
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        class="flex h-12 w-full items-center justify-center gap-2 bg-white px-4 text-sm font-bold text-black transition hover:bg-accent-200 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isFormDisabled"
      >
        <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
        <span>{{ loading ? 'Working...' : submitLabel }}</span>
        <ArrowRight v-if="!loading" class="h-4 w-4" />
      </button>
    </form>

    <div class="mt-6 border-t border-zinc-800 pt-5 text-sm text-zinc-500">
      {{ switchPrompt }}
      <RouterLink :to="switchRoute" class="ml-1 font-semibold text-accent-300 hover:text-accent-200">
        {{ switchLabel }}
      </RouterLink>
    </div>
  </section>
</template>
