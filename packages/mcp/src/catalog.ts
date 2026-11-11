// Kind-agnostic view of the catalog: one flat CatalogEntry per site,
// extension, MCP server and skill. Used by the discovery tools (categories,
// tags, trending, related) and prompts, which treat every kind uniformly.
// Rebuilt whenever the live loader swaps in new data.

import { getCatalogVersion, loadExtensions, loadMcpServers, loadSites, loadSkills } from './data.js'
import type { CatalogKind } from './types.js'

export const CATALOG_KINDS = [
  'site',
  'extension',
  'mcp',
  'skill',
] as const satisfies readonly CatalogKind[]

export interface CatalogEntry {
  kind: CatalogKind
  slug: string
  name: string
  description: string
  category: string
  parentCategory: string
  subcategory: string | null
  tags: string[]
  featured: boolean
  verified: boolean
  /** Days since the entry was added; null when unknown. */
  addedDaysAgo: number | null
  /** Stars for sites, users for extensions, uses + views for skills, 0 otherwise. */
  popularity: number
  /** SPA route, e.g. /sites/appwrite. */
  route: string
  website: string
  /** Slugs listed as similar tools on the record itself. */
  similarSlugs: string[]
}

const ROUTE_PREFIX: Record<CatalogKind, string> = {
  site: 'sites',
  extension: 'extensions',
  mcp: 'mcp',
  skill: 'skills',
}

function days(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function buildEntries(): CatalogEntry[] {
  const entries: CatalogEntry[] = []
  for (const s of loadSites()) {
    entries.push({
      kind: 'site',
      slug: s.slug,
      name: s.name,
      description: s.description,
      category: s.category ?? '',
      parentCategory: s.parentCategory ?? '',
      subcategory: s.subcategory ?? null,
      tags: s.tags ?? [],
      featured: Boolean(s.featured),
      verified: Boolean(s.verified),
      addedDaysAgo: days(s.addedDaysAgo),
      popularity: (s.stars ?? 0) + (s.watchers ?? 0),
      route: `/${ROUTE_PREFIX.site}/${s.slug}`,
      website: s.website ?? '',
      similarSlugs: (s.similarTools ?? []).map((t) => t.slug),
    })
  }
  for (const e of loadExtensions()) {
    entries.push({
      kind: 'extension',
      slug: e.slug,
      name: e.name,
      description: e.description,
      category: e.category ?? '',
      parentCategory: e.parentCategory ?? '',
      subcategory: e.subcategory ?? null,
      tags: e.tags ?? [],
      featured: Boolean(e.featured),
      verified: Boolean(e.verified),
      addedDaysAgo: days(e.addedDaysAgo),
      popularity: e.userCount ?? 0,
      route: `/${ROUTE_PREFIX.extension}/${e.slug}`,
      website: e.website ?? '',
      similarSlugs: (e.similarTools ?? []).map((t) => t.slug),
    })
  }
  for (const m of loadMcpServers()) {
    entries.push({
      kind: 'mcp',
      slug: m.slug,
      name: m.name,
      description: m.description,
      category: m.category ?? '',
      parentCategory: m.parentCategory ?? '',
      subcategory: null,
      tags: m.tags ?? [],
      featured: Boolean(m.featured),
      verified: Boolean(m.verified),
      addedDaysAgo: null,
      popularity: 0,
      route: `/${ROUTE_PREFIX.mcp}/${m.slug}`,
      website: m.website || m.sourceCode || '',
      similarSlugs: [],
    })
  }
  for (const k of loadSkills()) {
    entries.push({
      kind: 'skill',
      slug: k.slug,
      name: k.title,
      description: k.description,
      category: k.category ?? '',
      parentCategory: k.parentCategory ?? '',
      subcategory: null,
      tags: k.tags ?? [],
      featured: Boolean(k.featured),
      verified: false,
      addedDaysAgo: days(k.addedDaysAgo),
      popularity: (k.uses ?? 0) + (k.views ?? 0),
      route: `/${ROUTE_PREFIX.skill}/${k.slug}`,
      website: k.repoLink ? `https://github.com/${k.repoLink}` : '',
      similarSlugs: [],
    })
  }
  return entries
}

let cache: CatalogEntry[] | null = null
let cacheVersion = -1

/** Every catalog entry, optionally restricted to one kind. */
export function catalogEntries(kind?: CatalogKind): CatalogEntry[] {
  const version = getCatalogVersion()
  if (cache === null || cacheVersion !== version) {
    cache = buildEntries()
    cacheVersion = getCatalogVersion()
  }
  return kind ? cache.filter((e) => e.kind === kind) : cache
}

export function findEntry(kind: CatalogKind, slug: string): CatalogEntry | undefined {
  return catalogEntries(kind).find((e) => e.slug === slug)
}

export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase()
}

/** Compact listing row shared by the discovery tools' JSON payloads. */
export function entrySummary(entry: CatalogEntry) {
  return {
    kind: entry.kind,
    slug: entry.slug,
    name: entry.name,
    description: entry.description,
    category: entry.category,
    tags: entry.tags,
    route: entry.route,
  }
}

/** The tool that returns the full record for an entry kind. */
export const DETAIL_TOOL: Record<CatalogKind, string> = {
  site: 'get_site',
  extension: 'get_extension',
  mcp: 'get_mcp_server',
  skill: 'get_skill',
}
