// Ported scoring engine. The pure functions below are a verbatim port of
// src/composables/useSmartSearch.ts from the Holy Grail SPA so MCP search
// behavior matches the site. Drift is guarded by evals/search-corpus.test.ts
// (pinned corpus) and tests/mcp-search-mirror.test.ts (SPA-vs-port parity).
//
// Not ported: the Vue composable, navigation/collection items (the MCP server
// only searches catalog entities), favicon helpers output, and the reactive
// cache (replaced by a plain module-level Map keyed query → itemId → score).

import { loadExtensions, loadMcpServers, loadSites, loadSkills } from './data.js'
import type { Extension, McpServer, MatchStrength, Site, Skill } from './types.js'

export type SearchKind = 'site' | 'extension' | 'mcp' | 'skill'

export interface SearchHit {
  kind: SearchKind
  slug: string
  name: string
  description: string
  score: number
  matchStrength: MatchStrength
  route: string
}

// ---- Pre-normalized, pre-computed search fields ----

interface SearchField {
  normalized: string
  compact: string
  tokens: string[]
  weight: number
}

interface SearchItem {
  id: string
  kind: SearchKind
  title: string
  description: string
  category: string
  eyebrow: string
  to: string
  tags: string[]
  logoUrl: string | null
  domainLabel: string | null
  fields: SearchField[]
  popularity: number
  featured: boolean
}

export const MAX_RESULTS = 10
export const DIRECT_MATCH_SCORE = 205
export const CLOSE_MATCH_SCORE = 118

const routeLabelMap: Record<string, string> = {
  ai: 'AI',
  design: 'Design',
  development: 'Development',
  'cli-tools': 'CLI Tools',
  'ui-libraries': 'UI Libraries',
  watch: 'Watch',
  downloads: 'Downloads',
  image: 'Image',
  api: 'API',
  detector: 'Detector',
  automation: 'Automation',
  'agent-skills': 'Agent Skills',
  video: 'Video',
  ml: 'Machine Learning',
  chat: 'Chat',
  wb: 'Website Development',
  research: 'Research',
  ppt: 'PPT',
  others: 'Others',
  inspiration: 'Inspiration',
  fonts: 'Fonts',
  '3d': '3D',
  prompts: 'Prompts',
  'icons-svg': 'Icons/SVG',
  md: 'MD',
  'design-tools': 'Design Tools',
  learning: 'Learning',
  'cloud-hosting': 'Cloud & Hosting',
  references: 'References',
  tooling: 'Tooling',
  repositories: 'Repositories',
  mcp: 'MCP',
  monitoring: 'Monitoring',
  anime: 'Anime',
  movies: 'Movies',
  'game-download': 'Game Download',
  'vfx-download': 'VFX Download',
  'software-download': 'Software Download',
  torrents: 'Torrents',
}

// ---- Text utilities ----

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[\s/_-]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim()
}

export function tokenize(value: string): string[] {
  return value.split(' ').filter((t) => t.length > 0)
}

export function compactText(value: string): string {
  return value.replaceAll(' ', '')
}

// ---- Pre-compute all field variants at creation time ----

function createField(rawValue: string, weight: number): SearchField {
  const normalized = normalizeText(rawValue)
  return {
    normalized,
    compact: compactText(normalized),
    tokens: tokenize(normalized),
    weight,
  }
}

function createSearchFields(fields: {
  title: string
  titleWithDomain?: string
  description: string
  category: string
  tags: string[]
  domain?: string
  source: string
}): SearchField[] {
  const out: SearchField[] = [
    createField(fields.title, 118),
    createField(fields.tags.join(' '), 96),
    createField(fields.category, 84),
    createField(fields.description, 62),
    createField(fields.source, 38),
  ]
  if (fields.titleWithDomain) out.push(createField(fields.titleWithDomain, 126))
  if (fields.domain) out.push(createField(fields.domain, 112))
  return out
}

// ---- Scoring (works on pre-normalized data) ----

