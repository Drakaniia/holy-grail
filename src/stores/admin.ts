import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { supabase } from '@/lib/supabase'
import { getSupabaseErrorMessage } from '@/lib/supabaseErrors'
import { useAuthStore } from '@/stores/auth'

export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

export interface Submission {
  id: string
  name: string
  url: string
  description: string
  category: string
  submitter_note: string | null
  submitted_by: string | null
  submitted_by_email: string | null
  status: SubmissionStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

interface AdminActionResult {
  ok: boolean
  message?: string
}

const SUBMISSION_COLUMNS =
  'id,name,url,description,category,submitter_note,submitted_by,submitted_by_email,status,reviewed_by,reviewed_at,created_at'

function hasAdminRole(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== 'object') {
    return false
  }

  const appMetadata = metadata as Record<string, unknown>
  if (appMetadata.role === 'admin') {
    return true
  }

  return Array.isArray(appMetadata.roles) && appMetadata.roles.includes('admin')
}

/**
 * Admin role is stored in server-controlled Supabase app_metadata.
 * Set it from a trusted server/admin SQL context only:
 *   UPDATE auth.users
 *   SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
 *   WHERE id = '<user-id>';
 */
export const useAdminStore = defineStore('admin', () => {
  const submissions = ref<Submission[]>([])
  const loading = shallowRef(false)
  const actionError = shallowRef<string | null>(null)

  const auth = useAuthStore()

  const isAdmin = computed(() => hasAdminRole(auth.user?.app_metadata))

  const pendingCount = computed(
    () => submissions.value.filter(s => s.status === 'pending').length
  )

  async function loadSubmissions(statusFilter?: SubmissionStatus): Promise<AdminActionResult> {
    if (!supabase) {
      actionError.value = 'Supabase is not configured.'
      return { ok: false, message: actionError.value }
    }

    loading.value = true
    actionError.value = null

    try {
      let query = supabase
        .from('submissions')
        .select(SUBMISSION_COLUMNS)
        .order('created_at', { ascending: false })

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error

      submissions.value = (data ?? []) as Submission[]
      return { ok: true }
    } catch (err) {
      const message = getSupabaseErrorMessage(err)
      actionError.value = message
      return { ok: false, message }
    } finally {
      loading.value = false
    }
  }

  async function updateSubmissionStatus(
    id: string,
    status: SubmissionStatus
  ): Promise<AdminActionResult> {
    if (!supabase) {
      actionError.value = 'Supabase is not configured.'
      return { ok: false, message: actionError.value }
    }

    loading.value = true
    actionError.value = null

    try {
      const reviewedBy = auth.user?.id ?? null
      const reviewedAt = new Date().toISOString()
      const { data, error } = await supabase
        .from('submissions')
        .update({
          status,
          reviewed_by: reviewedBy,
          reviewed_at: reviewedAt,
        })
        .eq('id', id)
        .select('id,status,reviewed_by,reviewed_at')
        .single()

      if (error) throw error
      if (!data) throw new Error('Submission could not be updated.')

      const idx = submissions.value.findIndex(s => s.id === id)
      if (idx !== -1) {
        submissions.value[idx] = {
          ...submissions.value[idx],
          status: data.status as SubmissionStatus,
          reviewed_by: data.reviewed_by,
          reviewed_at: data.reviewed_at,
        }
      }

      return { ok: true }
    } catch (err) {
      const message = getSupabaseErrorMessage(err)
      actionError.value = message
      return { ok: false, message }
    } finally {
      loading.value = false
    }
  }

  async function deleteSubmission(id: string): Promise<AdminActionResult> {
    if (!supabase) {
      actionError.value = 'Supabase is not configured.'
      return { ok: false, message: actionError.value }
    }

    loading.value = true
    actionError.value = null

    try {
      const { error } = await supabase.from('submissions').delete().eq('id', id)

      if (error) throw error

      submissions.value = submissions.value.filter(s => s.id !== id)
      return { ok: true }
    } catch (err) {
      const message = getSupabaseErrorMessage(err)
      actionError.value = message
      return { ok: false, message }
    } finally {
      loading.value = false
    }
  }

  return {
    actionError,
    deleteSubmission,
    isAdmin,
    loadSubmissions,
    loading,
    pendingCount,
    submissions,
    updateSubmissionStatus,
  }
})
