import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient, type User } from 'jsr:@supabase/supabase-js@2'

type SiteIssueType = 'down' | 'deprecated' | 'wrong-url' | 'other'

interface SiteIssuePayload {
  category?: unknown
  issue_type?: unknown
  name?: unknown
  note?: unknown
  slug?: unknown
  url?: unknown
}

interface NormalizedSiteIssueReport {
  category: string | null
  issue_type: SiteIssueType
  name: string
  note: string | null
  reporter_email: string | null
  slug: string
  url: string
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retry_after_seconds: number
}

const DEFAULT_PUBLIC_SITE_URL = 'https://holy-grail-eta.vercel.app'
const MAX_BODY_BYTES = 10_000
const DEFAULT_RATE_LIMIT = 5
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60 * 60
const CORS_ALLOWED_HEADERS = 'authorization, x-client-info, apikey, content-type'
const CORS_ALLOWED_METHODS = 'POST, OPTIONS'

function readPositiveInteger(name: string, fallback: number) {
  const value = Number(Deno.env.get(name))
  return Number.isInteger(value) && value > 0 ? value : fallback
}

function readServiceRoleKey() {
  const legacyKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()
  if (legacyKey) {
    return legacyKey
  }

  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS')?.trim()
  if (!secretKeys) {
    return ''
  }

  try {
    const parsed = JSON.parse(secretKeys)
    if (typeof parsed === 'string') {
      return parsed
    }

    if (parsed && typeof parsed === 'object') {
      const values = Object.values(parsed as Record<string, unknown>)
      const secretKey = values.find(
        (value): value is string => typeof value === 'string' && value.trim().length > 0,
      )

      return secretKey?.trim() ?? ''
    }
  } catch {
    return secretKeys
  }

  return ''
}

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin
  } catch {
    return value.trim().replace(/\/+$/, '')
  }
}

function getAllowedOrigins() {
  const configuredOrigins = (
    Deno.env.get('SITE_REPORT_ALLOWED_ORIGINS') || Deno.env.get('SUBMISSION_ALLOWED_ORIGINS')
  )?.trim()
  const fallbackOrigin = Deno.env.get('PUBLIC_SITE_URL')?.trim() || DEFAULT_PUBLIC_SITE_URL
  const origins = configuredOrigins ? configuredOrigins.split(',') : [fallbackOrigin]

  return new Set(
    origins
      .map((origin) => origin.trim())
      .filter(Boolean)
      .map(normalizeOrigin),
  )
}

function getCorsHeaders(origin: string | null) {
  const allowedOrigins = getAllowedOrigins()
  const normalizedOrigin = origin ? normalizeOrigin(origin) : null
  const allowed = Boolean(normalizedOrigin && allowedOrigins.has(normalizedOrigin))

  return {
    allowed,
    headers: {
      ...(allowed && normalizedOrigin ? { 'Access-Control-Allow-Origin': normalizedOrigin } : {}),
      'Access-Control-Allow-Headers': CORS_ALLOWED_HEADERS,
      'Access-Control-Allow-Methods': CORS_ALLOWED_METHODS,
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  }
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      ...extraHeaders,
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
    },
    status,
  })
}

function readString(value: unknown, maxLength: number) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().slice(0, maxLength)
}

function normalizeUrl(value: string) {
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null
    }

    if (!parsed.hostname || parsed.username || parsed.password) {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

function normalizeIssueType(value: unknown): SiteIssueType {
  if (value === 'down' || value === 'deprecated' || value === 'wrong-url' || value === 'other') {
    return value
  }

  return 'down'
}

function normalizeReport(rawReport: SiteIssuePayload | null, user: User | null) {
  const slug = readString(rawReport?.slug, 160)
  const name = readString(rawReport?.name, 120)
  const url = normalizeUrl(readString(rawReport?.url, 2048))
  const category = readString(rawReport?.category, 120)
  const note = readString(rawReport?.note, 1000)

  if (!slug) return { error: 'Site slug is required.' }
  if (!name) return { error: 'Site name is required.' }
  if (!url) return { error: 'URL must be a valid http:// or https:// address.' }

  return {
    report: {
      category: category || null,
      issue_type: normalizeIssueType(rawReport?.issue_type),
      name,
      note: note || null,
      reporter_email: user?.email ?? null,
      slug,
      url,
    } satisfies NormalizedSiteIssueReport,
  }
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers
    .get('x-forwarded-for')
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    (forwardedFor?.length ? forwardedFor[forwardedFor.length - 1] : null) ||
    'unknown'
  )
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function getUserFromRequest(adminClient: SupabaseClient, req: Request) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')?.trim()

  if (!token || token === anonKey) {
    return null
  }

  const { data, error } = await adminClient.auth.getUser(token)
  if (error) {
    return null
  }

  return data.user ?? null
}

