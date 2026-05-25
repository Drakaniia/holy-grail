import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export type AnalyticsEventType =
  | 'page_view'
  | 'search'
  | 'outbound_click'
  | 'signup'
  | 'bookmark'

interface AnalyticsSettings {
  tracking_enabled: boolean
  track_authenticated_users: boolean
  track_search_terms: boolean
  track_outbound_clicks: boolean
}

interface AnalyticsPayload {
  event_type: AnalyticsEventType
  route_path?: string | null
  route_name?: string | null
  resource_type?: 'site' | 'skill' | null
  resource_slug?: string | null
  target_url?: string | null
  search_query?: string | null
}

const ANALYTICS_SESSION_KEY = 'holy-grail-analytics-session'
const SETTINGS_CACHE_MS = 5 * 60 * 1000
const SEARCH_DEBOUNCE_MS = 700

const DEFAULT_SETTINGS: AnalyticsSettings = {
  tracking_enabled: true,
  track_authenticated_users: true,
  track_search_terms: true,
  track_outbound_clicks: true,
}
const DISABLED_SETTINGS: AnalyticsSettings = {
  tracking_enabled: false,
  track_authenticated_users: false,
  track_search_terms: false,
  track_outbound_clicks: false,
}

let settingsCache: { value: AnalyticsSettings; expiresAt: number } | null = null
const searchTimers = new Map<string, number>()
const lastTrackedSearch = new Map<string, string>()

