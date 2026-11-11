// Index loaders. The server reads generated flat JSON — never YAML at runtime.
//
// Base resolution order per index (synchronous, first load only):
//   1. Repo data dirs relative to the package location (dev/monorepo mode).
//      Generated indexes live in web/public/content; site-previews.json is the
//      one exception — the SPA imports it, so it stays in web/src/content.
//   2. Bundled snapshot copied into the package at publish time (mcp/data).
//   (The Vercel function injects the snapshot via setIndexSnapshot instead.)
//
// Live mode: ensureCatalog() re-fetches the four catalog indexes from the
// deployed site (HOLY_GRAIL_BASE_URL, default the public site) at most once per
// LIVE_TTL_MS and swaps them in atomically. The first call waits for the fetch
// (bounded by LIVE_TIMEOUT_MS); later refreshes are stale-while-revalidate. Any
// failure keeps serving whatever is loaded, so the server never goes dark.
// Live mode is on by default, except inside the monorepo (local indexes are
// fresher than the deployment); HOLY_GRAIL_LIVE=0/1 forces it off/on.
// site-previews.json is not served publicly, so previews always come from the
// base data.

import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { INDEX_FILES, LIVE_TIMEOUT_MS, LIVE_TTL_MS, siteBaseUrl } from './constants.js'
import type { Extension, McpServer, Preview, Site, Skill } from './types.js'

const moduleDir = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(moduleDir, '..')
const repoPublicDir = resolve(pkgRoot, '../web/public/content')
const repoSrcDir = resolve(pkgRoot, '../web/src/content')
const bundledDataDir = resolve(pkgRoot, 'data')

function repoPath(kind: keyof typeof INDEX_FILES): string {
  const repoDir = kind === 'previews' ? repoSrcDir : repoPublicDir
  return resolve(repoDir, INDEX_FILES[kind])
}

function resolveIndexFile(kind: keyof typeof INDEX_FILES): string {
  const fromRepo = repoPath(kind)
  if (existsSync(fromRepo)) return fromRepo
  return resolve(bundledDataDir, INDEX_FILES[kind])
}

/** Every index is a JSON array except `site-previews.json`, an object keyed by slug. */
type IndexShape = 'array' | 'object'

