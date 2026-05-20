<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import {
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Fingerprint,
  KeyRound,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const copied = shallowRef(false)

onMounted(() => {
  void auth.initialize()
})

const email = computed(() => auth.user?.email ?? 'No email')
const userId = computed(() => auth.user?.id ?? 'Unknown')
const provider = computed(() => {
  const providerValue = auth.user?.app_metadata?.provider
  return typeof providerValue === 'string' ? providerValue : 'email'
})
const confirmedAt = computed(() => {
  if (!auth.user?.confirmed_at) {
    return 'Pending'
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(auth.user.confirmed_at))
})

async function copyUserId() {
  if (!auth.user?.id || !navigator.clipboard) {
    return
  }

  await navigator.clipboard.writeText(auth.user.id)
  copied.value = true

  window.setTimeout(() => {
    copied.value = false
  }, 1400)
}

async function handleSignOut() {
  const result = await auth.signOut()

  if (result.ok) {
    await router.push({ name: 'login' })
  }
}
</script>

<template>
  <div class="min-h-full bg-black text-white">
    <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div class="mb-8 flex flex-col gap-5 border-b border-zinc-800 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-accent-300">
            Account
          </p>
          <h1 class="text-4xl font-bold tracking-normal text-white">Your Holy Grail session</h1>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Session state is handled by Supabase Auth and mirrored through the app shell.
          </p>
        </div>

        <button
          type="button"
          class="inline-flex h-10 items-center justify-center gap-2 border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 transition hover:border-red-300 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="auth.loading"
          @click="handleSignOut"
        >
          <LogOut class="h-4 w-4" />
          Sign out
        </button>
      </div>

      <div class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section class="border border-zinc-800 bg-[#060606] p-6">
          <div class="flex items-start gap-4">
            <div class="flex h-16 w-16 items-center justify-center border border-accent-500/30 bg-accent-500/10 text-2xl font-bold text-accent-100">
              {{ auth.avatarInitial }}
            </div>
            <div class="min-w-0">
              <p class="text-xl font-bold text-white">{{ auth.displayName }}</p>
              <p class="mt-1 truncate text-sm text-zinc-500">{{ email }}</p>
              <div class="mt-4 inline-flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-100">
                <CheckCircle2 class="h-3.5 w-3.5" />
                Authenticated
              </div>
            </div>
          </div>

          <div class="mt-8 space-y-3">
            <div class="flex items-center gap-3 border border-zinc-800 bg-black px-4 py-3">
              <Mail class="h-4 w-4 text-accent-300" />
              <div class="min-w-0">
                <p class="text-xs uppercase tracking-widest text-zinc-500">Email</p>
                <p class="truncate text-sm text-zinc-200">{{ email }}</p>
              </div>
            </div>

            <div class="flex items-center gap-3 border border-zinc-800 bg-black px-4 py-3">
              <KeyRound class="h-4 w-4 text-emerald-300" />
              <div>
                <p class="text-xs uppercase tracking-widest text-zinc-500">Provider</p>
                <p class="text-sm capitalize text-zinc-200">{{ provider }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="border border-zinc-800 bg-[#060606] p-6">
          <div class="mb-5 flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Session details
              </p>
              <h2 class="mt-2 text-2xl font-bold text-white">Supabase identity</h2>
            </div>
            <ShieldCheck class="h-6 w-6 text-accent-300" />
          </div>

          <div class="space-y-4">
            <div class="border border-zinc-800 bg-black p-4">
              <div class="mb-2 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  <Fingerprint class="h-3.5 w-3.5" />
                  User ID
                </div>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 transition hover:text-white"
                  @click="copyUserId"
                >
                  <ClipboardCheck v-if="copied" class="h-3.5 w-3.5 text-emerald-300" />
                  <Copy v-else class="h-3.5 w-3.5" />
                  {{ copied ? 'Copied' : 'Copy' }}
                </button>
              </div>
              <p class="break-all font-mono text-sm text-zinc-200">{{ userId }}</p>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="border border-zinc-800 bg-black p-4">
                <p class="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Confirmed
                </p>
                <p class="mt-2 text-sm text-zinc-200">{{ confirmedAt }}</p>
              </div>
              <div class="border border-zinc-800 bg-black p-4">
                <p class="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Session source
                </p>
                <p class="mt-2 text-sm text-zinc-200">Browser storage</p>
              </div>
            </div>

            <div class="border border-zinc-800 bg-zinc-950 p-4">
              <div class="flex gap-3">
                <UserRound class="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-300" />
                <p class="text-sm leading-6 text-zinc-400">
                  Authorization must still be enforced in Supabase policies and server-side checks for private data.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
