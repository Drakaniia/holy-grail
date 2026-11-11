// Discovery tools that work across every entity kind: list_categories,
// list_tags, find_by_tags, get_trending and get_related.

import type { McpServer as SdkMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  CATALOG_KINDS,
  DETAIL_TOOL,
  catalogEntries,
  entrySummary,
  findEntry,
  normalizeTag,
  type CatalogEntry,
} from '../catalog.js'
import { LIST_DEFAULT_LIMIT, LIST_MAX_LIMIT } from '../constants.js'
import { ensureCatalog } from '../data.js'
import type { CatalogKind } from '../types.js'
import { buildResponse, fail, page, responseFormatSchema } from './common.js'

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const

const kindSchema = z.enum(CATALOG_KINDS)
const optionalKind = kindSchema
  .optional()
  .describe("Restrict to one entity kind: 'site', 'extension', 'mcp' or 'skill' (default: all)")

const KIND_LABEL: Record<CatalogKind, string> = {
  site: 'Sites',
  extension: 'Extensions',
  mcp: 'MCP servers',
  skill: 'Skills',
}

function entryLine(entry: CatalogEntry, extra = ''): string {
  return `- **${entry.name}** (\`${entry.kind}\`, \`${entry.slug}\`${entry.category ? `, ${entry.category}` : ''})${extra} — ${entry.description}`
}

// ---- list_categories ----

interface CategoryNode {
  name: string
  count: number
  subcategories: Array<{ name: string; count: number }>
}

interface ParentNode {
  kind: CatalogKind
  parentCategory: string
  count: number
  categories: CategoryNode[]
}

function categoryTree(kind?: CatalogKind): ParentNode[] {
  const parents = new Map<string, { kind: CatalogKind; parent: string; entries: CatalogEntry[] }>()
  for (const entry of catalogEntries(kind)) {
    const parent = entry.parentCategory || '(uncategorized)'
    const key = `${entry.kind}\u0000${parent}`
    const bucket = parents.get(key) ?? { kind: entry.kind, parent, entries: [] }
    bucket.entries.push(entry)
    parents.set(key, bucket)
  }
  const nodes: ParentNode[] = []
  for (const { kind: entryKind, parent, entries } of parents.values()) {
    const categories = new Map<string, { count: number; subs: Map<string, number> }>()
    for (const entry of entries) {
      const name = entry.category || '(none)'
      const node = categories.get(name) ?? { count: 0, subs: new Map<string, number>() }
      node.count += 1
      if (entry.subcategory)
        node.subs.set(entry.subcategory, (node.subs.get(entry.subcategory) ?? 0) + 1)
      categories.set(name, node)
    }
    nodes.push({
      kind: entryKind,
      parentCategory: parent,
      count: entries.length,
      categories: [...categories.entries()]
        .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
        .map(([name, node]) => ({
          name,
          count: node.count,
          subcategories: [...node.subs.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([sub, count]) => ({ name: sub, count })),
        })),
    })
  }
  const kindOrder = (k: CatalogKind) => CATALOG_KINDS.indexOf(k)
  return nodes.sort(
    (a, b) =>
      kindOrder(a.kind) - kindOrder(b.kind) ||
      b.count - a.count ||
      a.parentCategory.localeCompare(b.parentCategory),
  )
}

function formatCategoryTree(nodes: ParentNode[]): string {
  const lines = ['# Catalog categories', '']
  let currentKind: CatalogKind | null = null
  for (const node of nodes) {
    if (node.kind !== currentKind) {
      currentKind = node.kind
      lines.push(`## ${KIND_LABEL[node.kind]}`, '')
    }
    lines.push(`- **${node.parentCategory}** (${node.count})`)
    for (const category of node.categories) {
      const subs = category.subcategories.map((s) => `${s.name} ${s.count}`).join(', ')
      lines.push(`  - ${category.name} (${category.count})${subs ? ` — ${subs}` : ''}`)
    }
  }
  return lines.join('\n')
}

