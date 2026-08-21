import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient, type User } from 'jsr:@supabase/supabase-js@2'

const DEFAULT_PUBLIC_SITE_URL = 'https://holy-grail-eta.vercel.app'
const CORS_ALLOWED_HEADERS = 'authorization, x-client-info, apikey, content-type'
const CORS_ALLOWED_METHODS = 'POST, OPTIONS'
const MAX_BODY_BYTES = 2000

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
  const configuredOrigins = Deno.env.get('ACCOUNT_ALLOWED_ORIGINS')?.trim()
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

function normalizeConfirmedEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function hasMatchingEmail(user: User, confirmedEmail: string) {
  return Boolean(user.email && user.email.trim().toLowerCase() === confirmedEmail)
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
