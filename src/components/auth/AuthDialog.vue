<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import {
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  Mail,
  Sparkles,
  Bookmark,
  X,
  ArrowRight,
  Loader2,
} from 'lucide-vue-next'
import AuthOAuthButtons from '@/components/auth/AuthOAuthButtons.vue'
import AuthEmailForm from '@/components/auth/AuthEmailForm.vue'
import signupImg from '@/assets/signup_img.png'
import type { AuthCredentials, AuthMode, AuthProvider } from '@/types/auth'

const props = defineProps<{
  disabled: boolean
  error: string | null
  loading: boolean
  mode: 'login' | 'signup' | 'reset'
  notice: string | null
}>()

const emit = defineEmits<{
  close: []
  oauth: [provider: AuthProvider]
  requestPasswordReset: [email: string]
  submit: [credentials: AuthCredentials]
  switchMode: [mode: AuthMode]
}>()

const showEmailForm = shallowRef(false)
const resetEmail = shallowRef('')
const resetSubmitted = shallowRef(false)
const localNotice = shallowRef<string | null>(null)
const validationMessage = shallowRef<string | null>(null)

const dialogShell = useTemplateRef<HTMLElement>('dialogShell')
let previousBodyOverflow: string | null = null
let windowKeydownHandler: ((event: KeyboardEvent) => void) | undefined

const isLogin = computed(() => props.mode === 'login')
const isSignup = computed(() => props.mode === 'signup')
const isReset = computed(() => props.mode === 'reset')

// Reset states on mode switch
watch(
  () => props.mode,
  () => {
    showEmailForm.value = false
    resetSubmitted.value = false
    resetEmail.value = ''
    localNotice.value = null
    validationMessage.value = null
  },
)

// Body scroll lock
watch(
  () => true,
  () => {
    if (typeof document === 'undefined') return
    previousBodyOverflow ??= document.body.style.overflow
    document.body.style.overflow = 'hidden'
  },
  { immediate: true },
)

onMounted(() => {
  nextTick(() => {
    dialogShell.value?.focus({ preventScroll: true })
  })
  windowKeydownHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      emit('close')
    }
  }
  window.addEventListener('keydown', windowKeydownHandler)
})

onUnmounted(() => {
  if (typeof document === 'undefined' || previousBodyOverflow === null) return
  document.body.style.overflow = previousBodyOverflow
  previousBodyOverflow = null
  if (windowKeydownHandler) {
    window.removeEventListener('keydown', windowKeydownHandler)
    windowKeydownHandler = undefined
  }
})

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit('close')
  }
}

function handlePasswordReset() {
  const emailVal = resetEmail.value.trim()
  if (!emailVal) return
  resetSubmitted.value = false
  emit('requestPasswordReset', emailVal)
  resetSubmitted.value = true
  localNotice.value = 'Password reset email sent. Check your inbox.'
}
</script>

