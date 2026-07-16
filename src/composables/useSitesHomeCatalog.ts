import { computed, type Ref } from 'vue'
import { sortSitesForTab, type Site } from '@/stores/sites'
import type {
  SitesHomeCategoryItem,
  SitesHomeGroupKey,
  SitesHomeLibraryItem,
  SitesHomeTool,
} from '@/types/sitesHome'

interface SitePreviewEntry {
  image: string
  small: string
}

export const SITE_GROUP_META: Record<
  SitesHomeGroupKey,
  { name: string; description: string; accent: string; icon: string; route: string }
> = {
  ai: {
    name: 'AI',
    description: 'Chat, image, builders, automation, and model tools',
    accent: '#39ffb4',
    icon: 'sparkles',
    route: '/sites/ai',
  },
  design: {
    name: 'Design',
    description: 'Inspiration, fonts, icons, and design utilities',
    accent: '#ff5f8f',
    icon: 'palette',
    route: '/sites/design',
  },
  development: {
    name: 'Development',
    description: 'Hosting, CLI tools, UI libraries, and references',
    accent: '#7aa7ff',
    icon: 'code',
    route: '/sites/development',
  },
  watch: {
    name: 'Watch',
    description: 'Movies and anime shelves from the catalog',
    accent: '#ffd166',
    icon: 'play',
    route: '/sites/watch',
  },
  downloads: {
    name: 'Downloads',
    description: 'Software, games, VFX, and torrent references',
    accent: '#ff8c1a',
    icon: 'download',
    route: '/sites/downloads',
  },
}

const ROUTE_LABELS: Record<string, string> = {
  ai: 'AI',
  design: 'Design',
  development: 'Development',
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
  md: 'Markdown',
  'design-tools': 'Design Tools',
  learning: 'Learning',
  'cloud-hosting': 'Cloud & Hosting',
  references: 'References',
  tooling: 'Tooling',
  'cli-tools': 'CLI Tools',
  'ui-libraries': 'UI Libraries',
  repositories: 'Repositories',
  mcp: 'MCP',
  monitoring: 'Monitoring',
  movies: 'Movies',
  anime: 'Anime',
  'game-download': 'Game Download',
  'vfx-download': 'VFX Download',
  'software-download': 'Software Download',
  torrents: 'Torrents',
}

const LIBRARY_DEFINITIONS: {
  id: string
  name: string
  route: string
  match: (haystack: string) => boolean
}[] = [
  {
    id: 'figma',
    name: 'Figma',
    route: '/sites/design/design-tools',
    match: (h) => h.includes('figma'),
  },
  {
    id: 'react',
    name: 'React',
    route: '/sites/development/ui-libraries',
    match: (h) => /\breact\b/.test(h) || h.includes('react.js') || h.includes('reactjs'),
  },
  {
    id: 'vue',
    name: 'Vue',
    route: '/sites/development/ui-libraries',
    match: (h) => /\bvue\b/.test(h) || h.includes('vue.js') || h.includes('nuxt'),
  },
  {
    id: 'tailwind',
    name: 'Tailwind',
    route: '/sites/development/ui-libraries',
    match: (h) => h.includes('tailwind'),
  },
  {
    id: 'github',
    name: 'GitHub',
    route: '/sites/development/repositories',
    match: (h) => h.includes('github'),
  },
  {
    id: 'vercel',
    name: 'Vercel',
    route: '/sites/development/cloud-hosting',
    match: (h) => h.includes('vercel') || h.includes('next.js') || h.includes('nextjs'),
  },
  {
    id: 'framer',
    name: 'Framer',
    route: '/sites/design/design-tools',
    match: (h) => h.includes('framer'),
  },
  {
    id: 'openai',
    name: 'OpenAI',
    route: '/sites/ai',
    match: (h) => h.includes('openai') || h.includes('gpt'),
  },
]

const GENERIC_FEATURE_TAGS = new Set([
  'bookmark',
  'ai',
  'design',
  'development',
  'tools',
  'downloads',
  'download',
  'watch',
])

function shuffleInPlace<T>(items: T[], random: () => number = Math.random) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[items[index], items[swapIndex]] = [items[swapIndex]!, items[index]!]
  }
  return items
}

