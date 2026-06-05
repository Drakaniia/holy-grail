<script setup lang="ts">
import { computed } from 'vue'
import {
  AlertCircle,
  Bookmark,
  Database,
  Eye,
  Globe2,
  MousePointerClick,
  RefreshCcw,
  Search,
  UserPlus,
  Users,
} from 'lucide-vue-next'
import AdminAnalyticsSkeleton from '@/components/admin/AdminAnalyticsSkeleton.vue'
import { useAdminStore, type AnalyticsRange, type AnalyticsTopItem } from '@/stores/admin'

const admin = useAdminStore()

const rangeOptions: { label: string; value: AnalyticsRange }[] = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
  { label: 'All', value: 'all' },
]

const numberFormatter = new Intl.NumberFormat('en')

const summary = computed(() => admin.analyticsSummary)
const maxDailyActivity = computed(() =>
  Math.max(
    1,
    ...summary.value.daily.map(
      point => point.pageViews + point.searches + point.outboundClicks,
    ),
  ),
)

const metrics = computed(() => [
  {
    icon: Users,
    label: 'Unique visitors',
    tone: 'text-cyan-200',
    value: formatNumber(summary.value.visitors),
  },
  {
    icon: Eye,
    label: 'Page views',
    tone: 'text-accent-200',
    value: formatNumber(summary.value.pageViews),
  },
  {
    icon: Search,
    label: 'Searches',
    tone: 'text-emerald-200',
    value: formatNumber(summary.value.searches),
  },
  {
    icon: MousePointerClick,
    label: 'Outbound clicks',
    tone: 'text-sky-200',
    value: formatNumber(summary.value.outboundClicks),
  },
  {
    icon: UserPlus,
    label: 'Tracked signups',
    tone: 'text-violet-200',
    value: formatNumber(summary.value.signups),
  },
  {
    icon: Bookmark,
    label: 'Bookmarks',
    tone: 'text-yellow-200',
    value:
      admin.optionalCounts.bookmarks === null
        ? formatNumber(summary.value.bookmarkEvents)
        : formatNumber(admin.optionalCounts.bookmarks),
  },
  {
    icon: Globe2,
    label: 'Site detail views',
    tone: 'text-lime-200',
    value: formatNumber(summary.value.siteViews),
  },
  {
    icon: Database,
    label: 'Events loaded',
    tone: 'text-zinc-200',
    value: formatNumber(summary.value.totalEvents),
  },
])

const topSections = computed<
  {
    empty: string
    items: AnalyticsTopItem[]
    title: string
  }[]
>(() => [
  {
    empty: 'No page views yet.',
    items: summary.value.topPages,
    title: 'Top pages',
  },
  {
    empty: 'No site views yet.',
    items: summary.value.topSites,
    title: 'Top sites',
  },
  {
    empty: 'No search terms yet.',
    items: summary.value.topSearches,
    title: 'Top searches',
  },
  {
    empty: 'No outgoing clicks yet.',
    items: summary.value.topOutboundLinks,
    title: 'Top external links',
  },
  {
    empty: 'No device data yet.',
    items: summary.value.devices,
    title: 'Devices',
  },
  {
    empty: 'No referrers yet.',
    items: summary.value.referrers,
    title: 'Referrers',
  },
])

function formatNumber(value: number) {
  return numberFormatter.format(value)
}

function getDailyTotal(index: number) {
  const point = summary.value.daily[index]
  return point.pageViews + point.searches + point.outboundClicks
}

function getBarHeight(index: number) {
  const total = getDailyTotal(index)
  if (total === 0) return '2px'

  return `${Math.max(8, (total / maxDailyActivity.value) * 100)}%`
}

function getBarTitle(index: number) {
  const point = summary.value.daily[index]
  return `${point.label}: ${formatNumber(point.pageViews)} views, ${formatNumber(
    point.searches,
  )} searches, ${formatNumber(point.outboundClicks)} clicks`
}

async function refreshAnalytics() {
  await admin.loadAnalytics()
  await admin.loadOptionalCounts()
}
</script>

