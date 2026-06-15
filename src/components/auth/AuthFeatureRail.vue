<script setup lang="ts">
import { computed } from 'vue'
import {
  BookmarkCheck,
  Braces,
  Fingerprint,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-vue-next'
import type { AuthMode } from '@/types/auth'

const props = defineProps<{
  mode: AuthMode
}>()

const headline = computed(() =>
  props.mode === 'signup' ? 'Claim your Holy Grail workspace' : 'Enter the curated workspace',
)

const subline = computed(() =>
  props.mode === 'signup'
    ? 'Keep the tools, skills, and references that matter close to your build flow.'
    : 'Your saved developer resources stay behind one Supabase-backed session.',
)

const checkpoints = [
  { icon: ShieldCheck, label: 'Supabase Auth', detail: 'Email and password session' },
  { icon: BookmarkCheck, label: 'Saved resources', detail: 'Ready for private collections' },
  { icon: Terminal, label: 'Builder-first', detail: 'Fast access inside the app shell' },
]
</script>

<template>
  <section
    class="auth-feature-rail relative hidden min-h-[620px] overflow-hidden border border-zinc-800 bg-[#1f1f1f] p-8 text-white lg:flex lg:flex-col lg:justify-between"
  >
    <div
      class="auth-grid-overlay pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:44px_44px]"
    ></div>
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-400 to-transparent"
    ></div>

    <div class="relative">
      <div
        class="mb-10 inline-flex items-center gap-2 border border-accent-500/30 bg-accent-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent-200"
      >
        <Fingerprint class="h-3.5 w-3.5" />
        Auth Gate
      </div>

      <h1
        class="auth-feature-title max-w-md text-5xl font-bold leading-[1.02] tracking-normal text-white"
      >
        {{ headline }}
      </h1>
      <p class="auth-feature-copy mt-5 max-w-sm text-sm leading-6 text-zinc-400">
        {{ subline }}
      </p>
    </div>

    <div class="relative space-y-4">
      <div class="grid grid-cols-3 gap-3">
        <div
          v-for="item in checkpoints"
          :key="item.label"
          class="auth-feature-card border border-zinc-800 bg-[#1f1f1f]/70 p-4"
        >
          <component :is="item.icon" class="mb-4 h-5 w-5 text-accent-300" />
          <p class="auth-feature-card-title text-sm font-semibold text-white">{{ item.label }}</p>
          <p class="auth-feature-card-copy mt-1 text-xs leading-5 text-zinc-500">
            {{ item.detail }}
          </p>
        </div>
      </div>

      <div class="auth-session-card border border-zinc-800 bg-[#1f1f1f]/80 p-5">
        <div class="flex items-start gap-4">
          <div
            class="flex h-10 w-10 items-center justify-center border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          >
            <Braces class="h-5 w-5" />
          </div>
          <div>
            <p
              class="auth-session-label text-xs font-semibold uppercase tracking-widest text-zinc-500"
            >
              Session contract
            </p>
            <p class="auth-session-copy mt-2 text-sm leading-6 text-zinc-300">
              The UI reads from one Pinia auth store, so navigation, guards, and account state move
              together.
            </p>
          </div>
        </div>
      </div>
    </div>

    <Sparkles class="absolute bottom-6 right-6 h-5 w-5 text-accent-400" />
  </section>
</template>

<style scoped>
:global(html.light .auth-feature-rail) {
  border-color: var(--mocha-border) !important;
  background:
    linear-gradient(135deg, rgba(255, 250, 243, 0.96) 0%, rgba(245, 238, 230, 0.96) 100%),
    var(--mocha-surface) !important;
  color: var(--mocha-text) !important;
}

:global(html.light .auth-grid-overlay) {
  background-image:
    linear-gradient(90deg, rgba(168, 121, 85, 0.16) 1px, transparent 1px),
    linear-gradient(rgba(168, 121, 85, 0.16) 1px, transparent 1px) !important;
}

:global(html.light .auth-feature-title),
:global(html.light .auth-feature-card-title) {
  color: var(--mocha-text) !important;
}

:global(html.light .auth-feature-copy),
:global(html.light .auth-feature-card-copy),
:global(html.light .auth-session-copy) {
  color: var(--mocha-text-soft) !important;
}

:global(html.light .auth-feature-card),
:global(html.light .auth-session-card) {
  border-color: var(--mocha-border) !important;
  background: rgba(255, 250, 243, 0.88) !important;
}

:global(html.light .auth-session-label) {
  color: var(--mocha-muted) !important;
}
</style>
