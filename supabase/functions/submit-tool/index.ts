import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient, type User } from 'jsr:@supabase/supabase-js@2'

interface SubmissionPayload {
  name?: unknown
  url?: unknown
  description?: unknown
  category?: unknown
  submitter_note?: unknown
}

interface NormalizedSubmission {
  name: string
  url: string
  description: string
  category: string
  submitter_note: string | null
  submitted_by: string | null
  submitted_by_email: string | null
  status: 'pending'
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retry_after_seconds: number
}

const DEFAULT_PUBLIC_SITE_URL = 'https://holy-grail-eta.vercel.app'
const MAX_BODY_BYTES = 12_000
const DEFAULT_RATE_LIMIT = 5
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60 * 60
const CORS_ALLOWED_HEADERS = 'authorization, x-client-info, apikey, content-type'
const CORS_ALLOWED_METHODS = 'POST, OPTIONS'

const CATEGORIES = new Set([
  'Platforms',
  'Development - Cloud & Hosting',
  'Development - CLI Tools',
  'Development - Learning',
  'Development - References',
  'Development - Tooling',
  'Development - UI Libraries',
  'Development - Repositories',
  'Development - MCP',
  'Development - Monitoring',
  'AI - Image',
  'AI - API',
  'AI - Automation',
  'AI - Chat',
  'AI - Video',
  'AI - Other',
  'Design - Inspiration',
  'Design - Fonts',
  'Design - Icons/SVG',
  'Design - Tools',
  'CLI Tools',
  'UI Libraries',
  'Skills',
  'Skills - Agent workflow',
  'Skills - Frontend/UI',
  'Skills - Backend/API',
  'Skills - Data/ML',
  'Skills - DevOps/Deploy',
  'Skills - Security/Review',
  'Skills - Research/Writing',
  'Skills - Other',
  'Other',
])

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
  const configuredOrigins = Deno.env.get('SUBMISSION_ALLOWED_ORIGINS')?.trim()
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
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
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