function getSessionId() {
  if (typeof window === 'undefined') {
    return 'server-render-session'
  }

  try {
    const stored = window.localStorage.getItem(ANALYTICS_SESSION_KEY)
    if (stored) return stored

    const next =
      typeof window.crypto?.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    window.localStorage.setItem(ANALYTICS_SESSION_KEY, next)
    return next
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

function getBrowserFamily() {
  if (typeof navigator === 'undefined') return 'other'

  const agent = navigator.userAgent.toLowerCase()
  if (agent.includes('edg/')) return 'edge'
  if (agent.includes('firefox/')) return 'firefox'
  if (agent.includes('safari/') && !agent.includes('chrome/')) return 'safari'
  if (agent.includes('chrome/') || agent.includes('crios/')) return 'chrome'
  return 'other'
}

function getDeviceType() {
  if (typeof window === 'undefined') return 'desktop'

  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

function getReferrerHost() {
  if (typeof document === 'undefined' || !document.referrer) {
    return null
  }

  try {
    const referrer = new URL(document.referrer)
    if (referrer.host === window.location.host) return null
    return referrer.host.slice(0, 255)
  } catch {
    return null
  }
}

function getViewportWidth() {
  if (typeof window === 'undefined') return null
  return window.innerWidth
}

function getStringParam(value: unknown) {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : null
  }

  return typeof value === 'string' ? value : null
}

function getRouteResource(to: RouteLocationNormalizedLoaded) {
  const slug = getStringParam(to.params.slug)

  if (to.name === 'site-detail' && slug) {
    return { resource_type: 'site' as const, resource_slug: slug }
  }

  if (to.name === 'skill-detail' && slug) {
    return { resource_type: 'skill' as const, resource_slug: slug }
  }

  return { resource_type: null, resource_slug: null }
}

function isAdminPath(path: string) {
  return path === '/admin' || path.startsWith('/admin/')
}

function getSanitizedUrl(value: string) {
  try {
    const url = new URL(value, window.location.origin)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (url.host === window.location.host) return null

    url.hash = ''
    url.search = ''
    return `${url.origin}${url.pathname}`.slice(0, 1000)
  } catch {
    return null
  }
}

function normalizeSearchQuery(query: string) {
  return query.replace(/\s+/g, ' ').trim().slice(0, 160)
}

async function loadAnalyticsSettings(): Promise<AnalyticsSettings> {
  if (!supabase) return DISABLED_SETTINGS

  const now = Date.now()
  if (settingsCache && settingsCache.expiresAt > now) {
    return settingsCache.value
  }

  try {
    const { data, error } = await supabase
      .from('analytics_settings')
      .select(
        'tracking_enabled,track_authenticated_users,track_search_terms,track_outbound_clicks',
      )
      .eq('id', 'global')
      .maybeSingle()

    if (error) throw error

    const value = data ? ({ ...DEFAULT_SETTINGS, ...data } as AnalyticsSettings) : DEFAULT_SETTINGS
    settingsCache = { value, expiresAt: now + SETTINGS_CACHE_MS }
    return value
  } catch {
    return DISABLED_SETTINGS
  }
}

export function clearAnalyticsSettingsCache() {
  settingsCache = null
}

async function getTrackedUserId(settings: AnalyticsSettings) {
  if (!settings.track_authenticated_users) return null

  try {
    const auth = useAuthStore()
    await auth.initialize()
    return auth.user?.id ?? null
  } catch {
    return null
  }
}

async function insertAnalyticsEvent(payload: AnalyticsPayload) {
  if (!supabase || typeof window === 'undefined') return

  const settings = await loadAnalyticsSettings()
  if (!settings.tracking_enabled) return
  if (payload.event_type === 'search' && !settings.track_search_terms) return
  if (payload.event_type === 'outbound_click' && !settings.track_outbound_clicks) return

  const userId = await getTrackedUserId(settings)
  if (payload.event_type === 'signup' && !userId) return

  try {
    const { error } = await supabase.from('analytics_events').insert({
      browser_family: getBrowserFamily(),
      device_type: getDeviceType(),
      event_type: payload.event_type,
      referrer_host: getReferrerHost(),
      resource_slug: payload.resource_slug ?? null,
      resource_type: payload.resource_type ?? null,
      route_name: payload.route_name ?? null,
      route_path: payload.route_path ?? null,
      search_query: payload.search_query ?? null,
      session_id: getSessionId(),
      target_url: payload.target_url ?? null,
      user_id: userId,
      viewport_width: getViewportWidth(),
    })

    if (error) throw error
  } catch {
  }
}

export function trackSearchQuery(query: string, source: string) {
  if (typeof window === 'undefined') return

  const normalizedQuery = normalizeSearchQuery(query)
  const timerKey = source
  const existingTimer = searchTimers.get(timerKey)

  if (existingTimer) {
    window.clearTimeout(existingTimer)
  }

  if (normalizedQuery.length < 2) return

  const timer = window.setTimeout(() => {
    if (lastTrackedSearch.get(timerKey) === normalizedQuery) return

    lastTrackedSearch.set(timerKey, normalizedQuery)
    void insertAnalyticsEvent({
      event_type: 'search',
      route_path: window.location.pathname,
      route_name: source,
      search_query: normalizedQuery,
    })
  }, SEARCH_DEBOUNCE_MS)

  searchTimers.set(timerKey, timer)
}

export function trackSignup() {
  void insertAnalyticsEvent({
    event_type: 'signup',
    route_path: '/signup',
    route_name: 'signup',
  })
}

export function trackBookmark(resourceType: 'site' | 'skill', resourceSlug: string) {
  if (typeof window === 'undefined') return

  void insertAnalyticsEvent({
    event_type: 'bookmark',
    resource_slug: resourceSlug,
    resource_type: resourceType,
    route_path: window.location.pathname,
    route_name: 'bookmark',
  })
}

function trackPageView(to: RouteLocationNormalizedLoaded) {
  if (isAdminPath(to.path)) return

  const resource = getRouteResource(to)
  void insertAnalyticsEvent({
    event_type: 'page_view',
    route_name: typeof to.name === 'string' ? to.name : null,
    route_path: to.path.slice(0, 400),
    ...resource,
  })
}

function trackOutboundClick(event: MouseEvent) {
  if (typeof window === 'undefined' || isAdminPath(window.location.pathname)) return

  const target = event.target instanceof Element ? event.target.closest('a[href]') : null
  if (!(target instanceof HTMLAnchorElement)) return

  const targetUrl = getSanitizedUrl(target.href)
  if (!targetUrl) return

  void insertAnalyticsEvent({
    event_type: 'outbound_click',
    route_path: window.location.pathname,
    route_name: 'outbound_click',
    target_url: targetUrl,
  })
}

export function installAnalyticsTracking(router: Router) {
  if (typeof window === 'undefined') return

  router.afterEach((to) => {
    trackPageView(to)
  })

  document.addEventListener('click', trackOutboundClick, { capture: true })
}
