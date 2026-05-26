import { computed, type Ref } from 'vue'
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
  score: number
  matchStrength: 'Direct' | 'Close' | 'Nearest'
}

interface SearchField {
  value: string
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

const navigationItems: SearchItem[] = [
  createNavigationItem({
    id: 'collection-sites-development-cloud-hosting',
    title: 'Cloud & Hosting',
    description: 'Cloud platforms, hosting, databases, and backend services for development work',
    category: 'Sites',
    to: '/sites/development/cloud-hosting',
    keywords: ['platforms', 'hosting', 'cloud', 'deployment', 'backend', 'vercel', 'railway', 'supabase'],
  }),
  createNavigationItem({
    id: 'collection-sites-ai',
    title: 'AI Tools',
    description: 'AI chat, image, automation, research, API, video, and website development tools',
    category: 'Sites',
    to: '/sites/ai',
    keywords: ['chatgpt', 'claude', 'gemini', 'agents', 'automation', 'models'],
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
    description: 'Cloud hosting, learning, references, tooling, CLI tools, UI libraries, repositories, MCP, and monitoring resources',
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

export function useSmartSearch(query: Ref<string>) {
  const sitesStore = useSitesStore()
  const skillsStore = useSkillsStore()
  void sitesStore.loadSites()
  void skillsStore.loadSkills()

  const corpus = computed<SearchItem[]>(() => [
    ...navigationItems,
    ...sitesStore.allSites.map(siteToSearchItem),
    ...skillsStore.allSkills.map(skillToSearchItem),
  ])

  const normalizedQuery = computed(() => normalizeText(query.value))
  const hasQuery = computed(() => normalizedQuery.value.length > 0)

  const results = computed<SmartSearchResult[]>(() => {
    if (!hasQuery.value) {
      return corpus.value
        .filter(item => item.featured || item.kind === 'collection')
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, MAX_RESULTS)
        .map(item => toResult(item, 0))
    }

    const ranked = corpus.value
      .map(item => ({ item, score: scoreSearchItem(normalizedQuery.value, item) }))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score || b.item.popularity - a.item.popularity)

    const bestAvailable = ranked.length > 0
      ? ranked
      : corpus.value
          .map(item => ({ item, score: item.popularity / 100 }))
          .sort((a, b) => b.score - a.score)

    return bestAvailable.slice(0, MAX_RESULTS).map(({ item, score }) => toResult(item, score))
  })

  return {
    hasQuery,
    results,
  }
}

function createNavigationItem(options: {
  id: string
  title: string
  description: string
  category: string
  to: string
  keywords: string[]
}): SearchItem {
  return {
    id: options.id,
    kind: 'collection',
    title: options.title,
    description: options.description,
    category: options.category,
    eyebrow: options.category,
    to: options.to,
    tags: options.keywords,
    logoUrl: null,
    fields: createSearchFields({
      title: options.title,
      description: options.description,
      category: options.category,
      tags: options.keywords,
      source: options.to,
    }),
    popularity: 800,
    featured: true,
  }
}

function siteToSearchItem(site: Site): SearchItem {
  const tags = site.tags ?? []
  const logoSource = site.website || site.docs || site.sourceCode
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
    fields: createSearchFields({
      title: site.name,
      description: site.description,
      category: [
        ...categoryPath,
        site.parentCategory,
        site.subcategory,
        site.category,
      ].filter(Boolean).join(' '),
      tags,
      source: [site.website, site.docs, site.sourceCode].filter(Boolean).join(' '),
    }),
    popularity: site.stars + site.watchers,
    featured: site.featured,
  }
}

function getSiteCategoryPath(site: Site): string[] {
  const labels = [site.parentCategory, site.subcategory, site.category]
    .filter((value): value is string => Boolean(value))
    .map(formatRouteLabel)

  const seen = new Set<string>()
  return labels.filter(label => {
    const key = normalizeText(label)
    if (!key || seen.has(key)) return false

    seen.add(key)
    return true
  })
}

function formatRouteLabel(value: string): string {
  return routeLabelMap[value] ?? value
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

function createSearchFields(fields: {
  title: string
  description: string
  category: string
  tags: string[]
  source: string
}): SearchField[] {
  return [
    { value: fields.title, weight: 118 },
    { value: fields.tags.join(' '), weight: 96 },
    { value: fields.category, weight: 84 },
    { value: fields.description, weight: 62 },
    { value: fields.source, weight: 38 },
  ]
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
    score,
    matchStrength: getMatchStrength(score),
  }
}

function getFaviconUrl(source: string): string | null {
  if (!source) return null

  const domain = source.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

  if (!domain) return null

  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

function getMatchStrength(score: number): SmartSearchResult['matchStrength'] {
  if (score >= DIRECT_MATCH_SCORE) return 'Direct'
  if (score >= CLOSE_MATCH_SCORE) return 'Close'
  return 'Nearest'
}

function scoreSearchItem(query: string, item: SearchItem): number {
  const terms = tokenize(query)
  const compactQuery = query.replaceAll(' ', '')
  const bestFullFieldScore = Math.max(
    ...item.fields.map(field => getTextSimilarity(query, field.value) * field.weight),
  )
  const bestCompactScore = Math.max(
    ...item.fields.map(field => getTextSimilarity(compactQuery, field.value) * field.weight),
  )

  const termScores = terms.map(term =>
    Math.max(...item.fields.map(field => getTextSimilarity(term, field.value) * field.weight)),
  )
  const averageTermScore =
    termScores.length > 0 ? termScores.reduce((sum, score) => sum + score, 0) / termScores.length : 0
  const coverage =
    termScores.length > 0 ? termScores.filter(score => score >= 42).length / termScores.length : 0
  const exactTokenBoost = getExactTokenBoost(query, terms, item)
  const popularityBoost = Math.min(Math.log10(item.popularity + 10) * 2.6, 10)
  const featuredBoost = item.featured ? 5 : 0

  return (
    Math.max(bestFullFieldScore, bestCompactScore) * 1.12 +
    averageTermScore * 0.76 +
    coverage * 28 +
    exactTokenBoost +
    popularityBoost +
    featuredBoost
  )
}

function getExactTokenBoost(query: string, terms: string[], item: SearchItem): number {
  const termSet = new Set(terms)
  const matchedTerms = new Set<string>()

  for (const field of item.fields) {
    const tokens = tokenize(field.value)

    if (tokens.includes(query)) {
      return item.kind === 'collection' ? 240 : 180
    }

    for (const term of termSet) {
      if (tokens.includes(term)) {
        matchedTerms.add(term)
      }
    }
  }

  return termSet.size > 0 && matchedTerms.size >= termSet.size ? 48 : 0
}

function getTextSimilarity(rawNeedle: string, rawHaystack: string): number {
  const needle = normalizeText(rawNeedle)
  const haystack = normalizeText(rawHaystack)

  if (!needle || !haystack) return 0
  if (haystack === needle) return 1
  if (haystack.startsWith(needle)) return 0.95
  if (haystack.includes(needle)) return 0.86

  const compactNeedle = needle.replaceAll(' ', '')
  const compactHaystack = haystack.replaceAll(' ', '')

  if (compactNeedle && compactHaystack.includes(compactNeedle)) return 0.82

  const acronym = haystack
    .split(' ')
    .map(word => word.at(0) ?? '')
    .join('')

  if (compactNeedle && acronym.startsWith(compactNeedle)) return 0.8

  return Math.max(
    getOrderedCharacterScore(compactNeedle, compactHaystack),
    getNearestWordScore(needle, haystack),
  )
}

function getOrderedCharacterScore(needle: string, haystack: string): number {
  if (!needle || !haystack || needle.length > haystack.length) return 0

  let needleIndex = 0
  let currentRun = 0
  let bestRun = 0

  for (const char of haystack) {
    if (char === needle[needleIndex]) {
      needleIndex += 1
      currentRun += 1
      bestRun = Math.max(bestRun, currentRun)

      if (needleIndex === needle.length) break
    } else {
      currentRun = 0
    }
  }

  if (needleIndex !== needle.length) return 0

  const density = needle.length / haystack.length
  const runQuality = bestRun / needle.length

  return 0.42 + density * 0.2 + runQuality * 0.26
}

function getNearestWordScore(needle: string, haystack: string): number {
  const candidates = new Set([...tokenize(haystack), haystack.replaceAll(' ', '')])
  let bestScore = 0

  for (const candidate of candidates) {
    const longestLength = Math.max(needle.length, candidate.length)
    if (longestLength === 0) continue

    const similarity = 1 - getLevenshteinDistance(needle, candidate) / longestLength

    if (similarity >= 0.54) {
      bestScore = Math.max(bestScore, 0.36 + similarity * 0.42)
    }
  }

  return bestScore
}

function getLevenshteinDistance(left: string, right: string): number {
  if (left === right) return 0
  if (!left) return right.length
  if (!right) return left.length

  const previousRow = Array.from({ length: right.length + 1 }, (_, index) => index)
  const currentRow = Array.from({ length: right.length + 1 }, () => 0)

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    currentRow[0] = leftIndex

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1

      currentRow[rightIndex] = Math.min(
        currentRow[rightIndex - 1] + 1,
        previousRow[rightIndex] + 1,
        previousRow[rightIndex - 1] + substitutionCost,
      )
    }

    for (let index = 0; index < previousRow.length; index += 1) {
      previousRow[index] = currentRow[index]
    }
  }

  return previousRow[right.length]
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(' ')
    .filter(token => token.length > 0)
}

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
