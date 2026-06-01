<script setup lang="ts">
import { shallowRef } from 'vue'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'
import { getSupabaseFunctionErrorMessage } from '@/lib/supabaseErrors'
import { useToastStore } from '@/stores/toast'
import type { Site } from '@/stores/sites'

const props = defineProps<{
  site: Site
}>()

type SiteIssueType = 'down' | 'deprecated' | 'wrong-url' | 'other'
type ReportStatus = 'idle' | 'loading' | 'sent'

interface ReportSiteIssueResponse {
  id?: string
  ok?: boolean
  error?: string
}

const ISSUE_OPTIONS: { label: string; success: string; value: SiteIssueType }[] = [
  { label: 'Not working', success: 'reported as not working.', value: 'down' },
  { label: 'Legacy', success: 'reported as a legacy or deprecated site.', value: 'deprecated' },
  { label: 'Wrong URL', success: 'reported with a wrong URL.', value: 'wrong-url' },
  { label: 'Other', success: 'sent to admin review.', value: 'other' },
]

const toast = useToastStore()
const status = shallowRef<ReportStatus>('idle')
const selectedIssueType = shallowRef<SiteIssueType>('down')

function getSelectedIssueOption() {
  return ISSUE_OPTIONS.find(option => option.value === selectedIssueType.value) ?? ISSUE_OPTIONS[0]
}

async function reportSiteIssue() {
  if (status.value !== 'idle') return

  if (!supabase) {
    toast.error('Report unavailable', 'Supabase is not configured. Add env vars to .env.local.')
    return
  }

  status.value = 'loading'

  try {
    const { data, error } = await supabase.functions.invoke<ReportSiteIssueResponse>(
      'report-site-issue',
      {
        body: {
          report: {
            category: props.site.category,
            issue_type: selectedIssueType.value,
            name: props.site.name,
            slug: props.site.slug,
            url: props.site.website,
          },
        },
      },
    )

    if (error) throw error
    if (!data?.ok) throw new Error(data?.error || 'Site issue report failed. Please try again.')

    status.value = 'sent'
    toast.success('Admin review queued', `${props.site.name} was ${getSelectedIssueOption().success}`)
  } catch (err) {
    status.value = 'idle'
    toast.error(
      'Report failed',
      await getSupabaseFunctionErrorMessage(err, 'Site issue report failed. Please try again.'),
    )
  }
}
</script>

<template>
  <div
    class="inline-flex h-9 max-w-full items-center overflow-hidden rounded-lg border border-red-400/30 bg-red-400/10 text-red-100"
  >
    <label :for="`site-issue-type-${site.slug}`" class="sr-only">
      Site issue type
    </label>
    <select
      :id="`site-issue-type-${site.slug}`"
      v-model="selectedIssueType"
      class="h-full min-w-0 bg-transparent px-2.5 text-xs font-semibold text-red-100 outline-none transition-colors hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-70"
      :disabled="status !== 'idle'"
      :aria-label="`Choose issue type for ${site.name}`"
    >
      <option
        v-for="option in ISSUE_OPTIONS"
        :key="option.value"
        :value="option.value"
        class="bg-zinc-950 text-red-100"
      >
        {{ option.label }}
      </option>
    </select>
    <button
      type="button"
      class="inline-flex h-full shrink-0 items-center gap-2 border-l border-red-400/30 px-3 text-sm font-semibold transition-colors hover:border-red-300/50 hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-70"
      :disabled="status !== 'idle'"
      :aria-label="`Report ${site.name} for admin review`"
      @click="reportSiteIssue"
    >
      <Loader2 v-if="status === 'loading'" class="h-4 w-4 animate-spin" />
      <CheckCircle2 v-else-if="status === 'sent'" class="h-4 w-4" />
      <AlertTriangle v-else class="h-4 w-4" />
      <span>{{ status === 'loading' ? 'Reporting...' : status === 'sent' ? 'Reported' : 'Report' }}</span>
    </button>
  </div>
</template>