<template>
  <section aria-labelledby="admin-analytics-title">
    <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-300">
          Analytics
        </p>
        <h2 id="admin-analytics-title" class="text-2xl font-bold text-white">
          Visitor operations
        </h2>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center gap-1 border border-gray-800 bg-[#1f1f1f] p-1">
          <button
            v-for="range in rangeOptions"
            :key="range.label"
            type="button"
            class="h-8 px-3 text-xs font-semibold uppercase tracking-widest transition"
            :class="
              admin.analyticsRange === range.value
                ? 'bg-accent-600 text-white'
                : 'text-gray-500 hover:text-gray-300'
            "
            @click="admin.loadAnalytics(range.value)"
          >
            {{ range.label }}
          </button>
        </div>

        <button
          type="button"
          class="inline-flex h-10 items-center gap-2 border border-gray-800 px-3 text-xs font-semibold uppercase tracking-widest text-gray-400 transition hover:border-accent-500/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="admin.loadingAnalytics"
          @click="refreshAnalytics"
        >
          <RefreshCcw class="h-4 w-4" :class="{ 'animate-spin': admin.loadingAnalytics }" />
          Refresh
        </button>
      </div>
    </div>

    <div
      v-if="admin.analyticsError"
      class="mb-6 flex gap-3 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100"
    >
      <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
      {{ admin.analyticsError }}
    </div>

    <div
      v-if="admin.loadingAnalytics && admin.analyticsEvents.length === 0"
      aria-busy="true"
      aria-label="Loading analytics"
    >
      <AdminAnalyticsSkeleton />
    </div>

    <template v-else>
      <div class="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="metric in metrics"
          :key="metric.label"
          class="border border-gray-800 bg-[#1f1f1f] p-4"
        >
          <div class="mb-5 flex items-center justify-between gap-3">
            <p class="min-w-0 truncate text-xs font-semibold uppercase tracking-widest text-gray-500">
              {{ metric.label }}
            </p>
            <component :is="metric.icon" class="h-4 w-4 shrink-0" :class="metric.tone" />
          </div>
          <p class="text-3xl font-bold tracking-normal text-white">{{ metric.value }}</p>
        </article>
      </div>

      <div class="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <section class="border border-gray-800 bg-[#1f1f1f] p-5" aria-labelledby="activity-title">
          <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Activity
              </p>
              <h3 id="activity-title" class="mt-1 text-lg font-bold text-white">
                Daily signal
              </h3>
            </div>
            <div class="flex flex-wrap gap-3 text-xs text-gray-500">
              <span class="inline-flex items-center gap-1.5">
                <span class="h-2 w-2 bg-accent-500"></span>
                Views
              </span>
              <span class="inline-flex items-center gap-1.5">
                <span class="h-2 w-2 bg-emerald-400"></span>
                Searches
              </span>
              <span class="inline-flex items-center gap-1.5">
                <span class="h-2 w-2 bg-sky-400"></span>
                Clicks
              </span>
            </div>
          </div>

          <div class="flex h-52 items-end gap-1 border border-gray-900 bg-[#1f1f1f]/60 px-3 py-4">
            <div
              v-for="(point, index) in summary.daily"
              :key="point.date"
              class="group flex h-full min-w-0 flex-1 flex-col justify-end gap-2"
              :title="getBarTitle(index)"
            >
              <div class="flex flex-1 items-end">
                <div
                  class="w-full min-w-[3px] bg-gradient-to-t from-sky-500 via-emerald-400 to-accent-500 opacity-80 transition group-hover:opacity-100"
                  :style="{ height: getBarHeight(index) }"
                ></div>
              </div>
              <span
                class="hidden truncate text-center text-[10px] text-gray-700 sm:block"
                :class="{ 'text-gray-500': getDailyTotal(index) > 0 }"
              >
                {{ point.label }}
              </span>
            </div>
          </div>
        </section>

        <section class="border border-gray-800 bg-[#1f1f1f] p-5" aria-labelledby="visitor-title">
          <p class="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Visitor split
          </p>
          <h3 id="visitor-title" class="mt-1 text-lg font-bold text-white">
            Anonymous and signed-in
          </h3>

          <div class="mt-6 space-y-4">
            <div>
              <div class="mb-2 flex items-center justify-between text-xs text-gray-500">
                <span>Anonymous</span>
                <span>{{ formatNumber(summary.anonymousVisitors) }}</span>
              </div>
              <div class="h-2 bg-[#1f1f1f]">
                <div
                  class="h-full bg-cyan-400"
                  :style="{
                    width: `${Math.min(
                      100,
                      (summary.anonymousVisitors / Math.max(summary.visitors, 1)) * 100,
                    )}%`,
                  }"
                ></div>
              </div>
            </div>

            <div>
              <div class="mb-2 flex items-center justify-between text-xs text-gray-500">
                <span>Signed-in</span>
                <span>{{ formatNumber(summary.signedInVisitors) }}</span>
              </div>
              <div class="h-2 bg-[#1f1f1f]">
                <div
                  class="h-full bg-accent-500"
                  :style="{
                    width: `${Math.min(
                      100,
                      (summary.signedInVisitors / Math.max(summary.visitors, 1)) * 100,
                    )}%`,
                  }"
                ></div>
              </div>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-2 gap-3 text-xs">
            <div class="border border-gray-800 bg-[#1f1f1f] px-3 py-3">
              <p class="font-bold text-white">{{ formatNumber(summary.siteViews) }}</p>
              <p class="mt-1 uppercase tracking-widest text-gray-600">Site views</p>
            </div>
            <div class="border border-gray-800 bg-[#1f1f1f] px-3 py-3">
              <p class="font-bold text-white">{{ formatNumber(summary.skillViews) }}</p>
              <p class="mt-1 uppercase tracking-widest text-gray-600">Skill views</p>
            </div>
          </div>
        </section>
      </div>

      <div class="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <section
          v-for="section in topSections"
          :key="section.title"
          class="border border-gray-800 bg-[#1f1f1f] p-5"
        >
          <h3 class="mb-4 text-sm font-bold uppercase tracking-widest text-white">
            {{ section.title }}
          </h3>

          <ol v-if="section.items.length > 0" class="space-y-3">
            <li
              v-for="item in section.items"
              :key="item.label"
              class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm"
            >
              <span class="min-w-0 truncate text-gray-400">{{ item.label }}</span>
              <span class="font-semibold text-white">{{ formatNumber(item.count) }}</span>
            </li>
          </ol>

          <p v-else class="text-sm text-gray-600">{{ section.empty }}</p>
        </section>
      </div>
    </template>
  </section>
</template>
