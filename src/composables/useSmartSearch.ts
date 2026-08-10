import { computed, ref, watch, type Ref } from 'vue'
import { useSitesStore, type Site } from '@/stores/sites'
import { useSkillsStore, type Skill } from '@/stores/skills'

export type SmartSearchKind = 'collection' | 'site' | 'skill'

export interface SmartSearchResult {
  id: string
  kind: SmartSearchKind
  title: string
  description: string
  category: string
  eyebrow: string
  to: string
  tags: string[]
  logoUrl: string | null
  domainLabel: string | null
  score: number
  matchStrength: 'Direct' | 'Close' | 'Nearest'
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
  kind: SmartSearchKind
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

const MAX_RESULTS = 10
const DIRECT_MATCH_SCORE = 205
const CLOSE_MATCH_SCORE = 118

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

// ---- Text utilities (called at build time and sparingly at runtime) ----

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[\s/_-]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim()
}

function tokenize(value: string): string[] {
  return value.split(' ').filter((t) => t.length > 0)
}

function compactText(value: string): string {
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

function scoreSearchItem(normalizedQuery: string, item: SearchItem): number {
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
  if (terms.length > 0 && matched.size >= terms.length) {
    return item.kind === 'collection' ? 88 : 56
  }
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

function levenshtein(a: string, b: string): number {
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

function getMatchStrength(score: number): SmartSearchResult['matchStrength'] {
  if (score >= DIRECT_MATCH_SCORE) return 'Direct'
  if (score >= CLOSE_MATCH_SCORE) return 'Close'
  return 'Nearest'
}

function getFaviconUrl(source: string): string | null {
  const domain = getDomainLabel(source)
  if (!domain) return null
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

function getPrimaryDomainLabel(sources: string[]): string | null {
  for (const source of sources) {
    const domain = getDomainLabel(source)
    if (domain) return domain
  }
  return null
}

function getDomainLabel(source: string): string | null {
  if (!source) return null
  try {
    return new URL(source).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
}

function getSiteCategoryPath(site: Site): string[] {
  const labels = [site.parentCategory, site.subcategory, site.category]
    .filter((v): v is string => Boolean(v))
    .map((v) => routeLabelMap[v] ?? v)
  const seen = new Set<string>()
  return labels.filter((label) => {
    const key = normalizeText(label)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ---- Build search items from domain data ----

function createNavigationItem(opts: {
  id: string
  title: string
  description: string
  category: string
  to: string
  keywords: string[]
}): SearchItem {
  return {
    id: opts.id,
    kind: 'collection',
    title: opts.title,
    description: opts.description,
    category: opts.category,
    eyebrow: opts.category,
    to: opts.to,
    tags: opts.keywords,
    logoUrl: null,
    domainLabel: null,
    fields: createSearchFields({
      title: opts.title,
      description: opts.description,
      category: opts.category,
      tags: opts.keywords,
      source: opts.to,
    }),
    popularity: 800,
    featured: true,
  }
}

function siteToSearchItem(site: Site): SearchItem {
  const tags = site.tags ?? []
  const sources = [site.website, site.docs, site.sourceCode].filter(Boolean) as string[]
  const logoSource = sources[0] ?? ''
  const domainLabel = getPrimaryDomainLabel(sources)
  const domainSearchText = createDomainSearchText(sources)
  const categoryPath = getSiteCategoryPath(site)

  return {
    id: `site-${site.slug}`,
    kind: 'site',
    title: site.name,
    description: site.description,
    category: site.category,
    eyebrow: categoryPath.join(' / '),
    to: `/sites/${site.slug}`,
    tags,
    logoUrl: getFaviconUrl(logoSource),
    domainLabel,
    fields: createSearchFields({
      title: site.name,
      titleWithDomain: [site.name, domainLabel].filter(Boolean).join(' '),
      description: site.description,
      category: [...categoryPath, site.parentCategory, site.subcategory, site.category]
        .filter(Boolean)
        .join(' '),
      tags,
      domain: domainSearchText,
      source: [...sources, domainSearchText].filter(Boolean).join(' '),
    }),
    popularity: site.stars + site.watchers,
    featured: site.featured,
  }
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

// ---- Static navigation corpus ----

const navigationItems: SearchItem[] = [
  createNavigationItem({
    id: 'collection-sites',
    title: 'Sites Homepage',
    description: 'Visual front door for AI, design, development, watch, and download collections',
    category: 'Sites',
    to: '/sites',
    keywords: ['sites', 'catalog', 'homepage', 'browse', 'collections', 'resources'],
  }),
  createNavigationItem({
    id: 'collection-sites-development-cloud-hosting',
    title: 'Cloud & Hosting',
    description: 'Cloud platforms, hosting, databases, and backend services for development work',
    category: 'Sites',
    to: '/sites/development/cloud-hosting',
    keywords: [
      'platforms',
      'hosting',
      'cloud',
      'deployment',
      'backend',
      'vercel',
      'railway',
      'supabase',
    ],
  }),
  createNavigationItem({
    id: 'collection-sites-ai',
    title: 'AI Tools',
    description:
      'AI chat, image, automation, agent skills, research, API, video, and website development tools',
    category: 'Sites',
    to: '/sites/ai',
    keywords: ['chatgpt', 'claude', 'gemini', 'agents', 'automation', 'models'],
  }),
  createNavigationItem({
    id: 'collection-sites-ai-agent-skills',
    title: 'Agent Skills',
    description: 'AI agent skill directories, marketplaces, and installable skill catalogs',
    category: 'Sites',
    to: '/sites/ai/agent-skills',
    keywords: ['agent skills', 'skills', 'skillfish', 'skills.sh', 'claude skills', 'codex skills'],
  }),
  createNavigationItem({
    id: 'collection-sites-ai-website-development',
    title: 'Website Development',
    description: 'AI website development, app builders, and design-to-code generators',
    category: 'Sites',
    to: '/sites/ai/wb',
    keywords: ['wb', 'website builder', 'app builder', 'design to code', 'v0', 'lovable', 'bolt'],
  }),
  createNavigationItem({
    id: 'collection-sites-ai-machine-learning',
    title: 'Machine Learning',
    description: 'Machine learning frameworks, notebooks, data science platforms, and references',
    category: 'Sites',
    to: '/sites/ai/ml',
    keywords: ['ml', 'machine learning', 'models', 'notebooks', 'datasets', 'training'],
  }),
  createNavigationItem({
    id: 'collection-sites-design',
    title: 'Design Resources',
    description: 'Design inspiration, fonts, icons, prompts, 3D assets, and interface tools',
    category: 'Sites',
    to: '/sites/design',
    keywords: ['ui', 'ux', 'icons', 'fonts', 'figma', 'inspiration'],
  }),
  createNavigationItem({
    id: 'collection-sites-development',
    title: 'Development Resources',
    description:
      'Cloud hosting, learning, references, tooling, CLI tools, UI libraries, repositories, MCP, and monitoring resources',
    category: 'Sites',
    to: '/sites/development',
    keywords: ['docs', 'code', 'learning', 'github', 'monitoring', 'mcp', 'cli', 'components'],
  }),
  createNavigationItem({
    id: 'collection-sites-development-cli-tools',
    title: 'CLI Tools',
    description: 'Command-line tools and utilities for development workflows',
    category: 'Sites',
    to: '/sites/development/cli-tools',
    keywords: ['cli', 'terminal', 'agents', 'coding agent', 'command line'],
  }),
  createNavigationItem({
    id: 'collection-sites-development-ui-libraries',
    title: 'UI Libraries',
    description: 'UI component libraries and design systems for development work',
    category: 'Sites',
    to: '/sites/development/ui-libraries',
    keywords: ['ui', 'components', 'design system', 'react', 'tailwind', 'shadcn'],
  }),
  createNavigationItem({
    id: 'collection-sites-watch',
    title: 'Watch',
    description: 'Movie and anime watch bookmarks',
    category: 'Sites',
    to: '/sites/watch',
    keywords: ['movies', 'anime', 'streaming', 'watch', 'nextflicks', 'sflix', 'hianime'],
  }),
  createNavigationItem({
    id: 'collection-skills',
    title: 'Skills Library',
    description: 'Technical skills and workflows for AI agents',
    category: 'Skills',
    to: '/skills/skills',
    keywords: ['agents', 'workflow', 'coding', 'automation', 'prompts'],
  }),
  createNavigationItem({
    id: 'collection-skills-design',
    title: 'Design Skills',
    description: 'Design skills and guidelines for creative teams',
    category: 'Skills',
    to: '/skills/design',
    keywords: ['frontend', 'visual', 'interface', 'tailwind', 'design system'],
  }),
]

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

// ---- The composable ----

export function useSmartSearch(query: Ref<string>) {
  const sitesStore = useSitesStore()
  const skillsStore = useSkillsStore()

  // Trigger loading but don't block on it
  void sitesStore.loadSites()
  void skillsStore.loadSkills()

  // Compute corpus once lazily, update reactively when stores change
  const corpus = computed<SearchItem[]>(() => {
    return [
      ...navigationItems,
      ...sitesStore.allSites.map(siteToSearchItem),
      ...skillsStore.allSkills.map(skillToSearchItem),
    ]
  })

  // Debounced query for expensive scoring
  const debouncedQuery = ref('')
  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  watch(
    query,
    (value) => {
      // Show results instantly when query is short (empty → featured)
      if (!value) {
        debouncedQuery.value = ''
        return
      }
      // Debounce for actual typed queries
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        debouncedQuery.value = value
      }, 80) // 80ms debounce — feels instant but cuts keystrokes by ~50-70%
    },
    { immediate: true },
  )

  const normalizedQuery = computed(() => normalizeText(debouncedQuery.value))
  const hasQuery = computed(() => normalizedQuery.value.length > 0)
  const searchTerms = computed(() => tokenize(normalizedQuery.value))

  // Show instant feedback for empty query (featured results)
  const instantResults = computed<SmartSearchResult[]>(() => {
    if (hasQuery.value) return [] // only used when no query
    return corpus.value
      .filter((item) => item.featured || item.kind === 'collection')
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, MAX_RESULTS)
      .map((item) => toResult(item, 0))
  })

  // Scored results (debounced)
  const scoredResults = computed<SmartSearchResult[]>(() => {
    if (!hasQuery.value) return []
    const q = normalizedQuery.value
    const items = corpus.value

    const ranked = items
      .map((item) => {
        const cached = getCachedScore(q, item.id)
        const score = cached ?? scoreSearchItem(q, item)
        if (cached === undefined) setCachedScore(q, item.id, score)
        return { item, score }
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || b.item.popularity - a.item.popularity)

    if (ranked.length > 0) {
      return ranked.slice(0, MAX_RESULTS).map(({ item, score }) => toResult(item, score))
    }

    // Fallback: show popular items
    return items
      .map((item) => ({ item, score: item.popularity / 100 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map(({ item, score }) => toResult(item, score))
  })

  const results = computed<SmartSearchResult[]>(() => {
    return hasQuery.value ? scoredResults.value : instantResults.value
  })

  return { hasQuery, results, searchTerms }
}

function toResult(item: SearchItem, score: number): SmartSearchResult {
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    description: item.description,
    category: item.category,
    eyebrow: item.eyebrow,
    to: item.to,
    tags: item.tags.slice(0, 4),
    logoUrl: item.logoUrl,
    domainLabel: item.domainLabel,
    score,
    matchStrength: getMatchStrength(score),
  }
}
