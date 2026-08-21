// Index loaders. The server reads generated flat JSON — never YAML at runtime.
//
// Resolution order per index:
//   1. HOLY_GRAIL_DATA_DIR env var (explicit override; holds all index files
//      except skills, which falls back to public/content in repo mode).
//   2. Repo content dirs relative to the package location (dev/monorepo mode).
//   3. Bundled snapshot copied into the package at publish time (mcp/data).
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
const repoContentDir = resolve(pkgRoot, '../src/content')
const repoPublicDir = resolve(pkgRoot, '../public/content')
const bundledDataDir = resolve(pkgRoot, 'data')

function resolveIndexFile(kind: keyof typeof INDEX_FILES): string {
  const fileName = INDEX_FILES[kind]
  const override = process.env.HOLY_GRAIL_DATA_DIR
  if (override) return resolve(override, fileName)

  const repoDir = kind === 'skills' ? repoPublicDir : repoContentDir
  const repoPath = resolve(repoDir, fileName)
  if (existsSync(repoPath)) return repoPath

  return resolve(bundledDataDir, fileName)
}

function readIndex<T>(kind: keyof typeof INDEX_FILES): T[] {
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
  if (!Array.isArray(parsed)) {
    throw new Error(`Index ${file} must be a JSON array, got ${typeof parsed}`)
  }
  return parsed as T[]
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
  if (sitesCache === null) sitesCache = readIndex<Site>('sites')
  return sitesCache
}

export function loadExtensions(): Extension[] {
  if (extensionsCache === null) extensionsCache = readIndex<Extension>('extensions')
  return extensionsCache
}

export function loadMcpServers(): McpServer[] {
  if (mcpCache === null) mcpCache = readIndex<McpServer>('mcp')
  return mcpCache
}

export function loadSkills(): Skill[] {
  if (skillsCache === null) skillsCache = readIndex<Skill>('skills')
  return skillsCache
}

export function loadPreviews(): Record<string, Preview> {
  if (previewsCache === null) {
    const file = resolveIndexFile('previews')
    let parsed: unknown
    try {
      parsed = JSON.parse(readFileSync(file, 'utf-8'))
    } catch (error) {
      throw new Error(
        `Failed to load previews index from ${file}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      )
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`Previews index ${file} must be a JSON object keyed by slug`)
    }
    previewsCache = parsed as Record<string, Preview>
  }
  return previewsCache
}

/** Clears all module-level caches. Used by tests; harmless in production. */
export function clearDataCaches(): void {
  sitesCache = null
  extensionsCache = null
  mcpCache = null
  skillsCache = null
  previewsCache = null
}