<template>
  <Teleport to="body">
    <div
      ref="dialogShell"
      data-testid="auth-dialog-shell"
      class="auth-dialog-shell fixed inset-0 z-[90] flex items-center justify-center overflow-hidden px-4 py-4 text-white sm:py-6"
      tabindex="-1"
    >
      <!-- Backdrop -->
      <button
        type="button"
        data-testid="auth-backdrop"
        class="auth-dialog-backdrop fixed inset-0 bg-[#121212]/80 backdrop-blur-[4px] cursor-default border-none outline-none"
        aria-label="Close dialog"
        @click="handleBackdropClick"
      ></button>

      <!-- Panel Shell -->
      <section
        class="auth-dialog-panel relative flex w-full flex-col overflow-hidden bg-[#181616] border border-zinc-800/80 shadow-[0_30px_90px_rgba(0,0,0,0.85)] transition-all duration-300 rounded-3xl"
        :class="[
          isSignup
            ? 'max-w-[440px] md:max-w-[860px] md:grid md:grid-cols-2 md:h-[580px]'
            : 'max-w-[440px]',
        ]"
        role="dialog"
        aria-label="Auth dialog"
        aria-modal="true"
      >
        <!-- Signup Left Image column -->
        <div v-if="isSignup" class="hidden md:block h-full w-full overflow-hidden select-none border-r border-zinc-800/40">
          <img
            :src="signupImg"
            alt="Sign Up illustration"
            class="h-full w-full object-cover brightness-95"
            draggable="false"
          />
        </div>

        <!-- Right Side / Main content container -->
        <div class="relative flex flex-col h-full w-full justify-between overflow-y-auto p-6 md:p-8">
          <!-- Close button -->
          <button
            type="button"
            class="absolute top-4 right-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-800 hover:text-white cursor-pointer"
            aria-label="Close"
            @click="emit('close')"
          >
            <X class="h-4.5 w-4.5" />
          </button>

          <!-- Core Body -->
          <div class="flex flex-col flex-1 justify-center w-full my-auto">
            <!-- Notices -->
            <div
              v-if="localNotice || notice"
              class="mb-4 flex gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 text-left"
            >
              <CheckCircle2 class="h-4 w-4 shrink-0 mt-0.5" />
              <span>{{ localNotice || notice }}</span>
            </div>

            <div
              v-if="error"
              class="mb-4 flex gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300 text-left"
            >
              <AlertCircle class="h-4 w-4 shrink-0 mt-0.5" />
              <span>{{ error }}</span>
            </div>

            <!-- Login Content -->
            <div v-if="isLogin" class="text-center w-full">
              <div class="mb-6">
                <span class="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Welcome back</span>
                <h2 class="text-3xl font-extrabold tracking-tight text-white mt-1">Sign in to Toolfolio.</h2>
                <p class="text-sm text-zinc-400 leading-relaxed mt-2 max-w-xs mx-auto">
                  Pick up where you left off with bookmarks, collections, and your account settings.
                </p>
              </div>

              <!-- Divider line (if form is hidden) -->
              <div v-if="!showEmailForm" class="relative flex py-2 items-center justify-center my-4 w-full">
                <div class="flex-grow border-t border-zinc-800/85"></div>
                <span class="flex-shrink mx-4 text-xxs font-semibold uppercase tracking-widest text-zinc-500">Sign in</span>
                <div class="flex-grow border-t border-zinc-800/85"></div>
              </div>

              <div class="w-full">
                <AuthOAuthButtons
                  v-if="!showEmailForm"
                  :disabled="disabled"
                  mode="login"
                  @oauth="(p) => emit('oauth', p)"
                  @continue-email="showEmailForm = true"
                />
                <AuthEmailForm
                  v-else
                  :disabled="disabled"
                  :loading="loading"
                  mode="login"
                  @submit="(c) => emit('submit', c)"
                  @request-password-reset="(email) => emit('requestPasswordReset', email)"
                />
              </div>
            </div>

            <!-- Signup Content -->
            <div v-else-if="isSignup" class="w-full">
              <div class="text-center mb-5">
                <h2 class="text-2xl md:text-2xl font-bold tracking-tight text-white leading-snug">
                  Know What's Next in AI and Software Before Everyone Else.
                </h2>
              </div>

              <!-- Feature Prop Badges -->
              <div class="grid grid-cols-2 gap-2 mb-6 w-full max-w-sm mx-auto">
                <div class="flex items-center gap-2 rounded-xl bg-white/5 border border-zinc-800/40 p-2.5 text-zinc-300">
                  <Sparkles class="h-4 w-4 text-zinc-400 shrink-0" />
                  <span class="text-[11px] font-medium leading-none">AI Search</span>
                </div>
                <div class="flex items-center gap-2 rounded-xl bg-white/5 border border-zinc-800/40 p-2.5 text-zinc-300">
                  <Mail class="h-4 w-4 text-zinc-400 shrink-0" />
                  <span class="text-[11px] font-medium leading-none font-sans">Weekly Newsletter</span>
                </div>
                <div class="flex items-center gap-2 rounded-xl bg-white/5 border border-zinc-800/40 p-2.5 text-zinc-300">
                  <Bookmark class="h-4 w-4 text-zinc-400 shrink-0" />
                  <span class="text-[11px] font-medium leading-none">Save Bookmarks</span>
                </div>
                <div class="flex items-center gap-2 rounded-xl bg-white/5 border border-zinc-800/40 p-2.5 text-zinc-300">
                  <FolderOpen class="h-4 w-4 text-zinc-400 shrink-0" />
                  <span class="text-[11px] font-medium leading-none">Create Collections</span>
                </div>
              </div>

              <!-- Divider line -->
              <div class="relative flex py-1 items-center justify-center my-4 w-full">
                <div class="flex-grow border-t border-zinc-800/85"></div>
                <span class="flex-shrink mx-3.5 text-xxs font-semibold uppercase tracking-widest text-zinc-500">Create a Free Account</span>
                <div class="flex-grow border-t border-zinc-800/85"></div>
              </div>

              <div class="w-full">
                <AuthOAuthButtons
                  v-if="!showEmailForm"
                  :disabled="disabled"
                  mode="signup"
                  @oauth="(p) => emit('oauth', p)"
                  @continue-email="showEmailForm = true"
                />
                <AuthEmailForm
                  v-else
                  :disabled="disabled"
                  :loading="loading"
                  mode="signup"
                  @submit="(c) => emit('submit', c)"
                />
              </div>
            </div>

            <!-- Password Reset Content -->
            <div v-else-if="isReset" class="w-full">
              <div class="text-center mb-6">
                <h2 class="text-2xl font-extrabold text-white">Reset password</h2>
                <p class="text-xs text-zinc-400 mt-2">
                  Enter your email address and we'll send you a password reset link.
                </p>
              </div>

              <div v-if="resetSubmitted" class="text-center py-4 text-sm text-emerald-400">
                Email link sent! Check your inbox.
              </div>
              <div v-else class="space-y-4">
                <div class="flex flex-col gap-1.5 text-left">
                  <label class="text-xs font-semibold uppercase tracking-widest text-zinc-500">Email Address</label>
                  <div class="relative">
                    <Mail class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      v-model="resetEmail"
                      data-testid="reset-email-input"
                      type="email"
                      required
                      class="h-12 w-full rounded-xl border border-zinc-800 bg-[#161414] pl-10 pr-4 text-sm text-white outline-none focus:border-zinc-700 transition"
                      placeholder="you@example.com"
                      :disabled="loading"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="reset-submit-button"
                  class="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white hover:bg-zinc-200 text-sm font-bold text-[#1f1f1f] transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  :disabled="loading || !resetEmail.trim()"
                  @click="handlePasswordReset"
                >
                  <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
                  <span>{{ loading ? 'Sending...' : 'Send Reset Link' }}</span>
                  <ArrowRight v-if="!loading" class="h-4 w-4" />
                </button>
              </div>

              <div class="mt-5 border-t border-zinc-800 pt-4 text-center">
                <button
                  type="button"
                  class="text-xs font-semibold uppercase tracking-widest text-zinc-400 hover:text-white transition cursor-pointer"
                  @click="emit('switchMode', 'login')"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          </div>

          <!-- Switch Mode Footer (Hidden in Password Reset) -->
          <div v-if="!isReset" class="mt-6 border-t border-zinc-800/80 pt-4 text-center">
            <p v-if="isLogin" class="text-xs text-zinc-400">
              New here?
              <button
                type="button"
                class="ml-1 font-semibold text-white hover:underline cursor-pointer"
                @click="emit('switchMode', 'signup')"
              >
                Create a free account
              </button>
            </p>
            <p v-else class="text-xs text-zinc-400">
              Already have an account?
              <button
                type="button"
                class="ml-1 font-semibold text-white hover:underline cursor-pointer"
                @click="emit('switchMode', 'login')"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.text-xxs {
  font-size: 0.65rem;
}
.auth-dialog-panel {
  max-height: min(640px, calc(100dvh - 2rem));
}

