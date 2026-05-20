<script setup lang="ts">
import { shallowRef } from 'vue'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Globe,
  Loader2,
  Send,
  Sparkles,
} from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error'

const status = shallowRef<SubmitStatus>('idle')
const errorMessage = shallowRef<string | null>(null)

const name = shallowRef('')
const url = shallowRef('')
const description = shallowRef('')
const category = shallowRef('')
const submitterNote = shallowRef('')

const CATEGORIES = [
  'Platforms',
  'AI – Image',
  'AI – API',
  'AI – Automation',
  'AI – Chat',
  'AI – Video',
  'AI – Other',
  'Design – Inspiration',
  'Design – Fonts',
  'Design – Icons/SVG',
  'Design – Tools',
  'Development – Learning',
  'Development – References',
  'Development – Tooling',
  'Development – Repositories',
  'Development – MCP',
  'Development – Monitoring',
  'CLI Tools',
  'UI Libraries',
  'Skills',
  'Other',
]

function validateForm(): string | null {
  if (!name.value.trim()) return 'Name is required.'
  if (!url.value.trim()) return 'URL is required.'
  if (!/^https?:\/\/.+/.test(url.value.trim())) return 'URL must start with http:// or https://.'
  if (!description.value.trim()) return 'Description is required.'
  if (!category.value) return 'Please select a category.'
  return null
}

async function handleSubmit() {
  const validationError = validateForm()
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  if (!supabase) {
    errorMessage.value = 'Supabase is not configured. Add env vars to .env.local.'
    return
  }

  status.value = 'loading'
  errorMessage.value = null

  try {
    const { error } = await supabase.from('submissions').insert({
      name: name.value.trim(),
      url: url.value.trim(),
      description: description.value.trim(),
      category: category.value,
      submitter_note: submitterNote.value.trim() || null,
      submitted_by: auth.user?.id ?? null,
      submitted_by_email: auth.user?.email ?? null,
      status: 'pending',
    })

    if (error) throw error

    status.value = 'success'
    name.value = ''
    url.value = ''
    description.value = ''
    category.value = ''
    submitterNote.value = ''
  } catch (err) {
    status.value = 'error'
    errorMessage.value = err instanceof Error ? err.message : 'Submission failed. Please try again.'
  }
}

function resetForm() {
  status.value = 'idle'
  errorMessage.value = null
}
</script>

<template>
  <div class="min-h-full bg-black text-white">
    <div class="mx-auto max-w-3xl px-6 py-10">
      <!-- Header -->
      <div class="mb-10 border-b border-gray-800 pb-8">
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-accent-300">
          Community
        </p>
        <h1 class="text-4xl font-bold tracking-normal text-white">Submit a Tool</h1>
        <p class="mt-3 max-w-xl text-sm leading-6 text-gray-400">
          Know a site, platform, or skill worth adding to Holy Grail? Submit it here. Every
          submission is reviewed before going live.
        </p>
      </div>

      <!-- Success State -->
      <div
        v-if="status === 'success'"
        class="border border-emerald-400/30 bg-emerald-400/10 p-8 text-center"
      >
        <CheckCircle2 class="mx-auto mb-4 h-12 w-12 text-emerald-400" />
        <h2 class="mb-2 text-2xl font-bold text-white">Submission received</h2>
        <p class="mb-6 text-sm leading-6 text-gray-400">
          Thanks for contributing. The team will review your submission and add it if it's a good
          fit.
        </p>
        <button
          type="button"
          class="inline-flex h-10 items-center gap-2 border border-gray-700 px-5 text-sm font-semibold text-gray-200 transition hover:border-accent-400 hover:text-accent-100"
          @click="resetForm"
        >
          Submit another
        </button>
      </div>

      <!-- Form -->
      <form v-else class="space-y-6" @submit.prevent="handleSubmit">
        <!-- Error -->
        <div
          v-if="errorMessage"
          class="flex gap-3 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-100"
        >
          <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Name -->
        <label class="block">
          <span class="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Tool / Site Name <span class="text-red-400">*</span>
          </span>
          <input
            v-model="name"
            type="text"
            placeholder="e.g. Coolify"
            :disabled="status === 'loading'"
            class="h-12 w-full border border-zinc-700 bg-black px-4 text-sm text-white outline-none transition focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <!-- URL -->
        <label class="block">
          <span class="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
            URL <span class="text-red-400">*</span>
          </span>
          <span class="relative block">
            <Globe class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              v-model="url"
              type="url"
              placeholder="https://example.com"
              :disabled="status === 'loading'"
              class="h-12 w-full border border-zinc-700 bg-black pl-10 pr-4 text-sm text-white outline-none transition focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </span>
        </label>

        <!-- Category -->
        <label class="block">
          <span class="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Category <span class="text-red-400">*</span>
          </span>
          <select
            v-model="category"
            :disabled="status === 'loading'"
            class="h-12 w-full border border-zinc-700 bg-black px-4 text-sm text-white outline-none transition focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="" disabled>Select a category…</option>
            <option v-for="cat in CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </label>

        <!-- Description -->
        <label class="block">
          <span class="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Short Description <span class="text-red-400">*</span>
          </span>
          <textarea
            v-model="description"
            rows="3"
            placeholder="What does it do? Why is it useful?"
            :disabled="status === 'loading'"
            class="w-full resize-none border border-zinc-700 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
          ></textarea>
        </label>

        <!-- Note -->
        <label class="block">
          <span class="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Note for reviewers
            <span class="ml-1 font-normal normal-case tracking-normal text-zinc-600">optional</span>
          </span>
          <textarea
            v-model="submitterNote"
            rows="2"
            placeholder="Anything the reviewer should know…"
            :disabled="status === 'loading'"
            class="w-full resize-none border border-zinc-700 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
          ></textarea>
        </label>

        <!-- Auth notice -->
        <div
          v-if="!auth.isAuthenticated"
          class="flex gap-3 border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100"
        >
          <Sparkles class="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
          <span>
            You're submitting anonymously.
            <RouterLink to="/login" class="ml-1 font-semibold underline hover:text-white">
              Sign in
            </RouterLink>
            to attach your account to the submission.
          </span>
        </div>

        <button
          type="submit"
          :disabled="status === 'loading'"
          class="flex h-12 w-full items-center justify-center gap-2 bg-white px-4 text-sm font-bold text-black transition hover:bg-accent-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Loader2 v-if="status === 'loading'" class="h-4 w-4 animate-spin" />
          <Send v-else class="h-4 w-4" />
          <span>{{ status === 'loading' ? 'Submitting…' : 'Submit for review' }}</span>
          <ArrowRight v-if="status !== 'loading'" class="h-4 w-4" />
        </button>
      </form>
    </div>
  </div>
</template>
