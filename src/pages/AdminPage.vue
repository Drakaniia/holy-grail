<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from 'lucide-vue-next'
import { useAdminStore, type SubmissionStatus } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const admin = useAdminStore()
const router = useRouter()

type FilterTab = 'all' | SubmissionStatus
const activeTab = shallowRef<FilterTab>('pending')

const TABS: { label: string; value: FilterTab }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' },
]

const displaySubmissions = computed(() => {
  if (activeTab.value === 'all') return admin.submissions
  return admin.submissions.filter(s => s.status === activeTab.value)
})

onMounted(async () => {
  await auth.initialize()

  if (!auth.isAuthenticated) {
    await router.push({ name: 'login', query: { redirect: '/admin' } })
    return
  }

  if (!admin.isAdmin) return

  await admin.loadSubmissions()
})

async function approve(id: string) {
  await admin.updateSubmissionStatus(id, 'approved')
}

async function reject(id: string) {
  await admin.updateSubmissionStatus(id, 'rejected')
}

async function remove(id: string) {
  await admin.deleteSubmission(id)
}

function statusClass(status: SubmissionStatus) {
  switch (status) {
    case 'approved':
      return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
    case 'rejected':
      return 'border-red-400/30 bg-red-400/10 text-red-200'
    default:
      return 'border-amber-400/30 bg-amber-400/10 text-amber-200'
  }
}
</script>

<template>
  <div class="min-h-full bg-black text-white">
    <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <!-- Header -->
      <div class="mb-8 border-b border-gray-800 pb-8">
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-accent-300">
          Admin
        </p>
        <h1 class="text-3xl font-bold tracking-normal text-white sm:text-4xl">Submissions</h1>
        <p class="mt-3 text-sm leading-6 text-gray-400">
          Review, approve, or reject community-submitted tools.
        </p>
      </div>

      <!-- Not admin -->
      <div
        v-if="!admin.isAdmin"
        class="flex flex-col items-center justify-center py-24 text-center"
      >
        <ShieldAlert class="mb-4 h-12 w-12 text-red-400" />
        <h2 class="mb-2 text-2xl font-bold text-white">Access denied</h2>
        <p class="text-sm text-gray-400">
          This page is restricted to admins. Your account does not have the
          <code class="mx-1 rounded bg-zinc-900 px-1.5 py-0.5 text-xs text-accent-300">admin</code>
          role.
        </p>
      </div>

      <template v-else>
        <!-- Error -->
        <div
          v-if="admin.actionError"
          class="mb-6 flex gap-3 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100"
        >
          <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
          {{ admin.actionError }}
        </div>

        <!-- Tabs -->
        <div class="mb-6 flex w-full items-center gap-1 overflow-x-auto border border-gray-700 p-1 sm:w-fit">
          <button
            v-for="tab in TABS"
            :key="tab.value"
            type="button"
            class="shrink-0 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition"
            :class="
              activeTab === tab.value
                ? 'bg-zinc-800 text-white'
                : 'text-gray-500 hover:text-gray-300'
            "
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
            <span
              v-if="tab.value === 'pending' && admin.pendingCount > 0"
              class="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black"
            >
              {{ admin.pendingCount }}
            </span>
          </button>
        </div>

        <!-- Loading -->
        <div v-if="admin.loading && displaySubmissions.length === 0" class="flex items-center justify-center py-20">
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <Sparkles class="h-5 w-5 animate-pulse text-accent-300" />
            Loading submissions…
          </div>
        </div>

        <!-- Empty -->
        <div
          v-else-if="displaySubmissions.length === 0"
          class="border border-gray-800 bg-[#060606] px-6 py-16 text-center"
        >
          <CheckCircle2 class="mx-auto mb-4 h-10 w-10 text-gray-600" />
          <p class="text-gray-500">No submissions in this category.</p>
        </div>

        <!-- List -->
        <div v-else class="space-y-4">
          <article
            v-for="sub in displaySubmissions"
            :key="sub.id"
            class="border border-gray-800 bg-[#060606] p-5"
          >
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0 flex-1">
                <!-- Status + category -->
                <div class="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    class="border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
                    :class="statusClass(sub.status)"
                  >
                    {{ sub.status }}
                  </span>
                  <span class="text-xs text-gray-500">{{ sub.category }}</span>
                </div>

                <!-- Name + URL -->
                <h2 class="mb-1 text-lg font-bold text-white">{{ sub.name }}</h2>
                <a
                  :href="sub.url"
                  target="_blank"
                  rel="noopener noreferrer"
                class="mb-3 inline-flex max-w-full items-center gap-1 break-all text-xs text-accent-400 hover:text-accent-300"
                >
                  {{ sub.url }}
                  <ExternalLink class="h-3 w-3" />
                </a>

                <!-- Description -->
                <p class="mb-3 text-sm leading-6 text-gray-400">{{ sub.description }}</p>

                <!-- Note -->
                <p v-if="sub.submitter_note" class="mb-3 text-xs italic text-gray-500">
                  Note: {{ sub.submitter_note }}
                </p>

                <!-- Meta -->
                <div class="flex flex-wrap gap-4 text-xs text-gray-600">
                  <span v-if="sub.submitted_by_email">By {{ sub.submitted_by_email }}</span>
                  <span>{{ new Date(sub.created_at).toLocaleDateString() }}</span>
                  <span v-if="sub.reviewed_at">
                    Reviewed {{ new Date(sub.reviewed_at).toLocaleDateString() }}
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex flex-shrink-0 items-center gap-2">
                <button
                  v-if="sub.status !== 'approved'"
                  type="button"
                  :disabled="admin.loading"
                  class="inline-flex h-9 items-center gap-1.5 border border-emerald-400/30 bg-emerald-400/10 px-3 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                  @click="approve(sub.id)"
                >
                  <Check class="h-3.5 w-3.5" />
                  Approve
                </button>

                <button
                  v-if="sub.status !== 'rejected'"
                  type="button"
                  :disabled="admin.loading"
                  class="inline-flex h-9 items-center gap-1.5 border border-red-400/30 bg-red-400/10 px-3 text-xs font-semibold text-red-200 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                  @click="reject(sub.id)"
                >
                  <X class="h-3.5 w-3.5" />
                  Reject
                </button>

                <button
                  type="button"
                  :disabled="admin.loading"
                  class="inline-flex h-9 w-9 items-center justify-center border border-gray-800 text-gray-500 transition hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Delete submission"
                  @click="remove(sub.id)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        </div>
      </template>
    </div>
  </div>
</template>