// ---- list_tags ----

function tagCounts(kind?: CatalogKind) {
  const counts = new Map<string, { count: number; kinds: Partial<Record<CatalogKind, number>> }>()
  for (const entry of catalogEntries(kind)) {
    for (const raw of new Set(entry.tags.map(normalizeTag))) {
      if (!raw) continue
      const node = counts.get(raw) ?? { count: 0, kinds: {} }
      node.count += 1
      node.kinds[entry.kind] = (node.kinds[entry.kind] ?? 0) + 1
      counts.set(raw, node)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .map(([tag, node]) => ({ tag, count: node.count, kinds: node.kinds }))
}

// ---- get_trending ----

type TrendingSort = 'newest' | 'popular' | 'featured'

function trending(sort: TrendingSort, kind?: CatalogKind): CatalogEntry[] {
  const entries = catalogEntries(kind)
  if (sort === 'newest') {
    return entries
      .filter((e) => e.addedDaysAgo !== null)
      .sort(
        (a, b) =>
          (a.addedDaysAgo ?? 0) - (b.addedDaysAgo ?? 0) ||
          b.popularity - a.popularity ||
          a.name.localeCompare(b.name),
      )
  }
  if (sort === 'popular') {
    return entries
      .filter((e) => e.popularity > 0)
      .sort((a, b) => b.popularity - a.popularity || a.name.localeCompare(b.name))
  }
  return entries
    .filter((e) => e.featured)
    .sort(
      (a, b) =>
        Number(b.verified) - Number(a.verified) ||
        b.popularity - a.popularity ||
        a.name.localeCompare(b.name),
    )
}

// ---- get_related ----

const STOPWORDS = new Set([
  'with',
  'that',
  'this',
  'your',
  'from',
  'into',
  'and',
  'for',
  'the',
  'you',
  'use',
  'when',
  'tool',
  'tools',
  'open',
  'source',
  'free',
  'based',
  'using',
  'make',
  'more',
  'like',
  'also',
])

function keywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !STOPWORDS.has(w)),
  )
}

interface RelatedHit {
  entry: CatalogEntry
  score: number
  reasons: string[]
}

function related(source: CatalogEntry, includeOtherKinds: boolean): RelatedHit[] {
  const sourceTags = new Set(source.tags.map(normalizeTag))
  const sourceWords = keywords(`${source.name} ${source.description}`)
  const similar = new Set(source.similarSlugs)
  const hits: RelatedHit[] = []
  for (const entry of catalogEntries()) {
    if (entry.kind === source.kind && entry.slug === source.slug) continue
    if (!includeOtherKinds && entry.kind !== source.kind) continue
    let score = 0
    const reasons: string[] = []
    if (entry.kind === source.kind && similar.has(entry.slug)) {
      score += 10
      reasons.push('listed as a similar tool')
    }
    if (source.category && entry.category.toLowerCase() === source.category.toLowerCase()) {
      score += 4
      reasons.push(`same category (${entry.category})`)
    } else if (
      source.parentCategory &&
      entry.parentCategory.toLowerCase() === source.parentCategory.toLowerCase()
    ) {
      score += 1
    }
    const sharedTags = entry.tags.map(normalizeTag).filter((t) => sourceTags.has(t))
    if (sharedTags.length > 0) {
      score += 3 * sharedTags.length
      reasons.push(`shared tags: ${sharedTags.join(', ')}`)
    }
    const words = keywords(`${entry.name} ${entry.description}`)
    let overlap = 0
    for (const w of words) if (sourceWords.has(w)) overlap += 1
    if (overlap > 0) {
      const union = sourceWords.size + words.size - overlap
      const similarity = union > 0 ? overlap / union : 0
      score += Math.round(similarity * 20 * 10) / 10
      if (similarity >= 0.15) reasons.push('similar description')
    }
    if (entry.kind !== source.kind) score -= 1
    if (score >= 3 && reasons.length > 0) hits.push({ entry, score, reasons })
  }
  return hits.sort(
    (a, b) =>
      b.score - a.score ||
      b.entry.popularity - a.entry.popularity ||
      a.entry.name.localeCompare(b.entry.name),
  )
}

