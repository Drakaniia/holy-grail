// MCP catalog search. The scoring core lives in @holy-grail/core, shared
// verbatim with the SPA (packages/web/src/composables/useSmartSearch.ts) so the
// two searchers cannot drift. This file keeps only the MCP-specific parts: the
// corpus build from the bundled catalog snapshot, the SearchHit shape and the
// paginated searchCatalog() entry point.
//
// Not shared: the Vue composable and navigation/collection items (the MCP
// server only searches catalog entities). The score cache is a plain
// module-level Map keyed query → itemId → score. Drift is guarded by
// evals/search-corpus.test.ts (pinned corpus) and
// packages/web/tests/mcp-search-mirror.test.ts (SPA-vs-MCP parity).

import { loadExtensions, loadMcpServers, loadSites, loadSkills } from './data.js'
import type { PageMeta } from './format.js'
import type { Extension, McpServer, MatchStrength, Site } from './types.js'
import { page } from './tools/common.js'
import {
  createEntitySearchItem,
  createScoreCache,
  getMatchStrength,
  normalizeText,
  scoreSearchItem,
  skillToSearchItem,
  type SearchItem,
} from '@holy-grail/core'

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

function slugOf(id: string): string {
  const match = /^[a-z]+-(.+)$/.exec(id)
  return match ? match[1] : id
}

function siteToSearchItem(site: Site): SearchItem<SearchKind> {
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

function extensionToSearchItem(extension: Extension): SearchItem<SearchKind> {
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

function mcpToSearchItem(server: McpServer): SearchItem<SearchKind> {
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

// ---- Scoring cache ----

const scoreCache = createScoreCache()

// ---- Corpus + search ----

let corpus: SearchItem<SearchKind>[] | null = null

function buildCorpus(): SearchItem<SearchKind>[] {
  return [
    ...loadSites().map(siteToSearchItem),
    ...loadExtensions().map(extensionToSearchItem),
    ...loadMcpServers().map(mcpToSearchItem),
    ...loadSkills().map(skillToSearchItem),
  ]
}

export interface SearchCatalogPage extends PageMeta {
  results: SearchHit[]
}

export function searchCatalog(query: string, limit: number, offset: number): SearchCatalogPage {
  if (corpus === null) corpus = buildCorpus()
  const normalized = normalizeText(query)

  const ranked = corpus
    .map((item) => {
      const cached = scoreCache.get(normalized, item.id)
      const score = cached ?? scoreSearchItem(normalized, item)
      if (cached === undefined) scoreCache.set(normalized, item.id, score)
      return { item, score }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || b.item.popularity - a.item.popularity)

  const rows = ranked.slice(offset, offset + limit)
  return {
    results: rows.map(({ item, score }) => toHit(item, score)),
    ...page(ranked, offset, limit),
  }
}

function toHit(item: SearchItem<SearchKind>, score: number): SearchHit {
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