function readIndex<T>(kind: keyof typeof INDEX_FILES, shape: IndexShape = 'array'): T {
  const file = resolveIndexFile(kind)
  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(file, 'utf-8'))
  } catch (error) {
    throw new Error(
      `Failed to load ${kind} index from ${file}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    )
  }
  const isObject = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
  if (shape === 'array' ? !Array.isArray(parsed) : !isObject) {
    throw new Error(`Index ${file} must be a JSON ${shape}, got ${typeof parsed}`)
  }
  return parsed as T
}

let sitesCache: Site[] | null = null
let extensionsCache: Extension[] | null = null
let mcpCache: McpServer[] | null = null
let skillsCache: Skill[] | null = null
let previewsCache: Record<string, Preview> | null = null
let snapshotInjected = false

export interface IndexSnapshot {
  sites: Site[]
  extensions: Extension[]
  mcp: McpServer[]
  skills: Skill[]
  previews: Record<string, Preview>
}

/**
 * Injects the catalog data directly (no filesystem reads). Used by the Vercel
 * function, which bundles the snapshot JSON with the function. Takes precedence
 * over all file-based resolution; live refreshes still apply on top.
 */
export function setIndexSnapshot(snapshot: IndexSnapshot): void {
  sitesCache = snapshot.sites
  extensionsCache = snapshot.extensions
  mcpCache = snapshot.mcp
  skillsCache = snapshot.skills
  previewsCache = snapshot.previews
  snapshotInjected = true
  catalogVersion++
}

export function loadSites(): Site[] {
  if (sitesCache === null) sitesCache = readIndex<Site[]>('sites')
  return sitesCache
}

export function loadExtensions(): Extension[] {
  if (extensionsCache === null) extensionsCache = readIndex<Extension[]>('extensions')
  return extensionsCache
}

export function loadMcpServers(): McpServer[] {
  if (mcpCache === null) mcpCache = readIndex<McpServer[]>('mcp')
  return mcpCache
}

export function loadSkills(): Skill[] {
  if (skillsCache === null) skillsCache = readIndex<Skill[]>('skills')
  return skillsCache
}

export function loadPreviews(): Record<string, Preview> {
  if (previewsCache === null)
    previewsCache = readIndex<Record<string, Preview>>('previews', 'object')
  return previewsCache
}

// ---- Live data ----

/** Bumped whenever the catalog arrays are replaced; derived caches key on it. */
let catalogVersion = 0

export function getCatalogVersion(): number {
  return catalogVersion
}

export interface CatalogStatus {
  source: 'live' | 'snapshot'
  liveEnabled: boolean
  baseUrl: string | null
  fetchedAt: string | null
  lastError: string | null
}

let liveFetchedAt: string | null = null
let liveError: string | null = null
let lastAttemptAt = 0
let inflight: Promise<void> | null = null

function repoDataAvailable(): boolean {
  return existsSync(repoPath('sites'))
}

export function isLiveEnabled(): boolean {
  const flag = process.env.HOLY_GRAIL_LIVE?.trim().toLowerCase()
  if (flag === '0' || flag === 'false' || flag === 'off' || flag === 'no') return false
  if (flag === '1' || flag === 'true' || flag === 'on' || flag === 'yes') return true
  return snapshotInjected || !repoDataAvailable()
}

export function getCatalogStatus(): CatalogStatus {
  const liveEnabled = isLiveEnabled()
  return {
    source: liveFetchedAt ? 'live' : 'snapshot',
    liveEnabled,
    baseUrl: liveEnabled ? siteBaseUrl() : null,
    fetchedAt: liveFetchedAt,
    lastError: liveError,
  }
}

type LiveKind = 'sites' | 'extensions' | 'mcp' | 'skills'

async function fetchIndex(kind: LiveKind): Promise<unknown[]> {
  const url = new URL(`content/${INDEX_FILES[kind]}`, siteBaseUrl()).toString()
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': 'holy-grail-mcp' },
    signal: AbortSignal.timeout(LIVE_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`${url} responded ${response.status}`)
  const parsed: unknown = await response.json()
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`${url} did not return a non-empty JSON array`)
  }
  const first: unknown = parsed[0]
  if (
    first === null ||
    typeof first !== 'object' ||
    typeof Reflect.get(first, 'slug') !== 'string'
  ) {
    throw new Error(`${url} returned records without a slug`)
  }
  return parsed
}

async function refreshLive(): Promise<void> {
  try {
    const [sites, extensions, mcp, skills] = await Promise.all([
      fetchIndex('sites'),
      fetchIndex('extensions'),
      fetchIndex('mcp'),
      fetchIndex('skills'),
    ])
    // Swap all four together so a request never sees a mixed catalog.
    sitesCache = sites as Site[]
    extensionsCache = extensions as Extension[]
    mcpCache = mcp as McpServer[]
    skillsCache = skills as Skill[]
    catalogVersion++
    liveFetchedAt = new Date().toISOString()
    liveError = null
  } catch (error) {
    liveError = error instanceof Error ? error.message : String(error)
  } finally {
    lastAttemptAt = Date.now()
  }
}

/**
 * Makes sure the catalog is loaded and, in live mode, no older than the TTL.
 * Call at the start of every tool/resource/prompt handler. Never throws.
 */
export async function ensureCatalog(): Promise<void> {
  if (!isLiveEnabled()) return
  if (lastAttemptAt !== 0 && Date.now() - lastAttemptAt < LIVE_TTL_MS) return
  if (!inflight) {
    inflight = refreshLive().finally(() => {
      inflight = null
    })
  }
  // First load waits (bounded by the fetch timeout); later refreshes run in
  // the background while the current data keeps serving.
  if (lastAttemptAt === 0) await inflight
}