export function scoreSearchItem(normalizedQuery: string, item: SearchItem): number {
  const compactQuery = compactText(normalizedQuery)
  const terms = tokenize(normalizedQuery)

  let bestFull = 0
  let bestCompact = 0
  const termScores: number[] = []

  for (const field of item.fields) {
    const fullSim = getTextSimilarity(normalizedQuery, field)
    if (fullSim * field.weight > bestFull) bestFull = fullSim * field.weight

    if (compactQuery) {
      const compactSim = getTextSimilarityCompact(compactQuery, field)
      if (compactSim * field.weight > bestCompact) bestCompact = compactSim * field.weight
    }

    const scores = terms.map((t) => getTextSimilarity(t, field) * field.weight)
    if (scores.length > 0) {
      const best = Math.max(...scores)
      termScores.push(best)
    }
  }

  const avgTermScore =
    termScores.length > 0 ? termScores.reduce((s, x) => s + x, 0) / termScores.length : 0
  const coverage =
    termScores.length > 0 ? termScores.filter((s) => s >= 42).length / termScores.length : 0
  const exactBoost = getExactTokenBoost(terms, item)
  const popBoost = Math.min(Math.log10(item.popularity + 10) * 2.6, 10)
  const featBoost = item.featured ? 5 : 0

  return (
    Math.max(bestFull, bestCompact) * 1.12 +
    avgTermScore * 0.76 +
    coverage * 28 +
    exactBoost +
    popBoost +
    featBoost
  )
}

function getExactTokenBoost(terms: string[], item: SearchItem): number {
  const termSet = new Set(terms)
  const matched = new Set<string>()
  for (const field of item.fields) {
    for (const term of termSet) {
      if (field.tokens.includes(term)) matched.add(term)
    }
  }
  // SPA grants collections 88 and entities 56; the MCP corpus has no collections.
  if (terms.length > 0 && matched.size >= terms.length) return 56
  return 0
}

function getTextSimilarity(needle: string, field: SearchField): number {
  if (!needle) return 0
  const haystack = field.normalized
  if (!haystack) return 0
  if (haystack === needle) return 1
  if (haystack.startsWith(needle)) return 0.95
  if (haystack.includes(needle)) return 0.86

  // compact matching
  const compactNeedle = compactText(needle)
  if (compactNeedle && field.compact.includes(compactNeedle)) return 0.82

  // acronym
  const firstChars = field.tokens.map((w) => w[0] ?? '').join('')
  if (compactNeedle && firstChars.startsWith(compactNeedle)) return 0.8

  return Math.max(
    getOrderedCharacterScore(compactNeedle, field.compact),
    getNearestWordScore(needle, field),
  )
}

function getTextSimilarityCompact(compactQuery: string, field: SearchField): number {
  if (!compactQuery || !field.compact) return 0
  if (field.compact === compactQuery) return 1
  if (field.compact.includes(compactQuery)) return 0.82
  const firstChars = field.tokens.map((w) => w[0] ?? '').join('')
  if (firstChars.startsWith(compactQuery)) return 0.8
  return getOrderedCharacterScore(compactQuery, field.compact)
}

function getOrderedCharacterScore(needle: string, haystack: string): number {
  if (!needle || !haystack || needle.length > haystack.length) return 0
  let ni = 0
  let run = 0
  let bestRun = 0
  for (const ch of haystack) {
    if (ch === needle[ni]) {
      ni++
      run++
      if (run > bestRun) bestRun = run
      if (ni === needle.length) break
    } else {
      run = 0
    }
  }
  if (ni !== needle.length) return 0
  const density = needle.length / haystack.length
  const runQuality = bestRun / needle.length
  return 0.42 + density * 0.2 + runQuality * 0.26
}

function getNearestWordScore(needle: string, field: SearchField): number {
  let best = 0
  for (const candidate of field.tokens) {
    const longest = Math.max(needle.length, candidate.length)
    if (longest === 0) continue
    const sim = 1 - levenshtein(needle, candidate) / longest
    if (sim >= 0.54) {
      const score = 0.36 + sim * 0.42
      if (score > best) best = score
    }
  }
  // also check against compact
  if (field.compact) {
    const longest = Math.max(needle.length, field.compact.length)
    if (longest > 0) {
      const sim = 1 - levenshtein(needle, field.compact) / longest
      if (sim >= 0.54) {
        const score = 0.36 + sim * 0.42
        if (score > best) best = score
      }
    }
  }
  return best
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a) return b.length
  if (!b) return a.length
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  const curr = Array.from<number>({ length: b.length + 1 })
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j < prev.length; j++) prev[j] = curr[j]
  }
  return prev[b.length]
}

