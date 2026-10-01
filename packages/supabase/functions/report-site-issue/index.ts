import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient, type User } from 'jsr:@supabase/supabase-js@2'
import {
  getCorsHeaders,
  getUserFromRequest,
  jsonResponse,
  readServiceRoleKey,
} from '../_shared/http.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { normalizeUrl, readString } from '../_shared/validate.ts'

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

const MAX_BODY_BYTES = 10_000

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
  const { allowed, headers: corsHeaders } = getCorsHeaders(
    req.headers.get('origin'),
    'SUBMISSION_ALLOWED_ORIGINS',
  )

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

  const rateLimit = await checkRateLimit(adminClient, req, 'site-report:')
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