async function checkRateLimit(adminClient: SupabaseClient, req: Request) {
  const serviceRoleKey = readServiceRoleKey()
  const salt =
    Deno.env.get('SITE_REPORT_RATE_LIMIT_SALT')?.trim() ||
    Deno.env.get('SUBMISSION_RATE_LIMIT_SALT')?.trim() ||
    serviceRoleKey
  const key = await sha256Hex(`${salt}:site-report:${getClientIp(req)}`)
  const submissionLimit = readPositiveInteger('SUBMISSION_RATE_LIMIT_MAX', DEFAULT_RATE_LIMIT)
  const submissionWindowSeconds = readPositiveInteger(
    'SUBMISSION_RATE_LIMIT_WINDOW_SECONDS',
    DEFAULT_RATE_LIMIT_WINDOW_SECONDS,
  )
  const pLimit = readPositiveInteger('SITE_REPORT_RATE_LIMIT_MAX', submissionLimit)
  const pWindowSeconds = readPositiveInteger(
    'SITE_REPORT_RATE_LIMIT_WINDOW_SECONDS',
    submissionWindowSeconds,
  )

  const { data, error } = await adminClient
    .rpc('check_submission_rate_limit', {
      p_key: key,
      p_limit: pLimit,
      p_window_seconds: pWindowSeconds,
    })
    .single()

  if (error || !data) {
    return {
      allowed: false,
      remaining: 0,
      retry_after_seconds: 60,
    } satisfies RateLimitResult
  }

  return data as RateLimitResult
}

async function saveSiteIssueReport(adminClient: SupabaseClient, report: NormalizedSiteIssueReport) {
  const { data, error } = await adminClient
    .from('site_issue_reports')
    .insert({
      ...report,
      status: 'open',
    })
    .select('id')
    .single()

  if (error || !data) {
    throw error ?? new Error('Site issue report could not be saved.')
  }

  return data.id as string
}

Deno.serve(async (req) => {
  const { allowed, headers: corsHeaders } = getCorsHeaders(req.headers.get('origin'))

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: allowed ? 204 : 403,
    })
  }

  if (!allowed) {
    return jsonResponse({ error: 'Origin is not allowed.' }, 403, corsHeaders)
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405, corsHeaders, {
      Allow: 'POST, OPTIONS',
    })
  }

  const contentLength = Number(req.headers.get('content-length') ?? 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'Report payload is too large.' }, 413, corsHeaders)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim()
  const serviceRoleKey = readServiceRoleKey()
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Site report service is not configured.' }, 500, corsHeaders)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const rateLimit = await checkRateLimit(adminClient, req)
  if (!rateLimit.allowed) {
    return jsonResponse({ error: 'Too many site reports. Try again later.' }, 429, corsHeaders, {
      'Retry-After': String(rateLimit.retry_after_seconds),
      'X-RateLimit-Remaining': '0',
    })
  }

  const body = await req.json().catch(() => null)
  const rawReport =
    body && typeof body === 'object'
      ? ((body as { report?: SiteIssuePayload }).report ?? null)
      : null
  const user = await getUserFromRequest(adminClient, req)
  const normalized = normalizeReport(rawReport, user)

  if ('error' in normalized) {
    return jsonResponse({ error: normalized.error }, 400, corsHeaders, {
      'X-RateLimit-Remaining': String(rateLimit.remaining),
    })
  }

  const reportId = await saveSiteIssueReport(adminClient, normalized.report).catch(() => null)
  if (!reportId) {
    return jsonResponse({ error: 'Site report could not be saved.' }, 500, corsHeaders, {
      'X-RateLimit-Remaining': String(rateLimit.remaining),
    })
  }

  return jsonResponse(
    {
      id: reportId,
      ok: true,
    },
    201,
    corsHeaders,
    {
      'X-RateLimit-Remaining': String(rateLimit.remaining),
    },
  )
})
