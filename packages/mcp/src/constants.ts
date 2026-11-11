export const SERVER_NAME = 'holy-grail-mcp-server'
export const SERVER_VERSION = '1.0.0'

// Response size cap; oversized payloads truncate with a pointer to filters/paging.
export const CHARACTER_LIMIT = 25000

// Search
export const MIN_QUERY_LENGTH = 2
export const MAX_QUERY_LENGTH = 200
export const SEARCH_DEFAULT_LIMIT = 10
export const SEARCH_MAX_LIMIT = 50

// Lists
export const LIST_DEFAULT_LIMIT = 20
export const LIST_MAX_LIMIT = 100

// Skill files (get_skill_files / install_skill)
export const SKILL_FILES_CHARACTER_LIMIT = 100_000
export const SKILL_MAX_FILES = 60
export const SKILL_MAX_FILE_BYTES = 256 * 1024
export const SKILL_MAX_TOTAL_BYTES = 2 * 1024 * 1024

// Live catalog data: indexes are re-fetched from the deployed site at most once
// per TTL; a failed or slow fetch keeps serving the bundled snapshot.
export const DEFAULT_SITE_URL = 'https://holy-grail-eta.vercel.app'
export const LIVE_TTL_MS = 5 * 60 * 1000
export const LIVE_TIMEOUT_MS = 8000

// Anonymous submissions go to the public submit-tool Edge Function, which
// validates, rate-limits per IP and queues them for moderation.
export const DEFAULT_SUPABASE_URL = 'https://roeuatqxhekndkszbebq.supabase.co'
export const SUBMIT_TIMEOUT_MS = 15000

/** Base URL of the deployed site used for live data (HOLY_GRAIL_BASE_URL overrides). */
export function siteBaseUrl(): string {
  const base = process.env.HOLY_GRAIL_BASE_URL?.trim() || DEFAULT_SITE_URL
  return base.endsWith('/') ? base : `${base}/`
}

// Generated index file names (relative to the resolved data dir).
export const INDEX_FILES = {
  sites: 'sites-index.json',
  extensions: 'extensions-index.json',
  mcp: 'mcp-index.json',
  skills: 'skills-registry.json',
  previews: 'site-previews.json',
} as const

/** Absolutizes a preview path with HOLY_GRAIL_BASE_URL when set, else keeps it relative. */
export function absolutizeUrl(path: string): string {
  const base = process.env.HOLY_GRAIL_BASE_URL
  if (!base || !path) return path
  const normalized = base.endsWith('/') ? base : `${base}/`
  try {
    return new URL(path.replace(/^\//, ''), normalized).toString()
  } catch {
    return path
  }
}
