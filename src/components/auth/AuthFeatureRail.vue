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
  props.mode === 'signup' ? 'Claim your Holy Grail workspace' : 'Enter the curated workspace'
)

const subline = computed(() =>
  props.mode === 'signup'
    ? 'Keep the tools, skills, and references that matter close to your build flow.'
    : 'Your saved developer resources stay behind one Supabase-backed session.'
)

const checkpoints = [
  { icon: ShieldCheck, label: 'Supabase Auth', detail: 'Email and password session' },
  { icon: BookmarkCheck, label: 'Saved resources', detail: 'Ready for private collections' },
  { icon: Terminal, label: 'Builder-first', detail: 'Fast access inside the app shell' },
]
</script>

<template>
  <section
    class="relative hidden min-h-[620px] overflow-hidden border border-zinc-800 bg-[#050505] p-8 text-white lg:flex lg:flex-col lg:justify-between"
  >
    <div
      class="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:44px_44px]"
    ></div>
    <div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-400 to-transparent"></div>

    <div class="relative">
      <div class="mb-10 inline-flex items-center gap-2 border border-accent-500/30 bg-accent-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent-200">
        <Fingerprint class="h-3.5 w-3.5" />
        Auth Gate
      </div>

      <h1 class="max-w-md text-5xl font-bold leading-[1.02] tracking-normal text-white">
        {{ headline }}
      </h1>
      <p class="mt-5 max-w-sm text-sm leading-6 text-zinc-400">
        {{ subline }}
      </p>
    </div>

    <div class="relative space-y-4">
      <div class="grid grid-cols-3 gap-3">
        <div
          v-for="item in checkpoints"
          :key="item.label"
          class="border border-zinc-800 bg-black/70 p-4"
        >
          <component :is="item.icon" class="mb-4 h-5 w-5 text-accent-300" />
          <p class="text-sm font-semibold text-white">{{ item.label }}</p>
          <p class="mt-1 text-xs leading-5 text-zinc-500">{{ item.detail }}</p>
        </div>
      </div>

      <div class="border border-zinc-800 bg-zinc-950/80 p-5">
        <div class="flex items-start gap-4">
          <div class="flex h-10 w-10 items-center justify-center border border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
            <Braces class="h-5 w-5" />
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Session contract
            </p>
            <p class="mt-2 text-sm leading-6 text-zinc-300">
              The UI reads from one Pinia auth store, so navigation, guards, and account state move together.
            </p>
          </div>
        </div>
      </div>
    </div>

    <Sparkles class="absolute bottom-6 right-6 h-5 w-5 text-accent-400" />
  </section>
</template>