// ---- Registration ----

export function registerDiscoveryTools(server: SdkMcpServer): void {
  server.registerTool(
    'list_categories',
    {
      title: 'List Catalog Categories',
      description: `Return the catalog's category tree — parent category → category → subcategory, with item counts — for every entity kind or one kind. Use it to learn valid category names before calling list_sites / list_extensions / list_mcp_servers / list_skills with a category filter.

Args:
  - kind ('site' | 'extension' | 'mcp' | 'skill', optional): Restrict to one entity kind
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  { "parents": [{ "kind", "parentCategory", "count", "categories": [{ "name", "count", "subcategories": [{ "name", "count" }] }] }] }

Examples:
  - "What kinds of sites are in the catalog?" -> kind="site"
  - "Which category names can I filter MCP servers by?" -> kind="mcp"`,
      inputSchema: z.object({ kind: optionalKind, response_format: responseFormatSchema }).strict(),
      annotations: READ_ONLY,
    },
    async (params) => {
      await ensureCatalog()
      const parents = categoryTree(params.kind)
      return buildResponse(params.response_format, formatCategoryTree(parents), { parents })
    },
  )

  server.registerTool(
    'list_tags',
    {
      title: 'List Catalog Tags',
      description: `List the most-used tags across the catalog (lowercased), with counts per entity kind. Use it to discover tag vocabulary for find_by_tags.

Args:
  - kind ('site' | 'extension' | 'mcp' | 'skill', optional): Restrict to one entity kind
  - limit (number): Maximum tags to return, 1-200 (default: 50)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  { "total": number, "tags": [{ "tag": string, "count": number, "kinds": { "site"?: number, "extension"?: number, "mcp"?: number, "skill"?: number } }] }

Examples:
  - "What topics does the catalog cover?" -> limit=100
  - "Which tags do MCP servers use?" -> kind="mcp"`,
      inputSchema: z
        .object({
          kind: optionalKind,
          limit: z
            .number()
            .int()
            .min(1)
            .max(200)
            .default(50)
            .describe('Maximum tags to return, 1-200 (default: 50)'),
          response_format: responseFormatSchema,
        })
        .strict(),
      annotations: READ_ONLY,
    },
    async (params) => {
      await ensureCatalog()
      const all = tagCounts(params.kind)
      const tags = all.slice(0, params.limit)
      const markdown = [
        `# Tags${params.kind ? ` (${KIND_LABEL[params.kind]})` : ''}`,
        '',
        `${all.length.toLocaleString()} distinct tags (showing ${tags.length})`,
        '',
        ...tags.map((t) => `- \`${t.tag}\` — ${t.count}`),
      ].join('\n')
      return buildResponse(params.response_format, markdown, { total: all.length, tags })
    },
  )

  server.registerTool(
    'find_by_tags',
    {
      title: 'Find Items by Tags',
      description: `Find catalog items carrying the given tags (case-insensitive). 'all' requires every tag; 'any' matches at least one and ranks items by how many tags match. Paged with offset.

Args:
  - tags (string[]): 1-10 tags, e.g. ["postgres", "self-hosted"]
  - match ('all' | 'any'): Matching mode (default: 'all')
  - kind ('site' | 'extension' | 'mcp' | 'skill', optional): Restrict to one entity kind
  - limit (number): Maximum results, 1-100 (default: 20)
  - offset (number): Results to skip (default: 0)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  { "total", "count", "offset", "has_more", "next_offset", "items": [{ "kind", "slug", "name", "description", "category", "tags", "route", "matchedTags" }] }

Examples:
  - "Self-hosted postgres tools" -> tags=["postgres","self-hosted"], match="all"
  - Use list_tags first when unsure which tags exist; use search for free-text queries.`,
      inputSchema: z
        .object({
          tags: z
            .array(z.string().min(1).max(60))
            .min(1)
            .max(10)
            .describe('Tags to match, e.g. ["postgres", "self-hosted"]'),
          match: z
            .enum(['all', 'any'])
            .default('all')
            .describe("'all' = every tag must match, 'any' = at least one (default: 'all')"),
          kind: optionalKind,
          limit: z
            .number()
            .int()
            .min(1)
            .max(LIST_MAX_LIMIT)
            .default(LIST_DEFAULT_LIMIT)
            .describe(`Maximum results, 1-${LIST_MAX_LIMIT} (default: ${LIST_DEFAULT_LIMIT})`),
          offset: z.number().int().min(0).default(0).describe('Results to skip (default: 0)'),
          response_format: responseFormatSchema,
        })
        .strict(),
      annotations: READ_ONLY,
    },
    async (params) => {
      await ensureCatalog()
      const wanted = [...new Set(params.tags.map(normalizeTag).filter(Boolean))]
      const matches = catalogEntries(params.kind)
        .map((entry) => {
          const own = new Set(entry.tags.map(normalizeTag))
          return { entry, matchedTags: wanted.filter((t) => own.has(t)) }
        })
        .filter((m) =>
          params.match === 'all'
            ? m.matchedTags.length === wanted.length
            : m.matchedTags.length > 0,
        )
        .sort(
          (a, b) =>
            b.matchedTags.length - a.matchedTags.length ||
            b.entry.popularity - a.entry.popularity ||
            a.entry.name.localeCompare(b.entry.name),
        )
      const rows = matches.slice(params.offset, params.offset + params.limit)
      const meta = page(matches, params.offset, params.limit)
      const items = rows.map((m) => ({ ...entrySummary(m.entry), matchedTags: m.matchedTags }))
      const lines = [
        `# Items tagged ${wanted.map((t) => `\`${t}\``).join(params.match === 'all' ? ' + ' : ' or ')}`,
        '',
        `Found ${meta.total.toLocaleString()} (showing ${meta.count}, offset ${meta.offset})`,
        '',
      ]
      if (rows.length === 0) lines.push('No matches. Try match="any" or check list_tags.')
      for (const m of rows) lines.push(entryLine(m.entry, ` [${m.matchedTags.join(', ')}]`))
      if (meta.has_more) lines.push('', `_Use 'offset: ${meta.next_offset}' for the next page._`)
      return buildResponse(params.response_format, lines.join('\n'), { ...meta, items })
    },
  )

  server.registerTool(
    'get_trending',
    {
      title: 'Get Trending Items',
      description: `Surface notable catalog items: the newest additions, the most popular (GitHub stars + watchers for sites, users for extensions, uses + views for skills), or the editors' featured picks.

Args:
  - sort ('newest' | 'popular' | 'featured'): Ranking (default: 'newest')
  - kind ('site' | 'extension' | 'mcp' | 'skill', optional): Restrict to one entity kind
  - limit (number): Maximum results, 1-50 (default: 10)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  { "sort", "total", "items": [{ "kind", "slug", "name", "description", "category", "tags", "route", "addedDaysAgo", "popularity", "featured" }] }

Examples:
  - "What was added to Holy Grail recently?" -> sort="newest"
  - "Most popular self-hostable sites" -> sort="popular", kind="site"
  - "Featured MCP servers" -> sort="featured", kind="mcp"`,
      inputSchema: z
        .object({
          sort: z
            .enum(['newest', 'popular', 'featured'])
            .default('newest')
            .describe("Ranking: 'newest', 'popular' or 'featured' (default: 'newest')"),
          kind: optionalKind,
          limit: z
            .number()
            .int()
            .min(1)
            .max(50)
            .default(10)
            .describe('Maximum results, 1-50 (default: 10)'),
          response_format: responseFormatSchema,
        })
        .strict(),
      annotations: READ_ONLY,
    },
    async (params) => {
      await ensureCatalog()
      const ranked = trending(params.sort, params.kind)
      const rows = ranked.slice(0, params.limit)
      const items = rows.map((e) => ({
        ...entrySummary(e),
        addedDaysAgo: e.addedDaysAgo,
        popularity: e.popularity,
        featured: e.featured,
      }))
      const detail = (e: CatalogEntry) =>
        params.sort === 'newest'
          ? ` · added ${e.addedDaysAgo === 0 ? 'today' : `${e.addedDaysAgo}d ago`}`
          : params.sort === 'popular'
            ? ` · ${e.popularity.toLocaleString()}`
            : ''
      const lines = [
        `# ${params.sort === 'newest' ? 'Newest' : params.sort === 'popular' ? 'Most popular' : 'Featured'}${params.kind ? ` ${KIND_LABEL[params.kind].toLowerCase()}` : ' items'}`,
        '',
      ]
      if (rows.length === 0) lines.push('Nothing to show for this combination.')
      for (const e of rows) lines.push(entryLine(e, detail(e)))
      return buildResponse(params.response_format, lines.join('\n'), {
        sort: params.sort,
        total: ranked.length,
        items,
      })
    },
  )

  server.registerTool(
    'get_related',
    {
      title: 'Get Related Items',
      description: `Find catalog items related to one item — alternatives and complements — ranked by listed similar tools, shared category, shared tags and description overlap. Can cross kinds (e.g. MCP servers and skills related to a site).

Args:
  - kind ('site' | 'extension' | 'mcp' | 'skill'): Kind of the source item
  - slug (string): Slug of the source item
  - include_other_kinds (boolean): Also return items of other kinds (default: true)
  - limit (number): Maximum results, 1-30 (default: 10)
  - response_format ('markdown' | 'json'): Output format (default: 'markdown')

Returns:
  { "source": { kind, slug, name }, "items": [{ "kind", "slug", "name", "description", "category", "tags", "route", "score", "reasons": string[] }] }

Examples:
  - "Alternatives to Supabase" -> kind="site", slug="supabase", include_other_kinds=false
  - "What else pairs with playwright-mcp?" -> kind="mcp", slug="playwright-mcp"

Error Handling:
  - Unknown slug -> error pointing at search / list tools`,
      inputSchema: z
        .object({
          kind: kindSchema.describe(
            "Kind of the source item: 'site', 'extension', 'mcp' or 'skill'",
          ),
          slug: z.string().min(1).describe('Slug of the source item, e.g. "supabase"'),
          include_other_kinds: z
            .boolean()
            .default(true)
            .describe('Also return items of other kinds (default: true)'),
          limit: z
            .number()
            .int()
            .min(1)
            .max(30)
            .default(10)
            .describe('Maximum results, 1-30 (default: 10)'),
          response_format: responseFormatSchema,
        })
        .strict(),
      annotations: READ_ONLY,
    },
    async (params) => {
      await ensureCatalog()
      const source = findEntry(params.kind, params.slug)
      if (!source) {
        return fail(
          `No ${params.kind} with slug '${params.slug}'. Use search (kind="${params.kind}") to find valid slugs.`,
        )
      }
      const hits = related(source, params.include_other_kinds).slice(0, params.limit)
      const items = hits.map((h) => ({
        ...entrySummary(h.entry),
        score: h.score,
        reasons: h.reasons,
      }))
      const lines = [`# Related to ${source.name} (${source.kind})`, '']
      if (hits.length === 0) lines.push('No closely related items found. Try search instead.')
      for (const h of hits) lines.push(entryLine(h.entry, ` · ${h.reasons.join('; ')}`))
      lines.push(
        '',
        `_Use ${DETAIL_TOOL[source.kind]} or the matching get_* tool for full records._`,
      )
      return buildResponse(params.response_format, lines.join('\n'), {
        source: { kind: source.kind, slug: source.slug, name: source.name },
        items,
      })
    },
  )
}
