<script setup lang="ts">
import { computed } from 'vue'
import SitesHomeCategoryDeck from '@/components/sites/home/SitesHomeCategoryDeck.vue'
import SitesHomeHero from '@/components/sites/home/SitesHomeHero.vue'
import SitesHomeShowcase from '@/components/sites/home/SitesHomeShowcase.vue'
import previewsIndex from '@/content/site-previews.json'
import { sortSitesForTab, useSitesStore, type Site } from '@/stores/sites'
import type {
  SitesHomeCategorySummary,
  SitesHomeGroupKey,
  SitesHomeMetric,
  SitesHomePreviewItem,
} from '@/types/sitesHome'

interface SitePreviewEntry {
  image: string
  small: string
}

interface SiteSubrouteDefinition {
  label: string
  route: string
  subcategory: string
}

interface SiteGroupDefinition {
  key: SitesHomeGroupKey
  name: string
  route: string
  description: string
  accent: string
  subroutes: SiteSubrouteDefinition[]
}

const store = useSitesStore()
const previews = previewsIndex as Record<string, SitePreviewEntry>

void store.loadSites()

const routeLabels: Record<string, string> = {
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

const siteGroups: SiteGroupDefinition[] = [
  {
    key: 'ai',
    name: 'AI',
    route: '/sites/ai',
    description: 'Chat labs, model APIs, image studios, automation tools, agent skills, research surfaces, and builder stacks.',
    accent: '#39ffb4',
    subroutes: [
      { label: 'Agent Skills', route: '/sites/ai/agent-skills', subcategory: 'agent-skills' },
      { label: 'Website Development', route: '/sites/ai/wb', subcategory: 'wb' },
      { label: 'Chat', route: '/sites/ai/chat', subcategory: 'chat' },
      { label: 'Image', route: '/sites/ai/image', subcategory: 'image' },
    ],
  },
  {
    key: 'design',
    name: 'Design',
    route: '/sites/design',
    description: 'Inspiration, fonts, 3D libraries, icon sources, prompts, design utilities, and visual systems.',
    accent: '#ff5f8f',
    subroutes: [
      { label: 'Inspiration', route: '/sites/design/inspiration', subcategory: 'inspiration' },
      { label: 'Design Tools', route: '/sites/design/design-tools', subcategory: 'design-tools' },
      { label: 'Icons/SVG', route: '/sites/design/icons-svg', subcategory: 'icons-svg' },
    ],
  },
  {
    key: 'development',
    name: 'Development',
    route: '/sites/development',
    description: 'Cloud hosting, learning paths, references, tooling, CLI agents, UI libraries, repos, and MCP.',
    accent: '#7aa7ff',
    subroutes: [
      { label: 'Cloud & Hosting', route: '/sites/development/cloud-hosting', subcategory: 'cloud-hosting' },
      { label: 'CLI Tools', route: '/sites/development/cli-tools', subcategory: 'cli-tools' },
      { label: 'UI Libraries', route: '/sites/development/ui-libraries', subcategory: 'ui-libraries' },
    ],
  },
  {
    key: 'watch',
    name: 'Watch',
    route: '/sites/watch',
    description: 'Movie and anime watch shelves gathered from the imported browser catalog.',
    accent: '#ffd166',
    subroutes: [
      { label: 'Movies', route: '/sites/watch/movies', subcategory: 'movies' },
      { label: 'Anime', route: '/sites/watch/anime', subcategory: 'anime' },
    ],
  },
  {
    key: 'downloads',
    name: 'Downloads',
    route: '/sites/downloads',
    description: 'Game, VFX, software, torrent, and movie download references kept in one scan-friendly lane.',
    accent: '#ff8c1a',
    subroutes: [
      { label: 'Software', route: '/sites/downloads/software-download', subcategory: 'software-download' },
      { label: 'Games', route: '/sites/downloads/game-download', subcategory: 'game-download' },
      { label: 'VFX', route: '/sites/downloads/vfx-download', subcategory: 'vfx-download' },
    ],
  },
]

function formatCount(value: number, loaded: boolean) {
  if (!loaded && value === 0) return '0'

  return Intl.NumberFormat('en', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatCountLabel(value: number, loaded: boolean, noun: string) {
  const label = formatCount(value, loaded)
  const suffix = value === 1 ? noun : `${noun}s`

  return `${label} ${suffix}`
}

function getPreviewName(site: Site) {
  return site.name.split(/\s[|-]\s/)[0]?.trim() || site.name
}

function getRouteLabel(slug: string | null) {
  if (!slug) return 'Sites'

  const generatedLabel = slug
    .split('-')
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')

  return routeLabels[slug] || generatedLabel
}

function hasPreview(site: Site) {
  return Boolean(previews[site.slug]?.image)
}

function toPreviewItem(site: Site, index: number): SitesHomePreviewItem | null {
  const preview = previews[site.slug]
  if (!preview) return null

  return {
    slug: site.slug,
    name: getPreviewName(site),
    category: getRouteLabel(site.subcategory || site.parentCategory),
    description: site.description,
    image: preview.image,
    small: preview.small,
    to: `/sites/${site.slug}`,
    rank: String(index + 1).padStart(2, '0'),
    parentCategory: site.parentCategory,
  }
}

function getPopularSites(sites: Site[]) {
  return sortSitesForTab(sites, 'popular')
}

const isLoading = computed(() => store.loading && !store.loaded)

const previewItems = computed(() =>
  getPopularSites(store.allSites.filter(hasPreview))
    .map(toPreviewItem)
    .filter((item): item is SitesHomePreviewItem => Boolean(item)),
)

const metrics = computed<SitesHomeMetric[]>(() => [
  {
    label: 'Sites',
    value: formatCount(store.allSites.length, store.loaded),
    accent: '#ff8c1a',
  },
  {
    label: 'Previews',
    value: formatCount(previewItems.value.length, store.loaded),
    accent: '#39ffb4',
  },
  {
    label: 'Corridors',
    value: formatCount(siteGroups.length, true),
    accent: '#7aa7ff',
  },
])

const categorySummaries = computed<SitesHomeCategorySummary[]>(() =>
  siteGroups.map((group) => {
    const sites = store.getSitesByParentCategory(group.key)
    const popularSites = getPopularSites(sites)

    return {
      key: group.key,
      name: group.name,
      route: group.route,
      description: group.description,
      countLabel: formatCountLabel(sites.length, store.loaded, 'site'),
      accent: group.accent,
      subroutes: group.subroutes.map(subroute => ({
        label: subroute.label,
        to: subroute.route,
        countLabel: formatCount(
          store.getSitesBySubcategory(group.key, subroute.subcategory).length,
          store.loaded,
        ),
      })),
      featuredNames: popularSites.slice(0, 3).map(getPreviewName),
    }
  }),
)

const showcaseItems = computed(() => {
  const selectedSites: Site[] = []
  const seenSlugs = new Set<string>()

  for (const group of siteGroups) {
    const [site] = getPopularSites(store.getSitesByParentCategory(group.key).filter(hasPreview))

    if (site && !seenSlugs.has(site.slug)) {
      selectedSites.push(site)
      seenSlugs.add(site.slug)
    }
  }

  for (const site of getPopularSites(store.allSites.filter(hasPreview))) {
    if (selectedSites.length >= 6) break
    if (seenSlugs.has(site.slug)) continue

    selectedSites.push(site)
    seenSlugs.add(site.slug)
  }

  return selectedSites
    .slice(0, 6)
    .map(toPreviewItem)
    .filter((item): item is SitesHomePreviewItem => Boolean(item))
})
</script>

<template>
  <div class="sites-home-page">
    <SitesHomeHero
      :metrics="metrics"
      :preview-items="previewItems"
      :is-loading="isLoading"
    />
    <SitesHomeCategoryDeck :summaries="categorySummaries" />
    <SitesHomeShowcase
      :items="showcaseItems"
      :is-loading="isLoading"
    />
  </div>
</template>

<style scoped>
.sites-home-page {
  min-height: 100%;
  background: #050505;
  color: #ffffff;
}

:global(html.light) .sites-home-page {
  background: var(--mocha-bg);
  color: var(--mocha-text);
}
</style>
