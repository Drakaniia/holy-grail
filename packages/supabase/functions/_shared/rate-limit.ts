import { type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { readServiceRoleKey } from './http.ts'

const DEFAULT_RATE_LIMIT = 5
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60 * 60

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retry_after_seconds: number
}

function readPositiveInteger(name: string, fallback: number) {
  const value = Number(Deno.env.get(name))
  return Number.isInteger(value) && value > 0 ? value : fallback
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

export async function checkRateLimit(adminClient: SupabaseClient, req: Request, scope = '') {
  const serviceRoleKey = readServiceRoleKey()
  const salt = Deno.env.get('SUBMISSION_RATE_LIMIT_SALT')?.trim() || serviceRoleKey
  const key = await sha256Hex(`${salt}:${scope}${getClientIp(req)}`)
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
