// Index loaders. The server reads generated flat JSON — never YAML at runtime.
//
// Resolution order per index:
//   1. Repo data dirs relative to the package location (dev/monorepo mode).
//      Generated indexes live in web/public/content; site-previews.json is the
//      one exception — the SPA imports it, so it stays in web/src/content.
//   2. Bundled snapshot copied into the package at publish time (mcp/data).
//
// Loaders are lazy with module-level caches; indexes are static content so a
// process loads each file at most once.

import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { INDEX_FILES } from './constants.js'
import type { Extension, McpServer, Preview, Site, Skill } from './types.js'

const moduleDir = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(moduleDir, '..')
const repoPublicDir = resolve(pkgRoot, '../public/content')
const repoSrcDir = resolve(pkgRoot, '../src/content')
const bundledDataDir = resolve(pkgRoot, 'data')

function resolveIndexFile(kind: keyof typeof INDEX_FILES): string {
  const fileName = INDEX_FILES[kind]
  const repoDir = kind === 'previews' ? repoSrcDir : repoPublicDir
  const repoPath = resolve(repoDir, fileName)
  if (existsSync(repoPath)) return repoPath

  return resolve(bundledDataDir, fileName)
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
 * over all file-based resolution.
 */
export function setIndexSnapshot(snapshot: IndexSnapshot): void {
  sitesCache = snapshot.sites
  extensionsCache = snapshot.extensions
  mcpCache = snapshot.mcp
  skillsCache = snapshot.skills
  previewsCache = snapshot.previews
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
