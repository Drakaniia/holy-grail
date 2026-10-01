import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type User } from 'jsr:@supabase/supabase-js@2'
import {
  getCorsHeaders,
  getUserFromRequest,
  jsonResponse,
  readServiceRoleKey,
} from '../_shared/http.ts'

const MAX_BODY_BYTES = 2000

function normalizeConfirmedEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function hasMatchingEmail(user: User, confirmedEmail: string) {
  return Boolean(user.email && user.email.trim().toLowerCase() === confirmedEmail)
}

Deno.serve(async (req) => {
  const { allowed, headers: corsHeaders } = getCorsHeaders(
    req.headers.get('origin'),
    'ACCOUNT_ALLOWED_ORIGINS',
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
    return jsonResponse({ error: 'Request payload is too large.' }, 413, corsHeaders)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim()
  const serviceRoleKey = readServiceRoleKey()
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Account deletion service is not configured.' }, 500, corsHeaders)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const user = await getUserFromRequest(adminClient, req)
  if (!user) {
    return jsonResponse({ error: 'Sign in to delete your account.' }, 401, corsHeaders)
  }

  const body = await req.json().catch(() => null)
  const confirmedEmail = normalizeConfirmedEmail(
    body && typeof body === 'object' ? (body as { email?: unknown }).email : null,
  )

  if (!confirmedEmail || !hasMatchingEmail(user, confirmedEmail)) {
    return jsonResponse({ error: 'Type your account email to confirm deletion.' }, 400, corsHeaders)
  }

  const { error } = await adminClient.auth.admin.deleteUser(user.id)
  if (error) {
    return jsonResponse({ error: 'Account could not be deleted.' }, 500, corsHeaders)
  }

  return jsonResponse({ ok: true }, 200, corsHeaders)
})
