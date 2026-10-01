import { type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

export const DEFAULT_PUBLIC_SITE_URL = 'https://holy-grail-eta.vercel.app'

const CORS_ALLOWED_HEADERS = 'authorization, x-client-info, apikey, content-type'
const CORS_ALLOWED_METHODS = 'POST, OPTIONS'

export function readServiceRoleKey() {
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

function getAllowedOrigins(configuredOriginsEnvVar: string) {
  const configuredOrigins = Deno.env.get(configuredOriginsEnvVar)?.trim()
  const fallbackOrigin = Deno.env.get('PUBLIC_SITE_URL')?.trim() || DEFAULT_PUBLIC_SITE_URL
  const origins = configuredOrigins ? configuredOrigins.split(',') : [fallbackOrigin]

  return new Set(
    origins
      .map((origin) => origin.trim())
      .filter(Boolean)
      .map(normalizeOrigin),
  )
}

export function getCorsHeaders(origin: string | null, configuredOriginsEnvVar: string) {
  const allowedOrigins = getAllowedOrigins(configuredOriginsEnvVar)
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

export function jsonResponse(
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

export async function getUserFromRequest(adminClient: SupabaseClient, req: Request) {
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
