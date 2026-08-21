<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { RouterLink } from 'vue-router'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-vue-next'
import {
  useAdminStore,
  type SiteIssueReport,
  type SiteIssueStatus,
  type SiteIssueType,
} from '@/stores/admin'

const admin = useAdminStore()

type FilterTab = 'all' | SiteIssueStatus
const activeTab = shallowRef<FilterTab>('open')

const TABS: { label: string; value: FilterTab }[] = [
  { label: 'Open', value: 'open' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Ignored', value: 'ignored' },
  { label: 'All', value: 'all' },
]

const ISSUE_LABELS: Record<SiteIssueType, string> = {
  deprecated: 'Legacy',
  down: 'Not working',
  other: 'Other',
  'wrong-url': 'Wrong URL',
}

const displayReports = computed(() => {
  if (activeTab.value === 'all') return admin.siteIssueReports
  return admin.siteIssueReports.filter((report) => report.status === activeTab.value)
})

async function resolve(id: string) {
  await admin.updateSiteIssueStatus(id, 'resolved')
}

async function ignore(id: string) {
  await admin.updateSiteIssueStatus(id, 'ignored')
}

async function reopen(id: string) {
  await admin.updateSiteIssueStatus(id, 'open')
}

async function remove(id: string) {
  await admin.deleteSiteIssueReport(id)
}

function getTabCount(value: FilterTab) {
  switch (value) {
    case 'open':
      return admin.openSiteIssueCount
    case 'resolved':
      return admin.resolvedSiteIssueCount
    case 'ignored':
      return admin.ignoredSiteIssueCount
    default:
      return admin.siteIssueReports.length
  }
}

function statusClass(status: SiteIssueStatus) {
  switch (status) {
    case 'resolved':
      return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
    case 'ignored':
      return 'border-zinc-500/40 bg-zinc-500/10 text-zinc-300'
    default:
      return 'border-amber-400/30 bg-amber-400/10 text-amber-200'
  }
}

function issueClass(issueType: SiteIssueType) {
  switch (issueType) {
    case 'deprecated':
      return 'border-violet-300/30 bg-violet-400/10 text-violet-200'
    case 'wrong-url':
      return 'border-sky-300/30 bg-sky-400/10 text-sky-200'
    case 'other':
      return 'border-gray-500/40 bg-gray-500/10 text-gray-300'
    default:
      return 'border-red-400/30 bg-red-400/10 text-red-200'
  }
}

function getAdminHandoff(report: SiteIssueReport) {
  switch (report.issue_type) {
    case 'deprecated':
      return 'Legacy signal. Check whether this should stay as an archive, be replaced with a newer product, or be removed from the catalog.'
    case 'wrong-url':
      return 'URL correction needed. Verify the canonical destination, update the YAML, then regenerate the static preview if the URL changes.'
    case 'other':
      return 'Manual triage needed. Use the live URL and catalog page to decide the cleanup path.'
    default:
      return 'Availability check needed. If the site is dead or blocked, update the catalog entry and preview state before resolving.'
  }
}

function formatDate(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleDateString()
}
</script>

<template>
  <section aria-labelledby="admin-site-issues-title">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-300">
          Site Issues
        </p>
        <h2 id="admin-site-issues-title" class="text-2xl font-bold text-white">
          Broken and legacy site triage
        </h2>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          Reports from site detail pages land here, including not-working, legacy, wrong URL, and
          other catalog cleanup signals.
        </p>
      </div>

      <div class="grid grid-cols-3 border border-gray-800 bg-[#1f1f1f] text-center text-xs">
        <div class="border-r border-gray-800 px-4 py-3">
          <p class="font-bold text-amber-200">{{ admin.openSiteIssueCount }}</p>
          <p class="mt-1 uppercase tracking-widest text-gray-600">Open</p>
        </div>
        <div class="border-r border-gray-800 px-4 py-3">
          <p class="font-bold text-violet-200">{{ admin.legacySiteIssueCount }}</p>
          <p class="mt-1 uppercase tracking-widest text-gray-600">Legacy</p>
        </div>
        <div class="px-4 py-3">
          <p class="font-bold text-emerald-200">{{ admin.resolvedSiteIssueCount }}</p>
          <p class="mt-1 uppercase tracking-widest text-gray-600">Resolved</p>
        </div>
      </div>
    </div>

    <div
      v-if="admin.siteIssueError"
      class="mb-6 flex gap-3 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100"
    >
      <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
      {{ admin.siteIssueError }}
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
          activeTab === tab.value ? 'bg-[#1f1f1f] text-white' : 'text-gray-500 hover:text-gray-300'
        "
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
        <span
          v-if="getTabCount(tab.value) > 0"
          class="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-[#1f1f1f]"
        >
          {{ getTabCount(tab.value) }}
        </span>
      </button>
    </div>

    <div
      v-if="admin.loadingSiteIssues && displayReports.length === 0"
      class="space-y-4"
      aria-busy="true"
      aria-label="Loading site issue reports"
    >
      <div
        v-for="index in 3"
        :key="index"
        class="h-44 animate-pulse border border-gray-800 bg-[#1f1f1f]"
      />
    </div>

    <div
      v-else-if="displayReports.length === 0"
      class="border border-gray-800 bg-[#1f1f1f] px-6 py-16 text-center"
    >
      <CheckCircle2 class="mx-auto mb-4 h-10 w-10 text-gray-600" />
      <p class="text-gray-500">No site issues in this category.</p>
    </div>

    <div v-else class="space-y-4">
      <article
        v-for="report in displayReports"
        :key="report.id"
        class="border border-gray-800 bg-[#1f1f1f] p-5"
      >
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0 flex-1">
            <div class="mb-3 flex flex-wrap items-center gap-2">
              <span
                class="border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
                :class="statusClass(report.status)"
              >
                {{ report.status }}
              </span>
              <span
                class="border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest"
                :class="issueClass(report.issue_type)"
              >
                {{ ISSUE_LABELS[report.issue_type] }}
              </span>
              <span v-if="report.category" class="text-xs text-gray-500">
                {{ report.category }}
              </span>
            </div>

            <h3 class="mb-1 text-lg font-bold text-white">{{ report.name }}</h3>
            <div class="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <a
                :href="report.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex max-w-full items-center gap-1 break-all text-xs text-accent-400 hover:text-accent-300"
              >
                {{ report.url }}
                <ExternalLink class="h-3 w-3" />
              </a>
              <RouterLink
                :to="`/sites/${report.slug}`"
                class="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-white"
              >
                Catalog page
                <ExternalLink class="h-3 w-3" />
              </RouterLink>
            </div>

            <p v-if="report.note" class="mb-3 text-sm italic leading-6 text-gray-500">
              Note: {{ report.note }}
            </p>

            <div class="mb-3 border border-gray-800 bg-[#1f1f1f]/50 px-3 py-2">
              <p class="text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                Admin handoff
              </p>
              <p class="mt-1 text-xs leading-5 text-gray-400">
                {{ getAdminHandoff(report) }}
              </p>
            </div>

            <div class="flex flex-wrap gap-4 text-xs text-gray-600">
              <span>Slug {{ report.slug }}</span>
              <span v-if="report.reporter_email">By {{ report.reporter_email }}</span>
              <span>Reported {{ formatDate(report.created_at) }}</span>
              <span v-if="report.resolved_at"> Reviewed {{ formatDate(report.resolved_at) }} </span>
            </div>
          </div>

          <div class="flex flex-shrink-0 flex-wrap items-center gap-2">
            <button
              v-if="report.status !== 'resolved'"
              type="button"
              :disabled="admin.loadingSiteIssues"
              class="inline-flex h-9 items-center gap-1.5 border border-emerald-400/30 bg-emerald-400/10 px-3 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              @click="resolve(report.id)"
            >
              <Check class="h-3.5 w-3.5" />
              Resolve
            </button>

            <button
              v-if="report.status !== 'ignored'"
              type="button"
              :disabled="admin.loadingSiteIssues"
              class="inline-flex h-9 items-center gap-1.5 border border-zinc-600 bg-[#1f1f1f] px-3 text-xs font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              @click="ignore(report.id)"
            >
              <X class="h-3.5 w-3.5" />
              Ignore
            </button>

            <button
              v-if="report.status !== 'open'"
              type="button"
              :disabled="admin.loadingSiteIssues"
              class="inline-flex h-9 items-center gap-1.5 border border-amber-400/30 bg-amber-400/10 px-3 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              @click="reopen(report.id)"
            >
              <RotateCcw class="h-3.5 w-3.5" />
              Reopen
            </button>

            <button
              type="button"
              :disabled="admin.loadingSiteIssues"
              class="inline-flex h-9 w-9 items-center justify-center border border-gray-800 text-gray-500 transition hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Delete site issue report"
              @click="remove(report.id)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
