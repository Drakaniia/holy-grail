import { computed, ref, watch, type Ref } from 'vue'
import { useSitesStore, type Site } from '@/stores/sites'
import { useSkillsStore } from '@/stores/skills'
import {
  MAX_RESULTS,
  createEntitySearchItem,
  createScoreCache,
  createSearchFields,
  getMatchStrength,
  normalizeText,
  scoreSearchItem,
  skillToSearchItem,
  tokenize,
  type SearchItem,
} from '@holy-grail/core'

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

type Item = SearchItem<SmartSearchKind>

// ---- Build search items from domain data ----

function createNavigationItem(opts: {
  id: string
  title: string
  description: string
  category: string
  to: string
  keywords: string[]
}): Item {
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

function siteToSearchItem(site: Site): Item {
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

// ---- Static navigation corpus ----

const navigationItems: Item[] = [
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

const scoreCache = createScoreCache()

// ---- The composable ----

export function useSmartSearch(query: Ref<string>) {
  const sitesStore = useSitesStore()
  const skillsStore = useSkillsStore()

  // Trigger loading but don't block on it
  void sitesStore.loadSites()
  void skillsStore.loadSkills()

  // Compute corpus once lazily, update reactively when stores change
  const corpus = computed<Item[]>(() => {
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
        const cached = scoreCache.get(q, item.id)
        const score = cached ?? scoreSearchItem(q, item)
        if (cached === undefined) scoreCache.set(q, item.id, score)
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

function toResult(item: Item, score: number): SmartSearchResult {
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