function formatCount(value: number) {
  return Intl.NumberFormat('en', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatCountLabel(value: number, noun: string) {
  const suffix = value === 1 ? noun : `${noun}s`
  return `${formatCount(value)} ${suffix}`
}

function getPreviewName(site: Site) {
  return site.name.split(/\s[|-]\s/)[0]?.trim() || site.name
}

function getRouteLabel(slug: string | null) {
  if (!slug) return 'Sites'

  const generatedLabel = slug
    .split('-')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')

  return ROUTE_LABELS[slug] || generatedLabel
}

function getFaviconUrl(website: string) {
  if (!website) return ''
  const domain = website.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
}

function getAccentColor(parentCategory: string) {
  return SITE_GROUP_META[parentCategory as SitesHomeGroupKey]?.accent ?? '#ff8c1a'
}

function buildFeatures(site: Site): string[] {
  const fromCore = (site.coreFeatures ?? []).map((feature) => feature.name).filter(Boolean)
  if (fromCore.length > 0) return fromCore.slice(0, 4)

  const fromTags = (site.tags ?? [])
    .filter((tag) => !GENERIC_FEATURE_TAGS.has(tag.toLowerCase()))
    .map((tag) =>
      tag
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase() + part.slice(1))
        .join(' '),
    )

  if (fromTags.length > 0) return fromTags.slice(0, 4)

  const fromPlatforms = site.platforms.filter(Boolean)
  if (fromPlatforms.length > 0) return fromPlatforms.slice(0, 4)

  const category = getRouteLabel(site.subcategory || site.parentCategory)
  return [category, site.verified ? 'Verified' : 'Catalog', 'Web'].slice(0, 4)
}

function siteHaystack(site: Site) {
  return [
    site.name,
    site.description,
    site.website,
    site.category,
    site.parentCategory,
    site.subcategory ?? '',
    ...(site.tags ?? []),
    ...site.platforms,
  ]
    .join(' ')
    .toLowerCase()
}

export function useSitesHomeCatalog(options: {
  sites: Ref<Site[]>
  previews: Ref<Record<string, SitePreviewEntry>>
  loaded: Ref<boolean>
}) {
  const sessionSeed = Math.random().toString(36).slice(2)

  function seededScore(slug: string) {
    const input = `${sessionSeed}:${slug}`
    let hash = 2166136261

    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index)
      hash = Math.imul(hash, 16777619)
    }

    return hash >>> 0
  }

  function hasPreview(site: Site) {
    return Boolean(options.previews.value[site.slug]?.image)
  }

  function toTool(site: Site, trendingSlugs: Set<string>): SitesHomeTool | null {
    const preview = options.previews.value[site.slug]
    if (!preview?.image) return null

    const coverImage = preview.image
    const coverImageSmall = preview.small || preview.image

    return {
      id: site.slug,
      name: getPreviewName(site),
      slug: site.slug,
      logo: getFaviconUrl(site.website),
      coverImage,
      coverImageSmall,
      description: site.description,
      category: getRouteLabel(site.subcategory || site.parentCategory),
      categoryKey: site.subcategory || site.parentCategory,
      verified: site.verified,
      featured: site.featured,
      trending: trendingSlugs.has(site.slug),
      website: site.website,
      screenshots: [coverImage],
      features: buildFeatures(site),
      accentColor: getAccentColor(site.parentCategory),
      to: `/sites/${site.slug}`,
      parentCategory: site.parentCategory,
      stars: site.stars,
    }
  }

  const tools = computed(() => {
    const trending = new Set(
      sortSitesForTab(options.sites.value, 'trending')
        .slice(0, 24)
        .map((site) => site.slug),
    )

    return options.sites.value
      .map((site) => toTool(site, trending))
      .filter((tool): tool is SitesHomeTool => Boolean(tool))
  })

  const heroTools = computed(() => {
    const pool = tools.value
    if (pool.length === 0) return []

    const featured = pool.filter((tool) => tool.featured)
    const verifiedPopular = sortSitesForTab(
      options.sites.value.filter((site) => hasPreview(site) && site.verified),
      'popular',
    )
      .map((site) => pool.find((tool) => tool.slug === site.slug))
      .filter((tool): tool is SitesHomeTool => Boolean(tool))

    const selected: SitesHomeTool[] = []
    const seen = new Set<string>()

    for (const tool of shuffleInPlace([...featured])) {
      if (selected.length >= 6) break
      if (seen.has(tool.slug)) continue
      selected.push(tool)
      seen.add(tool.slug)
    }

    const remainder = verifiedPopular
      .filter((tool) => !seen.has(tool.slug))
      .sort((a, b) => seededScore(a.slug) - seededScore(b.slug))

    for (const tool of remainder) {
      if (selected.length >= 6) break
      selected.push(tool)
      seen.add(tool.slug)
    }

    if (selected.length === 0) {
      return pool.slice(0, Math.min(6, pool.length))
    }

    return selected
  })

  const featuredTools = computed(() => {
    const pool = tools.value
    if (pool.length === 0) return []

    const featured = pool.filter((tool) => tool.featured)
    const popular = sortSitesForTab(
      options.sites.value.filter(hasPreview),
      'popular',
    )
      .map((site) => pool.find((tool) => tool.slug === site.slug))
      .filter((tool): tool is SitesHomeTool => Boolean(tool))

    const selected: SitesHomeTool[] = []
    const seen = new Set<string>()

    for (const tool of [...featured, ...popular]) {
      if (selected.length >= 16) break
      if (seen.has(tool.slug)) continue
      selected.push(tool)
      seen.add(tool.slug)
    }

    return selected
  })

  const trendingTools = computed(() => {
    return sortSitesForTab(options.sites.value.filter(hasPreview), 'trending')
      .map((site) => tools.value.find((tool) => tool.slug === site.slug))
      .filter((tool): tool is SitesHomeTool => Boolean(tool))
      .slice(0, 8)
  })

  const categories = computed<SitesHomeCategoryItem[]>(() => {
    return (Object.keys(SITE_GROUP_META) as SitesHomeGroupKey[]).map((key) => {
      const meta = SITE_GROUP_META[key]
      const count = options.sites.value.filter((site) => site.parentCategory === key).length

      return {
        key,
        name: meta.name,
        description: meta.description,
        count,
        countLabel: formatCountLabel(count, 'tool'),
        accent: meta.accent,
        to: meta.route,
        icon: meta.icon,
      }
    })
  })

  const libraries = computed<SitesHomeLibraryItem[]>(() => {
    const sites = options.sites.value

    return LIBRARY_DEFINITIONS.map((definition) => {
      const count = sites.filter((site) => definition.match(siteHaystack(site))).length

      return {
        id: definition.id,
        name: definition.name,
        count,
        countLabel: formatCountLabel(count, 'tool'),
        to: definition.route,
      }
    })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  })

  return {
    tools,
    heroTools,
    featuredTools,
    trendingTools,
    categories,
    libraries,
    formatCount,
  }
}
