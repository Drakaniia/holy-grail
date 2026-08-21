<script setup lang="ts">
import { Mail } from 'lucide-vue-next'
import type { AuthProvider } from '@/types/auth'

defineProps<{
  disabled: boolean
  mode: 'login' | 'signup'
}>()

const emit = defineEmits<{
  oauth: [provider: AuthProvider]
  continueEmail: []
}>()
</script>

<template>
  <div class="w-full">
    <!-- Login Mode Stack -->
    <div v-if="mode === 'login'" class="flex flex-col gap-3">
      <button
        type="button"
        class="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-zinc-800/80 bg-[#1e1c1c] text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        :disabled="disabled"
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
        class="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-zinc-800/80 bg-[#1e1c1c] text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        :disabled="disabled"
        @click="emit('oauth', 'github')"
      >
        <svg class="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.29 9.41 7.86 10.94.58.1.79-.25.79-.56v-2.18c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.16 1.18.92-.26 1.9-.38 2.88-.39.98.01 1.96.13 2.88.39 2.19-1.49 3.15-1.18 3.15-1.18.63 1.59.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.77 1.06.77 2.13v3.2c0 .31.21.67.79.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"
          />
        </svg>
        <span>Continue with GitHub</span>
      </button>

      <button
        type="button"
        class="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-zinc-800/80 bg-[#1e1c1c] text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        :disabled="disabled"
        @click="emit('continueEmail')"
      >
        <Mail class="h-4.5 w-4.5 text-zinc-400" />
        <span>Continue with email</span>
      </button>
    </div>

    <!-- Signup Mode Grid -->
    <div v-else class="flex flex-col items-center gap-5 w-full">
      <div class="grid grid-cols-2 gap-4 w-full">
        <button
          type="button"
          class="flex h-12 items-center justify-center gap-2.5 rounded-full bg-white hover:bg-zinc-100 text-sm font-semibold text-black transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          :disabled="disabled"
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
          <span>Google</span>
        </button>

        <button
          type="button"
          class="flex h-12 items-center justify-center gap-2.5 rounded-full border border-zinc-800 bg-[#222222] hover:bg-zinc-800 text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          :disabled="disabled"
          @click="emit('oauth', 'github')"
        >
          <svg class="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.29 9.41 7.86 10.94.58.1.79-.25.79-.56v-2.18c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.16 1.18.92-.26 1.9-.38 2.88-.39.98.01 1.96.13 2.88.39 2.19-1.49 3.15-1.18 3.15-1.18.63 1.59.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.77 1.06.77 2.13v3.2c0 .31.21.67.79.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"
            />
          </svg>
          <span>GitHub</span>
        </button>
      </div>

      <button
        type="button"
        class="text-sm text-zinc-400 hover:text-white transition duration-200 cursor-pointer font-medium"
        :disabled="disabled"
        @click="emit('continueEmail')"
      >
        Continue with email <span class="ml-0.5">›</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
html.light button[class*='bg-[#1e1c1c]'] {
  background-color: var(--mocha-surface) !important;
  border-color: var(--mocha-border) !important;
  color: var(--mocha-text) !important;
}
html.light button[class*='bg-[#1e1c1c]']:hover {
  background-color: var(--mocha-surface-strong) !important;
}
html.light button[class*='bg-[#222222]'] {
  background-color: var(--mocha-surface) !important;
  border-color: var(--mocha-border) !important;
  color: var(--mocha-text) !important;
}
html.light button[class*='bg-[#222222]']:hover {
  background-color: var(--mocha-surface-strong) !important;
}
html.light .text-zinc-400 {
  color: var(--mocha-text-soft) !important;
}
html.light .hover\:text-white:hover {
  color: var(--mocha-text) !important;
}
</style>
