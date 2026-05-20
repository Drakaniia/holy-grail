import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

interface SubmissionPayload {
  name?: unknown
  url?: unknown
  description?: unknown
  category?: unknown
  submitter_note?: unknown
  submitted_by_email?: unknown
}

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
}

const DEFAULT_PUBLIC_SITE_URL = 'https://holy-grail-eta.vercel.app'

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
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

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function getAdminUrl(req: Request) {
  const explicitReviewUrl = Deno.env.get('ADMIN_REVIEW_URL')?.trim()
  if (explicitReviewUrl) {
    return explicitReviewUrl
  }

  const siteUrl = Deno.env.get('PUBLIC_SITE_URL')?.trim()
  if (siteUrl && !siteUrl.includes('your-real-vercel-app') && !siteUrl.includes('your-vercel-domain')) {
    return new URL('/admin', siteUrl).toString()
  }

  return new URL('/admin', DEFAULT_PUBLIC_SITE_URL).toString()
}

function buildEmail(submission: Record<string, string>, adminUrl: string) {
  const name = escapeHtml(submission.name)
  const url = escapeHtml(submission.url)
  const description = escapeHtml(submission.description)
  const category = escapeHtml(submission.category)
  const note = escapeHtml(submission.submitter_note)
  const submitterEmail = escapeHtml(submission.submitted_by_email)
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
  ].filter(Boolean).join('\n')

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY')?.trim()
  const adminEmail = Deno.env.get('ADMIN_EMAIL')?.trim()
  const fromEmail =
    Deno.env.get('SUBMISSION_FROM_EMAIL')?.trim() || 'Holy Grail <onboarding@resend.dev>'

  if (!resendApiKey || !adminEmail) {
    return jsonResponse({ error: 'Submission email is not configured.' }, 500)
  }

  const body = await req.json().catch(() => null)
  const rawSubmission = body && typeof body === 'object'
    ? (body as { submission?: SubmissionPayload }).submission
    : null

  const submission = {
    category: readString(rawSubmission?.category, 120),
    description: readString(rawSubmission?.description, 600),
    name: readString(rawSubmission?.name, 120),
    submitter_note: readString(rawSubmission?.submitter_note, 1000),
    submitted_by_email: readString(rawSubmission?.submitted_by_email, 320),
    url: readString(rawSubmission?.url, 2048),
  }

  if (!submission.name || !submission.url || !submission.description || !submission.category) {
    return jsonResponse({ error: 'Submission payload is incomplete.' }, 400)
  }

  const adminUrl = getAdminUrl(req)
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

  if (!response.ok) {
    const details = await response.text()
    return jsonResponse(
      {
        details: details.slice(0, 500),
        error: 'Resend rejected the email request.',
      },
      502,
    )
  }

  return jsonResponse({ ok: true, reviewUrl: adminUrl })
})
