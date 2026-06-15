import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { clearAnalyticsSettingsCache } from '@/lib/analytics'
import { supabase } from '@/lib/supabase'
import { getSupabaseErrorMessage } from '@/lib/supabaseErrors'
import { useAuthStore } from '@/stores/auth'

export type SubmissionStatus = 'pending' | 'approved' | 'rejected'
export type SiteIssueStatus = 'open' | 'resolved' | 'ignored'
export type SiteIssueType = 'down' | 'deprecated' | 'wrong-url' | 'other'
export type AnalyticsRange = 7 | 30 | 90 | 'all'
export type AnalyticsEventType = 'page_view' | 'search' | 'outbound_click' | 'signup' | 'bookmark'

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

export interface SiteIssueReport {
  id: string
  slug: string
  name: string
  url: string
  category: string | null
  issue_type: SiteIssueType
  note: string | null
  reporter_email: string | null
  status: SiteIssueStatus
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

export interface AnalyticsEvent {
  id: string
  event_type: AnalyticsEventType
  session_id: string
  user_id: string | null
  route_path: string | null
  route_name: string | null
  resource_type: 'site' | 'skill' | null
  resource_slug: string | null
  target_url: string | null
  search_query: string | null
  device_type: 'desktop' | 'tablet' | 'mobile' | null
  browser_family: 'chrome' | 'edge' | 'firefox' | 'safari' | 'other' | null
  referrer_host: string | null
  created_at: string
}

export interface AnalyticsSettings {
  id: 'global'
  tracking_enabled: boolean
  track_authenticated_users: boolean
  track_search_terms: boolean
  track_outbound_clicks: boolean
  retention_days: 30 | 90 | 365
  updated_by: string | null
  updated_at: string
  created_at: string
}

export interface AnalyticsTopItem {
  label: string
  count: number
  detail?: string
}

export interface AnalyticsDailyPoint {
  date: string
  label: string
  pageViews: number
  searches: number
  outboundClicks: number
  visitors: number
}

export interface AnalyticsSummary {
  totalEvents: number
  visitors: number
  anonymousVisitors: number
  signedInVisitors: number
  pageViews: number
  searches: number
  outboundClicks: number
  signups: number
  bookmarkEvents: number
  siteViews: number
  skillViews: number
  topPages: AnalyticsTopItem[]
  topSites: AnalyticsTopItem[]
  topSkills: AnalyticsTopItem[]
  topSearches: AnalyticsTopItem[]
  topOutboundLinks: AnalyticsTopItem[]
  devices: AnalyticsTopItem[]
  browsers: AnalyticsTopItem[]
  referrers: AnalyticsTopItem[]
  daily: AnalyticsDailyPoint[]
}

interface AdminActionResult {
  ok: boolean
  message?: string
}

interface OptionalAdminCounts {
  bookmarks: number | null
}

const SUBMISSION_COLUMNS =
  'id,name,url,description,category,submitter_note,submitted_by,submitted_by_email,status,reviewed_by,reviewed_at,created_at'
const SITE_ISSUE_COLUMNS =
  'id,slug,name,url,category,issue_type,note,reporter_email,status,resolved_by,resolved_at,created_at'
const ANALYTICS_EVENT_COLUMNS =
  'id,event_type,session_id,user_id,route_path,route_name,resource_type,resource_slug,target_url,search_query,device_type,browser_family,referrer_host,created_at'
const ANALYTICS_SETTINGS_COLUMNS =
  'id,tracking_enabled,track_authenticated_users,track_search_terms,track_outbound_clicks,retention_days,updated_by,updated_at,created_at'
const MAX_ANALYTICS_EVENTS = 10000

const DEFAULT_ANALYTICS_SETTINGS: AnalyticsSettings = {
  id: 'global',
  tracking_enabled: true,
  track_authenticated_users: true,
  track_search_terms: true,
  track_outbound_clicks: true,
  retention_days: 90,
  updated_by: null,
  updated_at: new Date(0).toISOString(),
  created_at: new Date(0).toISOString(),
}

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

function getRangeStart(range: AnalyticsRange) {
  if (range === 'all') return null

  const start = new Date()
  start.setDate(start.getDate() - range)
  return start.toISOString()
}

function getVisitorKey(event: AnalyticsEvent) {
  return event.user_id ? `user:${event.user_id}` : `session:${event.session_id}`
}

function countUnique(values: Array<string | null | undefined>) {
  return new Set(values.filter((value): value is string => Boolean(value))).size
}

function addTopCount(map: Map<string, number>, label: string | null | undefined) {
  const key = label?.trim()
  if (!key) return

  map.set(key, (map.get(key) ?? 0) + 1)
}

function toTopItems(map: Map<string, number>, limit = 6): AnalyticsTopItem[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }))
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function formatShortDate(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`)
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}

function buildDailyPoints(events: AnalyticsEvent[], range: AnalyticsRange): AnalyticsDailyPoint[] {
  const dayCount = range === 'all' ? 30 : Math.min(range, 30)
  const points = new Map<
    string,
    {
      outboundClicks: number
      pageViews: number
      searches: number
      visitors: Set<string>
    }
  >()

  for (let index = dayCount - 1; index >= 0; index -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - index)
    points.set(formatDateKey(date), {
      outboundClicks: 0,
      pageViews: 0,
      searches: 0,
      visitors: new Set<string>(),
    })
  }

  for (const event of events) {
    const dayKey = event.created_at.slice(0, 10)
    const point = points.get(dayKey)
    if (!point) continue

    point.visitors.add(getVisitorKey(event))
    if (event.event_type === 'page_view') point.pageViews += 1
    if (event.event_type === 'search') point.searches += 1
    if (event.event_type === 'outbound_click') point.outboundClicks += 1
  }

  return [...points.entries()].map(([date, point]) => ({
    date,
    label: formatShortDate(date),
    outboundClicks: point.outboundClicks,
    pageViews: point.pageViews,
    searches: point.searches,
    visitors: point.visitors.size,
  }))
}

function buildAnalyticsSummary(events: AnalyticsEvent[], range: AnalyticsRange): AnalyticsSummary {
  const visitorKeys = new Set(events.map(getVisitorKey))
  const anonymousKeys = new Set(
    events.filter((event) => !event.user_id).map((event) => `session:${event.session_id}`),
  )
  const signedInVisitors = countUnique(events.map((event) => event.user_id))
  const topPages = new Map<string, number>()
  const topSites = new Map<string, number>()
  const topSkills = new Map<string, number>()
  const topSearches = new Map<string, number>()
  const topOutboundLinks = new Map<string, number>()
  const devices = new Map<string, number>()
  const browsers = new Map<string, number>()
  const referrers = new Map<string, number>()

  let pageViews = 0
  let searches = 0
  let outboundClicks = 0
  let signups = 0
  let bookmarkEvents = 0
  let siteViews = 0
  let skillViews = 0

  for (const event of events) {
    addTopCount(devices, event.device_type)
    addTopCount(browsers, event.browser_family)
    addTopCount(referrers, event.referrer_host)

    if (event.event_type === 'page_view') {
      pageViews += 1
      addTopCount(topPages, event.route_path)

      if (event.resource_type === 'site') {
        siteViews += 1
        addTopCount(topSites, event.resource_slug)
      }

      if (event.resource_type === 'skill') {
        skillViews += 1
        addTopCount(topSkills, event.resource_slug)
      }
    }

    if (event.event_type === 'search') {
      searches += 1
      addTopCount(topSearches, event.search_query)
    }

    if (event.event_type === 'outbound_click') {
      outboundClicks += 1
      addTopCount(topOutboundLinks, event.target_url)
    }

    if (event.event_type === 'signup') {
      signups += 1
    }

    if (event.event_type === 'bookmark') {
      bookmarkEvents += 1
    }
  }

  return {
    anonymousVisitors: anonymousKeys.size,
    bookmarkEvents,
    browsers: toTopItems(browsers),
    daily: buildDailyPoints(events, range),
    devices: toTopItems(devices),
    outboundClicks,
    pageViews,
    referrers: toTopItems(referrers),
    searches,
    signedInVisitors,
    signups,
    siteViews,
    skillViews,
    topOutboundLinks: toTopItems(topOutboundLinks),
    topPages: toTopItems(topPages),
    topSearches: toTopItems(topSearches),
    topSites: toTopItems(topSites),
    topSkills: toTopItems(topSkills),
    totalEvents: events.length,
    visitors: visitorKeys.size,
  }
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
  const siteIssueReports = ref<SiteIssueReport[]>([])
  const analyticsEvents = ref<AnalyticsEvent[]>([])
  const analyticsSettings = ref<AnalyticsSettings>({ ...DEFAULT_ANALYTICS_SETTINGS })
  const optionalCounts = ref<OptionalAdminCounts>({ bookmarks: null })
  const loading = shallowRef(false)
  const loadingSiteIssues = shallowRef(false)
  const loadingAnalytics = shallowRef(false)
  const loadingSettings = shallowRef(false)
  const purgingAnalytics = shallowRef(false)
  const actionError = shallowRef<string | null>(null)
  const siteIssueError = shallowRef<string | null>(null)
  const analyticsError = shallowRef<string | null>(null)
  const settingsError = shallowRef<string | null>(null)
  const analyticsRange = shallowRef<AnalyticsRange>(30)

  const auth = useAuthStore()

  const isAdmin = computed(() => hasAdminRole(auth.user?.app_metadata))

  const pendingCount = computed(
    () => submissions.value.filter((submission) => submission.status === 'pending').length,
  )
  const approvedCount = computed(
    () => submissions.value.filter((submission) => submission.status === 'approved').length,
  )
  const rejectedCount = computed(
    () => submissions.value.filter((submission) => submission.status === 'rejected').length,
  )
  const openSiteIssueCount = computed(
    () => siteIssueReports.value.filter((report) => report.status === 'open').length,
  )
  const legacySiteIssueCount = computed(
    () =>
      siteIssueReports.value.filter(
        (report) => report.status === 'open' && report.issue_type === 'deprecated',
      ).length,
  )
  const resolvedSiteIssueCount = computed(
    () => siteIssueReports.value.filter((report) => report.status === 'resolved').length,
  )
  const ignoredSiteIssueCount = computed(
    () => siteIssueReports.value.filter((report) => report.status === 'ignored').length,
  )
  const analyticsSummary = computed(() =>
    buildAnalyticsSummary(analyticsEvents.value, analyticsRange.value),
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

  async function loadSiteIssueReports(statusFilter?: SiteIssueStatus): Promise<AdminActionResult> {
    if (!supabase) {
      siteIssueError.value = 'Supabase is not configured.'
      return { ok: false, message: siteIssueError.value }
    }

    loadingSiteIssues.value = true
    siteIssueError.value = null

    try {
      let query = supabase
        .from('site_issue_reports')
        .select(SITE_ISSUE_COLUMNS)
        .order('created_at', { ascending: false })

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error

      siteIssueReports.value = (data ?? []) as SiteIssueReport[]
      return { ok: true }
    } catch (err) {
      const message = getSupabaseErrorMessage(err)
      siteIssueError.value = message
      return { ok: false, message }
    } finally {
      loadingSiteIssues.value = false
    }
  }

  async function loadAnalytics(range = analyticsRange.value): Promise<AdminActionResult> {
    if (!supabase) {
      analyticsError.value = 'Supabase is not configured.'
      return { ok: false, message: analyticsError.value }
    }

    loadingAnalytics.value = true
    analyticsError.value = null
    analyticsRange.value = range

    try {
      let query = supabase
        .from('analytics_events')
        .select(ANALYTICS_EVENT_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(MAX_ANALYTICS_EVENTS)

      const rangeStart = getRangeStart(range)
      if (rangeStart) {
        query = query.gte('created_at', rangeStart)
      }

      const { data, error } = await query

      if (error) throw error

      analyticsEvents.value = (data ?? []) as AnalyticsEvent[]
      return { ok: true }
    } catch (err) {
      const message = getSupabaseErrorMessage(err)
      analyticsError.value = message
      return { ok: false, message }
    } finally {
      loadingAnalytics.value = false
    }
  }

  async function loadAnalyticsSettings(): Promise<AdminActionResult> {
    if (!supabase) {
      settingsError.value = 'Supabase is not configured.'
      return { ok: false, message: settingsError.value }
    }

    loadingSettings.value = true
    settingsError.value = null

    try {
      const { data, error } = await supabase
        .from('analytics_settings')
        .select(ANALYTICS_SETTINGS_COLUMNS)
        .eq('id', 'global')
        .maybeSingle()

      if (error) throw error

      analyticsSettings.value = data
        ? ({ ...DEFAULT_ANALYTICS_SETTINGS, ...data } as AnalyticsSettings)
        : { ...DEFAULT_ANALYTICS_SETTINGS }
      return { ok: true }
    } catch (err) {
      const message = getSupabaseErrorMessage(err)
      settingsError.value = message
      return { ok: false, message }
    } finally {
      loadingSettings.value = false
    }
  }

  async function saveAnalyticsSettings(
    updates: Partial<
      Pick<
        AnalyticsSettings,
        | 'retention_days'
        | 'track_authenticated_users'
        | 'track_outbound_clicks'
        | 'track_search_terms'
        | 'tracking_enabled'
      >
    >,
  ): Promise<AdminActionResult> {
    if (!supabase) {
      settingsError.value = 'Supabase is not configured.'
      return { ok: false, message: settingsError.value }
    }

    loadingSettings.value = true
    settingsError.value = null

    try {
      const { data, error } = await supabase
        .from('analytics_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: auth.user?.id ?? null,
        })
        .eq('id', 'global')
        .select(ANALYTICS_SETTINGS_COLUMNS)
        .single()

      if (error) throw error

      analyticsSettings.value = { ...DEFAULT_ANALYTICS_SETTINGS, ...data } as AnalyticsSettings
      clearAnalyticsSettingsCache()
      return { ok: true }
    } catch (err) {
      const message = getSupabaseErrorMessage(err)
      settingsError.value = message
      return { ok: false, message }
    } finally {
      loadingSettings.value = false
    }
  }

  async function purgeOldAnalyticsEvents(): Promise<AdminActionResult> {
    if (!supabase) {
      settingsError.value = 'Supabase is not configured.'
      return { ok: false, message: settingsError.value }
    }

    purgingAnalytics.value = true
    settingsError.value = null

    try {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - analyticsSettings.value.retention_days)

      const { data, error } = await supabase
        .from('analytics_events')
        .delete()
        .lt('created_at', cutoff.toISOString())
        .select('id')

      if (error) throw error

      await loadAnalytics()
      return {
        ok: true,
        message: `${Array.isArray(data) ? data.length : 0} analytics events removed.`,
      }
    } catch (err) {
      const message = getSupabaseErrorMessage(err)
      settingsError.value = message
      return { ok: false, message }
    } finally {
      purgingAnalytics.value = false
    }
  }

  async function loadOptionalCounts(): Promise<void> {
    if (!supabase) return

    try {
      const { count, error } = await supabase
        .from('user_bookmarks')
        .select('id', { count: 'exact', head: true })

      if (error) throw error

      optionalCounts.value = {
        bookmarks: count ?? null,
      }
    } catch {
      optionalCounts.value = {
        bookmarks: null,
      }
    }
  }

  async function updateSubmissionStatus(
    id: string,
    status: SubmissionStatus,
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

      const idx = submissions.value.findIndex((submission) => submission.id === id)
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

      submissions.value = submissions.value.filter((submission) => submission.id !== id)
      return { ok: true }
    } catch (err) {
      const message = getSupabaseErrorMessage(err)
      actionError.value = message
      return { ok: false, message }
    } finally {
      loading.value = false
    }
  }

  async function updateSiteIssueStatus(
    id: string,
    status: SiteIssueStatus,
  ): Promise<AdminActionResult> {
    if (!supabase) {
      siteIssueError.value = 'Supabase is not configured.'
      return { ok: false, message: siteIssueError.value }
    }

    loadingSiteIssues.value = true
    siteIssueError.value = null

    try {
      const resolvedBy = status === 'open' ? null : (auth.user?.id ?? null)
      const resolvedAt = status === 'open' ? null : new Date().toISOString()
      const { data, error } = await supabase
        .from('site_issue_reports')
        .update({
          resolved_at: resolvedAt,
          resolved_by: resolvedBy,
          status,
        })
        .eq('id', id)
        .select('id,status,resolved_by,resolved_at')
        .single()

      if (error) throw error
      if (!data) throw new Error('Site issue could not be updated.')

      const idx = siteIssueReports.value.findIndex((report) => report.id === id)
      if (idx !== -1) {
        siteIssueReports.value[idx] = {
          ...siteIssueReports.value[idx],
          resolved_at: data.resolved_at,
          resolved_by: data.resolved_by,
          status: data.status as SiteIssueStatus,
        }
      }

      return { ok: true }
    } catch (err) {
      const message = getSupabaseErrorMessage(err)
      siteIssueError.value = message
      return { ok: false, message }
    } finally {
      loadingSiteIssues.value = false
    }
  }

  async function deleteSiteIssueReport(id: string): Promise<AdminActionResult> {
    if (!supabase) {
      siteIssueError.value = 'Supabase is not configured.'
      return { ok: false, message: siteIssueError.value }
    }

    loadingSiteIssues.value = true
    siteIssueError.value = null

    try {
      const { error } = await supabase.from('site_issue_reports').delete().eq('id', id)

      if (error) throw error

      siteIssueReports.value = siteIssueReports.value.filter((report) => report.id !== id)
      return { ok: true }
    } catch (err) {
      const message = getSupabaseErrorMessage(err)
      siteIssueError.value = message
      return { ok: false, message }
    } finally {
      loadingSiteIssues.value = false
    }
  }

  return {
    actionError,
    analyticsError,
    analyticsEvents,
    analyticsRange,
    analyticsSettings,
    analyticsSummary,
    approvedCount,
    deleteSiteIssueReport,
    deleteSubmission,
    ignoredSiteIssueCount,
    isAdmin,
    legacySiteIssueCount,
    loadAnalytics,
    loadAnalyticsSettings,
    loadOptionalCounts,
    loadSiteIssueReports,
    loadSubmissions,
    loading,
    loadingAnalytics,
    loadingSettings,
    loadingSiteIssues,
    optionalCounts,
    openSiteIssueCount,
    pendingCount,
    purgeOldAnalyticsEvents,
    purgingAnalytics,
    rejectedCount,
    resolvedSiteIssueCount,
    saveAnalyticsSettings,
    settingsError,
    siteIssueError,
    siteIssueReports,
    submissions,
    updateSiteIssueStatus,
    updateSubmissionStatus,
  }
})
