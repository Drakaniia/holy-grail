<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { AlertCircle, DatabaseZap, RotateCcw, SlidersHorizontal } from 'lucide-vue-next'
import { useAdminStore, type AnalyticsSettings } from '@/stores/admin'

const admin = useAdminStore()
const purgeMessage = shallowRef<string | null>(null)
const updatedLabel = computed(() => {
  const timestamp = Date.parse(admin.analyticsSettings.updated_at)
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return 'Not synced'
  }

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp))
})

const retentionOptions: { label: string; value: AnalyticsSettings['retention_days'] }[] = [
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '1 year', value: 365 },
]

const settingsRows = computed<
  {
    description: string
    key: keyof Pick<
      AnalyticsSettings,
      | 'track_authenticated_users'
      | 'track_outbound_clicks'
      | 'track_search_terms'
      | 'tracking_enabled'
    >
    label: string
  }[]
>(() => [
  {
    description: 'Page views and app events',
    key: 'tracking_enabled',
    label: 'Visitor tracking',
  },
  {
    description: 'Signed-in user IDs on events',
    key: 'track_authenticated_users',
    label: 'Authenticated activity',
  },
  {
    description: 'Search text after debounce',
    key: 'track_search_terms',
    label: 'Search terms',
  },
  {
    description: 'External link destinations',
    key: 'track_outbound_clicks',
    label: 'Outbound clicks',
  },
])

async function toggleSetting(key: (typeof settingsRows.value)[number]['key']) {
  purgeMessage.value = null
  await admin.saveAnalyticsSettings({
    [key]: !admin.analyticsSettings[key],
  })
}

async function setRetentionDays(days: AnalyticsSettings['retention_days']) {
  purgeMessage.value = null
  await admin.saveAnalyticsSettings({
    retention_days: days,
  })
}

async function purgeOldEvents() {
  const result = await admin.purgeOldAnalyticsEvents()
  purgeMessage.value = result.ok ? (result.message ?? 'Analytics retention applied.') : null
}
</script>

<template>
  <section aria-labelledby="admin-settings-title">
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-300">
          Admin Settings
        </p>
        <h2 id="admin-settings-title" class="text-2xl font-bold text-white">Analytics controls</h2>
      </div>

      <div
        class="flex items-center gap-2 border border-gray-800 bg-[#1f1f1f] px-3 py-2 text-xs text-gray-500"
      >
        <SlidersHorizontal class="h-4 w-4 text-accent-300" />
        Updated {{ updatedLabel }}
      </div>
    </div>

    <div
      v-if="admin.settingsError"
      class="mb-6 flex gap-3 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100"
    >
      <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
      {{ admin.settingsError }}
    </div>

    <div
      v-if="purgeMessage"
      class="mb-6 flex gap-3 border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100"
    >
      <DatabaseZap class="mt-0.5 h-4 w-4 flex-shrink-0" />
      {{ purgeMessage }}
    </div>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section class="border border-gray-800 bg-[#1f1f1f]" aria-labelledby="tracking-title">
        <div class="border-b border-gray-800 px-5 py-4">
          <h3 id="tracking-title" class="text-sm font-bold uppercase tracking-widest text-white">
            Tracking
          </h3>
        </div>

        <div class="divide-y divide-gray-800">
          <div
            v-for="row in settingsRows"
            :key="row.key"
            class="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p class="font-semibold text-white">{{ row.label }}</p>
              <p class="mt-1 text-sm text-gray-500">{{ row.description }}</p>
            </div>

            <button
              type="button"
              class="relative h-7 w-12 border transition disabled:cursor-not-allowed disabled:opacity-60"
              :class="
                admin.analyticsSettings[row.key]
                  ? 'border-accent-500 bg-accent-500/20'
                  : 'border-gray-700 bg-[#1f1f1f]'
              "
              :aria-pressed="admin.analyticsSettings[row.key]"
              :disabled="admin.loadingSettings"
              @click="toggleSetting(row.key)"
            >
              <span
                class="absolute top-1 h-5 w-5 bg-white transition"
                :class="admin.analyticsSettings[row.key] ? 'left-6' : 'left-1'"
              ></span>
              <span class="sr-only">{{ row.label }}</span>
            </button>
          </div>
        </div>
      </section>

      <aside class="space-y-6">
        <section class="border border-gray-800 bg-[#1f1f1f]" aria-labelledby="retention-title">
          <div class="border-b border-gray-800 px-5 py-4">
            <h3 id="retention-title" class="text-sm font-bold uppercase tracking-widest text-white">
              Retention
            </h3>
          </div>

          <div class="space-y-3 p-5">
            <button
              v-for="option in retentionOptions"
              :key="option.value"
              type="button"
              class="flex w-full items-center justify-between border px-3 py-3 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60"
              :class="
                admin.analyticsSettings.retention_days === option.value
                  ? 'border-accent-500 bg-accent-500/10 text-white'
                  : 'border-gray-800 text-gray-500 hover:text-gray-300'
              "
              :disabled="admin.loadingSettings"
              @click="setRetentionDays(option.value)"
            >
              <span>{{ option.label }}</span>
              <span
                class="h-2 w-2"
                :class="
                  admin.analyticsSettings.retention_days === option.value
                    ? 'bg-accent-400'
                    : 'bg-[#1f1f1f]'
                "
              ></span>
            </button>
          </div>
        </section>

        <section class="border border-gray-800 bg-[#1f1f1f] p-5" aria-labelledby="cleanup-title">
          <div class="mb-5 flex items-start gap-3">
            <DatabaseZap class="mt-1 h-5 w-5 text-emerald-300" />
            <div>
              <h3 id="cleanup-title" class="text-sm font-bold uppercase tracking-widest text-white">
                Cleanup
              </h3>
              <p class="mt-2 text-sm leading-6 text-gray-500">
                Remove analytics events older than the selected retention window.
              </p>
            </div>
          </div>

          <button
            type="button"
            class="inline-flex h-10 w-full items-center justify-center gap-2 border border-gray-700 text-xs font-semibold uppercase tracking-widest text-gray-300 transition hover:border-emerald-400/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="admin.purgingAnalytics"
            @click="purgeOldEvents"
          >
            <RotateCcw class="h-4 w-4" :class="{ 'animate-spin': admin.purgingAnalytics }" />
            Apply retention
          </button>
        </section>
      </aside>
    </div>
  </section>
</template>