function normalizeSubmission(rawSubmission: SubmissionPayload | null, user: User | null) {
  const name = readString(rawSubmission?.name, 120)
  const url = normalizeUrl(readString(rawSubmission?.url, 2048))
  const description = readString(rawSubmission?.description, 600)
  const category = readString(rawSubmission?.category, 120)
  const submitterNote = readString(rawSubmission?.submitter_note, 1000)

  if (!name) return { error: 'Name is required.' }
  if (!url) return { error: 'URL must be a valid http:// or https:// address.' }
  if (!description) return { error: 'Description is required.' }
  if (!category || !CATEGORIES.has(category)) return { error: 'Select a valid category.' }

  return {
    submission: {
      category,
      description,
      name,
      status: 'pending',
      submitted_by: user?.id ?? null,
      submitted_by_email: user?.email ?? null,
      submitter_note: submitterNote || null,
      url,
    } satisfies NormalizedSubmission,
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function getAdminUrl() {
  const explicitReviewUrl = Deno.env.get('ADMIN_REVIEW_URL')?.trim()
  if (explicitReviewUrl) {
    return explicitReviewUrl
  }

  const siteUrl = Deno.env.get('PUBLIC_SITE_URL')?.trim()
  if (
    siteUrl &&
    !siteUrl.includes('your-real-vercel-app') &&
    !siteUrl.includes('your-vercel-domain')
  ) {
    return new URL('/admin', siteUrl).toString()
  }

  return new URL('/admin', DEFAULT_PUBLIC_SITE_URL).toString()
}

function buildEmail(submission: NormalizedSubmission, adminUrl: string) {
  const name = escapeHtml(submission.name)
  const url = escapeHtml(submission.url)
  const description = escapeHtml(submission.description)
  const category = escapeHtml(submission.category)
  const note = escapeHtml(submission.submitter_note ?? '')
  const submitterEmail = escapeHtml(submission.submitted_by_email ?? '')
  const reviewUrl = escapeHtml(adminUrl)

  const text = [
    `New Holy Grail submission: ${submission.name}`,
    '',
    `URL: ${submission.url}`,
    `Category: ${submission.category}`,
    `Description: ${submission.description}`,
    submission.submitter_note ? `Reviewer note: ${submission.submitter_note}` : null,
    submission.submitted_by_email ? `Submitted by: ${submission.submitted_by_email}` : null,
    '',
    `Review: ${adminUrl}`,
  ]
    .filter(Boolean)
    .join('\n')

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;color:#111827;line-height:1.5">
      <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6366f1">Holy Grail submission</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.2">${name}</h1>
      <p style="margin:0 0 16px">${description}</p>
      <table style="border-collapse:collapse;margin:0 0 18px;width:100%;font-size:14px">
        <tr><td style="padding:6px 0;color:#6b7280;width:120px">URL</td><td style="padding:6px 0"><a href="${url}">${url}</a></td></tr>
        <tr><td style="padding:6px 0;color:#6b7280">Category</td><td style="padding:6px 0">${category}</td></tr>
        ${submitterEmail ? `<tr><td style="padding:6px 0;color:#6b7280">Submitter</td><td style="padding:6px 0">${submitterEmail}</td></tr>` : ''}
        ${note ? `<tr><td style="padding:6px 0;color:#6b7280">Note</td><td style="padding:6px 0">${note}</td></tr>` : ''}
      </table>
      <a href="${reviewUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:10px 14px;font-weight:700">Review submission</a>
    </div>
  `

  return { html, text }
}

async function notifyAdmin(submission: NormalizedSubmission) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')?.trim()
  const adminEmail = Deno.env.get('ADMIN_EMAIL')?.trim()
  const fromEmail =
    Deno.env.get('SUBMISSION_FROM_EMAIL')?.trim() || 'Holy Grail <onboarding@resend.dev>'

  if (!resendApiKey || !adminEmail) {
    return false
  }

  const adminUrl = getAdminUrl()
  const email = buildEmail(submission, adminUrl)
  const response = await fetch('https://api.resend.com/emails', {
    body: JSON.stringify({
      from: fromEmail,
      html: email.html,
      subject: `New Holy Grail submission: ${submission.name}`,
      text: email.text,
      to: [adminEmail],
    }),
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  return response.ok
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
  const salt = Deno.env.get('SUBMISSION_RATE_LIMIT_SALT')?.trim() || serviceRoleKey
  const key = await sha256Hex(`${salt}:${getClientIp(req)}`)
  const pLimit = readPositiveInteger('SUBMISSION_RATE_LIMIT_MAX', DEFAULT_RATE_LIMIT)
  const pWindowSeconds = readPositiveInteger(
    'SUBMISSION_RATE_LIMIT_WINDOW_SECONDS',
    DEFAULT_RATE_LIMIT_WINDOW_SECONDS,
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
    return jsonResponse({ error: 'Submission payload is too large.' }, 413, corsHeaders)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim()
  const serviceRoleKey = readServiceRoleKey()
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Submission service is not configured.' }, 500, corsHeaders)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const rateLimit = await checkRateLimit(adminClient, req)
  if (!rateLimit.allowed) {
    return jsonResponse({ error: 'Too many submissions. Try again later.' }, 429, corsHeaders, {
      'Retry-After': String(rateLimit.retry_after_seconds),
      'X-RateLimit-Remaining': '0',
    })
  }

  const body = await req.json().catch(() => null)
  const rawSubmission =
    body && typeof body === 'object'
      ? ((body as { submission?: SubmissionPayload }).submission ?? null)
      : null
  const user = await getUserFromRequest(adminClient, req)
  const normalized = normalizeSubmission(rawSubmission, user)

  if ('error' in normalized) {
    return jsonResponse({ error: normalized.error }, 400, corsHeaders, {
      'X-RateLimit-Remaining': String(rateLimit.remaining),
    })
  }

  const { data, error } = await adminClient
    .from('submissions')
    .insert(normalized.submission)
    .select('id')
    .single()

  if (error || !data) {
    return jsonResponse({ error: 'Submission could not be saved.' }, 500, corsHeaders)
  }

  const notified = await notifyAdmin(normalized.submission).catch(() => false)

  return jsonResponse(
    {
      id: data.id,
      notified,
      ok: true,
    },
    201,
    corsHeaders,
    {
      'X-RateLimit-Remaining': String(rateLimit.remaining),
    },
  )
})