export function getMatchStrength(score: number): MatchStrength {
  if (score >= DIRECT_MATCH_SCORE) return 'Direct'
  if (score >= CLOSE_MATCH_SCORE) return 'Close'
  return 'Nearest'
}

// ---- Domain helpers ----

function getDomainLabel(source: string): string | null {
  if (!source) return null
  try {
    return new URL(source).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
}

function getPrimaryDomainLabel(sources: string[]): string | null {
  for (const source of sources) {
    const domain = getDomainLabel(source)
    if (domain) return domain
  }
  return null
}

function getCategoryPath(labels: Array<string | null | undefined>): string[] {
  const mapped = labels.filter((v): v is string => Boolean(v)).map((v) => routeLabelMap[v] ?? v)
  const seen = new Set<string>()
  return mapped.filter((label) => {
    const key = normalizeText(label)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function createDomainSearchText(sources: string[]): string {
  const terms = new Set<string>()
  for (const source of sources) {
    const domain = getDomainLabel(source)
    if (!domain) continue
    const labels = domain.split('.').filter(Boolean)
    terms.add(domain)
    terms.add(domain.replaceAll('.', ' '))
    terms.add(domain.replaceAll('.', ''))
    if (labels.length > 0) terms.add(labels[0])
    if (labels.length >= 2) {
      const rd = labels.slice(-2).join('.')
      terms.add(rd)
      terms.add(rd.replaceAll('.', ' '))
      terms.add(rd.replaceAll('.', ''))
    }
  }
  return Array.from(terms).join(' ')
}

// ---- Build search items from domain data ----

/** Shared entity builder reproducing SPA `siteToSearchItem` field layout. */
function createEntitySearchItem(opts: {
  id: string
  kind: SearchKind
  name: string
  description: string
  categoryPathLabels: Array<string | null | undefined>
  category: string
  tags: string[]
  website: string
  docs: string
  sourceCode: string
  popularity: number
  featured: boolean
}): SearchItem {
  const sources = [opts.website, opts.docs, opts.sourceCode].filter(Boolean) as string[]
  const logoSource = sources[0] ?? ''
  const domainLabel = getPrimaryDomainLabel(sources)
  const domainSearchText = createDomainSearchText(sources)
  const categoryPath = getCategoryPath(opts.categoryPathLabels)

  const routePrefix =
    opts.kind === 'site'
      ? 'sites'
      : opts.kind === 'extension'
        ? 'extensions'
        : opts.kind === 'mcp'
          ? 'mcp'
          : 'skills'

  return {
    id: opts.id,
    kind: opts.kind,
    title: opts.name,
    description: opts.description,
    category: opts.category,
    eyebrow: categoryPath.join(' / '),
    to: `/${routePrefix}/${slugOf(opts.id)}`,
    tags: opts.tags,
    logoUrl: getFaviconUrl(logoSource),
    domainLabel,
    fields: createSearchFields({
      title: opts.name,
      titleWithDomain: [opts.name, domainLabel].filter(Boolean).join(' '),
      description: opts.description,
      category: [...categoryPath, ...opts.categoryPathLabels].filter(Boolean).join(' '),
      tags: opts.tags,
      domain: domainSearchText,
      source: [...sources, domainSearchText].filter(Boolean).join(' '),
    }),
    popularity: opts.popularity,
    featured: opts.featured,
  }
}

function getFaviconUrl(source: string): string | null {
  const domain = getDomainLabel(source)
  if (!domain) return null
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

function slugOf(id: string): string {
  const match = /^[a-z]+-(.+)$/.exec(id)
  return match ? match[1] : id
}

function siteToSearchItem(site: Site): SearchItem {
  return createEntitySearchItem({
    id: `site-${site.slug}`,
    kind: 'site',
    name: site.name,
    description: site.description,
    categoryPathLabels: [site.parentCategory, site.subcategory, site.category],
    category: site.category,
    tags: site.tags ?? [],
    website: site.website,
    docs: site.docs,
    sourceCode: site.sourceCode,
    popularity: site.stars + site.watchers,
    featured: site.featured,
  })
}

function extensionToSearchItem(extension: Extension): SearchItem {
  return createEntitySearchItem({
    id: `extension-${extension.slug}`,
    kind: 'extension',
    name: extension.name,
    description: extension.description,
    categoryPathLabels: [extension.parentCategory, extension.subcategory, extension.category],
    category: extension.category,
    tags: extension.tags ?? [],
    website: extension.website,
    docs: extension.docs,
    sourceCode: extension.sourceCode,
    popularity: 0,
    featured: extension.featured,
  })
}

function mcpToSearchItem(server: McpServer): SearchItem {
  // Tool names + connections ride in via the description field for discoverability
  // (e.g. query "navigate" should hit playwright-mcp) without adding match fields.
  const toolText = server.tools.map((t) => t.name).join(' ')
  const connectionText = (server.connections ?? []).join(' ')
  const description = [server.description, toolText, connectionText].filter(Boolean).join(' ')
  return createEntitySearchItem({
    id: `mcp-${server.slug}`,
    kind: 'mcp',
    name: server.name,
    description,
    categoryPathLabels: [server.parentCategory, server.category],
    category: server.category,
    tags: server.tags ?? [],
    website: server.website,
    docs: server.docs,
    sourceCode: server.sourceCode,
    popularity: 0,
    featured: server.featured,
  })
}

function skillToSearchItem(skill: Skill): SearchItem {
  const [owner] = skill.repoLink.split('/')
  return {
    id: `skill-${skill.slug}`,
    kind: 'skill',
    title: skill.title,
    description: skill.description,
    category: skill.category,
    eyebrow: [skill.parentCategory, skill.category, skill.authorName].filter(Boolean).join(' / '),
    to: `/skills/${skill.slug}`,
    tags: skill.tags,
    logoUrl: owner ? `https://github.com/${owner}.png?size=64` : null,
    domainLabel: null,
    fields: createSearchFields({
      title: skill.title,
      description: skill.description,
      category: [skill.parentCategory, skill.category, skill.authorName].filter(Boolean).join(' '),
      tags: skill.tags,
      source: [skill.repoLink, skill.skillPath].filter(Boolean).join(' '),
    }),
    popularity: skill.views + skill.uses,
    featured: skill.featured,
  }
}

// ---- Scoring cache ----

const scoreCache = new Map<string, Map<string, number>>()

function getCachedScore(query: string, itemId: string): number | undefined {
  return scoreCache.get(query)?.get(itemId)
}

function setCachedScore(query: string, itemId: string, score: number): void {
  let inner = scoreCache.get(query)
  if (!inner) {
    // Keep cache bounded
    if (scoreCache.size > 50) {
      const firstKey = scoreCache.keys().next().value
      if (firstKey) scoreCache.delete(firstKey)
    }
    inner = new Map()
    scoreCache.set(query, inner)
  }
  inner.set(itemId, score)
}

/** Clears the score cache (e.g. after data reloads in tests). */
export function clearScoreCache(): void {
  scoreCache.clear()
}

// ---- Corpus + search ----

let corpus: SearchItem[] | null = null

function buildCorpus(): SearchItem[] {
  return [
    ...loadSites().map(siteToSearchItem),
    ...loadExtensions().map(extensionToSearchItem),
    ...loadMcpServers().map(mcpToSearchItem),
    ...loadSkills().map(skillToSearchItem),
  ]
}

export interface SearchCatalogPage {
  results: SearchHit[]
  total: number
  count: number
  offset: number
  has_more: boolean
  next_offset: number | null
}

export function searchCatalog(query: string, limit: number, offset: number): SearchCatalogPage {
  if (corpus === null) corpus = buildCorpus()
  const normalized = normalizeText(query)

  const ranked = corpus
    .map((item) => {
      const cached = getCachedScore(normalized, item.id)
      const score = cached ?? scoreSearchItem(normalized, item)
      if (cached === undefined) setCachedScore(normalized, item.id, score)
      return { item, score }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || b.item.popularity - a.item.popularity)

  const total = ranked.length
  const page = ranked.slice(offset, offset + limit)
  return {
    results: page.map(({ item, score }) => toHit(item, score)),
    total,
    count: page.length,
    offset,
    has_more: total > offset + page.length,
    next_offset: total > offset + page.length ? offset + page.length : null,
  }
}

function toHit(item: SearchItem, score: number): SearchHit {
  return {
    kind: item.kind,
    slug: slugOf(item.id),
    name: item.title,
    description: item.description,
    score,
    matchStrength: getMatchStrength(score),
    route: item.to,
  }
}
