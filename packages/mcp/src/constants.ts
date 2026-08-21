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
