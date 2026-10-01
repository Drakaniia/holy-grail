import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient, type User } from 'jsr:@supabase/supabase-js@2'
import {
  DEFAULT_PUBLIC_SITE_URL,
  getCorsHeaders,
  getUserFromRequest,
  jsonResponse,
  readServiceRoleKey,
} from '../_shared/http.ts'
import { checkRateLimit } from '../_shared/rate-limit.ts'
import { normalizeUrl, readString } from '../_shared/validate.ts'

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

const MAX_BODY_BYTES = 12_000

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
