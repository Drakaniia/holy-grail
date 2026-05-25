<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Trash2,
  X,
} from 'lucide-vue-next'
import { useAdminStore, type SubmissionStatus } from '@/stores/admin'

const admin = useAdminStore()

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
  return admin.submissions.filter(submission => submission.status === activeTab.value)
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
  <section aria-labelledby="admin-submissions-title">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-300">
          Submission Queue
        </p>
        <h2 id="admin-submissions-title" class="text-2xl font-bold text-white">
          Review pipeline
        </h2>
      </div>

      <div class="grid grid-cols-3 border border-gray-800 bg-[#050505] text-center text-xs">
        <div class="border-r border-gray-800 px-4 py-3">
          <p class="font-bold text-amber-200">{{ admin.pendingCount }}</p>
          <p class="mt-1 uppercase tracking-widest text-gray-600">Pending</p>
        </div>
        <div class="border-r border-gray-800 px-4 py-3">
          <p class="font-bold text-emerald-200">{{ admin.approvedCount }}</p>
          <p class="mt-1 uppercase tracking-widest text-gray-600">Approved</p>
        </div>
        <div class="px-4 py-3">
          <p class="font-bold text-red-200">{{ admin.rejectedCount }}</p>
          <p class="mt-1 uppercase tracking-widest text-gray-600">Rejected</p>
        </div>
      </div>
    </div>

    <div
      v-if="admin.actionError"
      class="mb-6 flex gap-3 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100"
    >
      <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
      {{ admin.actionError }}
    </div>

    <div
      class="mb-6 flex w-full items-center gap-1 overflow-x-auto border border-gray-700 p-1 sm:w-fit"
    >
      <button
        v-for="tab in TABS"
        :key="tab.value"
        type="button"
        class="shrink-0 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition"
        :class="
          activeTab === tab.value ? 'bg-zinc-800 text-white' : 'text-gray-500 hover:text-gray-300'
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

    <div
      v-if="admin.loading && displaySubmissions.length === 0"
      class="flex items-center justify-center py-20"
    >
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <Sparkles class="h-5 w-5 animate-pulse text-accent-300" />
        Loading submissions...
      </div>
    </div>

    <div
      v-else-if="displaySubmissions.length === 0"
      class="border border-gray-800 bg-[#060606] px-6 py-16 text-center"
    >
      <CheckCircle2 class="mx-auto mb-4 h-10 w-10 text-gray-600" />
      <p class="text-gray-500">No submissions in this category.</p>
    </div>

    <div v-else class="space-y-4">
      <article
        v-for="sub in displaySubmissions"
        :key="sub.id"
        class="border border-gray-800 bg-[#060606] p-5"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0 flex-1">
            <div class="mb-3 flex flex-wrap items-center gap-2">
              <span
                class="border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
                :class="statusClass(sub.status)"
              >
                {{ sub.status }}
              </span>
              <span class="text-xs text-gray-500">{{ sub.category }}</span>
            </div>

            <h3 class="mb-1 text-lg font-bold text-white">{{ sub.name }}</h3>
            <a
              :href="sub.url"
              target="_blank"
              rel="noopener noreferrer"
              class="mb-3 inline-flex max-w-full items-center gap-1 break-all text-xs text-accent-400 hover:text-accent-300"
            >
              {{ sub.url }}
              <ExternalLink class="h-3 w-3" />
            </a>

            <p class="mb-3 text-sm leading-6 text-gray-400">{{ sub.description }}</p>

            <p v-if="sub.submitter_note" class="mb-3 text-xs italic text-gray-500">
              Note: {{ sub.submitter_note }}
            </p>

            <div class="flex flex-wrap gap-4 text-xs text-gray-600">
              <span v-if="sub.submitted_by_email">By {{ sub.submitted_by_email }}</span>
              <span>{{ new Date(sub.created_at).toLocaleDateString() }}</span>
              <span v-if="sub.reviewed_at">
                Reviewed {{ new Date(sub.reviewed_at).toLocaleDateString() }}
              </span>
            </div>
          </div>

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
  </section>
</template>
