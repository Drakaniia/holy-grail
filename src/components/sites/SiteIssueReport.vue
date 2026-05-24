<script setup lang="ts">
import { shallowRef } from 'vue'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase'
import { getSupabaseErrorMessage } from '@/lib/supabaseErrors'
import { useToastStore } from '@/stores/toast'
import type { Site } from '@/stores/sites'

const props = defineProps<{
  site: Site
}>()

type ReportStatus = 'idle' | 'loading' | 'sent'

interface ReportSiteIssueResponse {
  ok?: boolean
  error?: string
}

const toast = useToastStore()
const status = shallowRef<ReportStatus>('idle')

function getErrorContext(error: unknown): Response | null {
  if (!error || typeof error !== 'object' || !('context' in error)) {
    return null
  }

  const context = (error as { context?: unknown }).context
  return context instanceof Response ? context : null
}

async function getReportErrorMessage(error: unknown) {
  const context = getErrorContext(error)
  if (context) {
    const body = await context.clone().json().catch(() => null)
    if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
      return body.error
    }
  }

  return getSupabaseErrorMessage(error, 'Site issue report failed. Please try again.')
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
            issue_type: 'down',
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
    toast.success('Admin notified', `${props.site.name} was reported as down or inaccessible.`)
  } catch (err) {
    status.value = 'idle'
    toast.error('Report failed', await getReportErrorMessage(err))
  }
}
</script>

<template>
  <button
    type="button"
    class="inline-flex h-9 items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 text-sm font-semibold text-red-100 transition-colors hover:border-red-300/50 hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-70"
    :disabled="status !== 'idle'"
    :aria-label="`Report ${site.name} as down or inaccessible`"
    @click="reportSiteIssue"
  >
    <Loader2 v-if="status === 'loading'" class="h-4 w-4 animate-spin" />
    <CheckCircle2 v-else-if="status === 'sent'" class="h-4 w-4" />
    <AlertTriangle v-else class="h-4 w-4" />
    <span>{{ status === 'loading' ? 'Reporting...' : status === 'sent' ? 'Reported' : 'Report down' }}</span>
  </button>
</template>
