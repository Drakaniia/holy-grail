<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { ArrowRight, Eye, EyeOff, KeyRound, Loader2, Mail, UserRound } from 'lucide-vue-next'
import type { AuthCredentials } from '@/types/auth'

const props = defineProps<{
  disabled: boolean
  loading: boolean
  mode: 'login' | 'signup'
}>()

const emit = defineEmits<{
  submit: [credentials: AuthCredentials]
  requestPasswordReset: [email: string]
}>()

const email = shallowRef('')
const fullName = shallowRef('')
const password = shallowRef('')
const confirmPassword = shallowRef('')
const showPassword = shallowRef(false)
const validationError = shallowRef<string | null>(null)

const isSignup = computed(() => props.mode === 'signup')
const isFormDisabled = computed(() => props.disabled || props.loading)
const passwordInputType = computed(() => (showPassword.value ? 'text' : 'password'))
const submitLabel = computed(() => (isSignup.value ? 'Create account' : 'Sign in'))

const passwordStrength = computed(() => {
  if (!password.value) return { label: 'No password', width: '0%', className: 'bg-zinc-800' }
  if (password.value.length >= 12)
    return { label: 'Strong', width: '100%', className: 'bg-emerald-400' }
  if (password.value.length >= 8) return { label: 'Good', width: '66%', className: 'bg-amber-400' }
  return { label: 'Too short', width: '33%', className: 'bg-red-400' }
})

function validateForm() {
  const normalizedEmail = email.value.trim()
  if (!normalizedEmail) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return 'Enter a valid email address.'
  if (password.value.length < 8) return 'Password must be at least 8 characters.'
  if (isSignup.value && password.value !== confirmPassword.value) return 'Passwords do not match.'
  return null
}

function handleSubmit() {
  const error = validateForm()
  validationError.value = error
  if (error) return
  emit('submit', {
    email: email.value.trim(),
    fullName: isSignup.value ? fullName.value.trim() || undefined : undefined,
    password: password.value,
  })
}

function handleForgotPassword() {
  const normalizedEmail = email.value.trim()
  if (!normalizedEmail) {
    validationError.value = 'Enter your email before requesting a reset link.'
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    validationError.value = 'Enter a valid email before requesting a reset link.'
    return
  }
  validationError.value = null
  emit('requestPasswordReset', normalizedEmail)
}
</script>

<template>
  <form class="space-y-4 w-full" @submit.prevent="handleSubmit">
    <div
      v-if="validationError"
      class="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200 text-left"
    >
      {{ validationError }}
    </div>

    <!-- Full Name (Signup Only) -->
    <div v-if="isSignup" class="flex flex-col gap-1.5 text-left">
      <label class="text-xs font-semibold uppercase tracking-widest text-zinc-500">Name</label>
      <div class="relative">
        <UserRound class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          v-model="fullName"
          :disabled="isFormDisabled"
          autocomplete="name"
          class="h-12 w-full rounded-xl border border-zinc-800 bg-[#161414] pl-10 pr-4 text-sm text-white outline-none focus:border-zinc-700 transition"
          placeholder="Your name"
          type="text"
        />
      </div>
    </div>

    <!-- Email -->
    <div class="flex flex-col gap-1.5 text-left">
      <label class="text-xs font-semibold uppercase tracking-widest text-zinc-500">Email</label>
      <div class="relative">
        <Mail class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          v-model="email"
          :disabled="isFormDisabled"
          autocomplete="email"
          class="h-12 w-full rounded-xl border border-zinc-800 bg-[#161414] pl-10 pr-4 text-sm text-white outline-none focus:border-zinc-700 transition"
          placeholder="you@example.com"
          type="email"
          required
        />
      </div>
    </div>

    <!-- Password -->
    <div class="flex flex-col gap-1.5 text-left">
      <label class="text-xs font-semibold uppercase tracking-widest text-zinc-500">Password</label>
      <div class="relative">
        <KeyRound class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          v-model="password"
          :disabled="isFormDisabled"
          :type="passwordInputType"
          class="h-12 w-full rounded-xl border border-zinc-800 bg-[#161414] pl-10 pr-12 text-sm text-white outline-none focus:border-zinc-700 transition"
          placeholder="Minimum 8 characters"
          required
        />
        <button
          type="button"
          class="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition cursor-pointer"
          :aria-label="showPassword ? 'Hide password' : 'Show password'"
          @click="showPassword = !showPassword"
        >
          <EyeOff v-if="showPassword" class="h-4 w-4" />
          <Eye v-else class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Password Strength & Confirm Password (Signup Only) -->
    <div v-if="isSignup" class="space-y-4">
      <div class="space-y-1 text-left">
        <div class="flex items-center justify-between text-xxs text-zinc-500">
          <span>Password strength</span>
          <span>{{ passwordStrength.label }}</span>
        </div>
        <div class="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div
            class="h-full transition-all duration-300"
            :class="passwordStrength.className"
            :style="{ width: passwordStrength.width }"
          ></div>
        </div>
      </div>

      <div class="flex flex-col gap-1.5 text-left">
        <label class="text-xs font-semibold uppercase tracking-widest text-zinc-500"
          >Confirm password</label
        >
        <div class="relative">
          <KeyRound class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            v-model="confirmPassword"
            :disabled="isFormDisabled"
            :type="passwordInputType"
            class="h-12 w-full rounded-xl border border-zinc-800 bg-[#161414] pl-10 pr-4 text-sm text-white outline-none focus:border-zinc-700 transition"
            placeholder="Repeat password"
            required
          />
        </div>
      </div>
    </div>

    <!-- Forgot Password (Login Only) -->
    <div v-if="!isSignup" class="flex justify-end">
      <button
        type="button"
        class="text-xxs font-semibold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition cursor-pointer"
        :disabled="isFormDisabled"
        @click="handleForgotPassword"
      >
        Forgot password?
      </button>
    </div>

    <!-- Submit Button -->
    <button
      type="submit"
      class="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white hover:bg-zinc-200 text-sm font-bold text-[#1f1f1f] transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      :disabled="isFormDisabled"
    >
      <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
      <span>{{ loading ? 'Working...' : submitLabel }}</span>
      <ArrowRight v-if="!loading" class="h-4 w-4" />
    </button>
  </form>
</template>

<style scoped>
.text-xxs {
  font-size: 0.65rem;
}
html.light input {
  background-color: var(--mocha-surface) !important;
  border-color: var(--mocha-border) !important;
  color: var(--mocha-text) !important;
}
html.light input:focus {
  border-color: var(--mocha-border-strong) !important;
}
html.light label {
  color: var(--mocha-text-soft) !important;
}
html.light .text-zinc-500 {
  color: var(--mocha-text-soft) !important;
}
html.light .hover\:text-zinc-300:hover {
  color: var(--mocha-text) !important;
}
</style>