@media (max-width: 767px) {
  .auth-dialog-shell {
    padding: 0;
  }
  .auth-dialog-panel {
    max-height: 100dvh;
    height: 100dvh;
    width: 100%;
    border-radius: 0;
    border: none;
  }
  .auth-dialog-backdrop {
    display: none;
  }
}

/* Light Theme Styling mappings */
html.light .auth-dialog-panel {
  background-color: var(--mocha-surface) !important;
  border-color: var(--mocha-border) !important;
  color: var(--mocha-text) !important;
  box-shadow: 0 30px 90px rgba(75, 49, 28, 0.22);
}
html.light .text-white {
  color: var(--mocha-text) !important;
}
html.light .text-zinc-300 {
  color: var(--mocha-text-soft) !important;
}
html.light .text-zinc-400 {
  color: var(--mocha-text-soft) !important;
}
html.light .text-zinc-500 {
  color: var(--mocha-text-soft) !important;
}
html.light .border-zinc-800\/80,
html.light .border-zinc-800,
html.light .border-zinc-800\/85 {
  border-color: var(--mocha-border) !important;
}
html.light .bg-white\/5 {
  background-color: var(--mocha-surface-strong) !important;
  border-color: var(--mocha-border) !important;
}
html.light button.bg-white {
  background-color: var(--mocha-surface-strong) !important;
  color: var(--mocha-text) !important;
  border: 1px solid var(--mocha-border) !important;
}
html.light button.bg-white:hover {
  background-color: var(--mocha-surface-muted) !important;
}
html.light input {
  background-color: var(--mocha-surface) !important;
  border-color: var(--mocha-border) !important;
  color: var(--mocha-text) !important;
}
html.light .auth-dialog-backdrop {
  background-color: rgba(45, 33, 25, 0.34) !important;
}
</style>
