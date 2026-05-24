import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'

export interface SiteFeature {
  name: string
  description: string
  icon: string
}

export interface SimilarTool {
  slug: string
  name: string
  description: string
  stars: number
  addedDaysAgo: number
  verified: boolean
  website?: string
}

export interface Site {
  slug: string
  name: string
  description: string
  category: string
  parentCategory: string
  subcategory: string | null
  stars: number
  watchers: number
  addedDaysAgo: number
  license: string
  lastCommit: string
  lastRelease: string
  version: string
  contributors: number
  commitsThisYear: number
  releases: number
  platforms: string[]
  deployment: string[]
  website: string
  docs: string
  sourceCode: string
  icon: string
  verified: boolean
  featured: boolean
  tags?: string[]
  atGlance?: string
  fullDescription?: string
  coreFeatures?: SiteFeature[]
  additionalFeatures?: SiteFeature[]
  deployCompose?: string
  installCommand?: string
  similarTools?: SimilarTool[]
}

export type SiteSortTab = 'trending' | 'newest' | 'popular'

const nameCollator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })

function compareNumbers(first: number, second: number, direction: 'asc' | 'desc') {
  if (first === second) return 0
  return direction === 'asc' ? first - second : second - first
}

function compareBoolean(first: boolean, second: boolean) {
  if (first === second) return 0
  return first ? -1 : 1
}

function compareNames(first: Site, second: Site) {
  return nameCollator.compare(first.name || first.slug, second.name || second.slug)
}

function compareNamesDescending(first: Site, second: Site) {
  return compareNames(second, first)
}

// Imported bookmark entries often have no repo metrics, so use catalog metadata as a stable tie-breaker.
function catalogReach(site: Site) {
  return (
    (site.tags?.length ?? 0) +
    site.platforms.length +
    site.deployment.length +
    (site.website ? 1 : 0) +
    (site.docs && site.docs !== site.website ? 1 : 0) +
    (site.sourceCode ? 1 : 0)
  )
}

function compareSiteStatusFallbacks(first: Site, second: Site) {
  return (
    compareBoolean(first.featured, second.featured) ||
    compareBoolean(first.verified, second.verified) ||
    compareNumbers(first.contributors, second.contributors, 'desc')
  )
}

function compareSiteFallbacks(first: Site, second: Site) {
  return (
    compareSiteStatusFallbacks(first, second) ||
    compareNames(first, second)
  )
}

function compareSitePopularityFallbacks(first: Site, second: Site) {
  return (
    compareSiteStatusFallbacks(first, second) ||
    compareNumbers(catalogReach(first), catalogReach(second), 'desc') ||
    compareNumbers(first.name.length, second.name.length, 'desc') ||
    compareNames(first, second)
  )
}

function compareSiteActivitySignals(first: Site, second: Site) {
  return (
    compareNumbers(first.commitsThisYear, second.commitsThisYear, 'desc') ||
    compareNumbers(first.releases, second.releases, 'desc') ||
    compareSiteStatusFallbacks(first, second)
  )
}

function compareSiteActivity(first: Site, second: Site) {
  return (
    compareSiteActivitySignals(first, second) ||
    compareSiteFallbacks(first, second)
  )
}

export function sortSitesForTab(sites: Site[], tab: SiteSortTab) {
  return [...sites].sort((first, second) => {
    switch (tab) {
      case 'trending':
        return (
          compareNumbers(first.stars, second.stars, 'desc') ||
          compareSiteActivity(first, second)
        )
      case 'newest':
        return (
          compareNumbers(first.addedDaysAgo, second.addedDaysAgo, 'asc') ||
          compareSiteActivitySignals(first, second) ||
          compareNamesDescending(first, second)
        )
      case 'popular':
        return (
          compareNumbers(first.watchers, second.watchers, 'desc') ||
          compareNumbers(first.stars, second.stars, 'desc') ||
          compareSitePopularityFallbacks(first, second)
        )
    }
  })
}

export const useSitesStore = defineStore('sites', () => {
  const allSites = shallowRef<Site[]>([])
  const searchQuery = shallowRef('')
  const activeCategory = shallowRef('All')
  const activeTab = shallowRef<SiteSortTab>('trending')
  const currentPage = shallowRef(1)
  const loading = shallowRef(false)
  const loaded = shallowRef(false)
  const loadError = shallowRef<string | null>(null)
  const itemsPerPage = 12
  let loadPromise: Promise<void> | null = null

  const loadSites = async (force = false): Promise<void> => {
    if (loaded.value && !force) return
    if (loadPromise && !force) return loadPromise

    loading.value = true
    loadError.value = null

    loadPromise = (async () => {
      try {
        const response = await fetch('/content/sites-index.json', { cache: 'no-cache' })

        if (!response.ok) {
          throw new Error(`Failed to load sites index (${response.status})`)
        }

        allSites.value = await response.json() as Site[]
        loaded.value = true
      } catch (error) {
        loadError.value = error instanceof Error ? error.message : 'Failed to load sites index'
      } finally {
        loading.value = false
        loadPromise = null
      }
    })()

    return loadPromise
  }

  const categories = computed(() => {
    const cats = new Set(allSites.value.map(s => s.category))
    return ['All', ...Array.from(cats).sort()]
  })

  const getSitesByParentCategory = (parentCategory: string) => {
    return allSites.value.filter(s => s.parentCategory === parentCategory)
  }

  const getSitesBySubcategory = (parentCategory: string, subcategory: string) => {
    return allSites.value.filter(
      s => s.parentCategory === parentCategory && s.subcategory === subcategory
    )
  }

  const filteredSites = computed(() => {
    let result = [...allSites.value]

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(
        s =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query) ||
          (s.tags && s.tags.some(t => t.toLowerCase().includes(query)))
      )
    }

    if (activeCategory.value !== 'All') {
      result = result.filter(s => s.category === activeCategory.value)
    }

    return sortSitesForTab(result, activeTab.value)
  })

  const paginatedSites = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return filteredSites.value.slice(start, start + itemsPerPage)
  })

  const totalPages = computed(() => Math.ceil(filteredSites.value.length / itemsPerPage))

  const getSiteBySlug = (slug: string) => {
    return allSites.value.find(s => s.slug === slug)
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
    currentPage.value = 1
  }

  const setCategory = (category: string) => {
    activeCategory.value = category
    currentPage.value = 1
  }

  const setTab = (tab: SiteSortTab) => {
    activeTab.value = tab
    currentPage.value = 1
  }

  const setPage = (page: number) => {
    currentPage.value = Math.max(1, Math.floor(page))
  }

  return {
    allSites,
    loading,
    loaded,
    loadError,
    searchQuery,
    activeCategory,
    activeTab,
    currentPage,
    itemsPerPage,
    categories,
    filteredSites,
    paginatedSites,
    totalPages,
    loadSites,
    getSiteBySlug,
    getSitesByParentCategory,
    getSitesBySubcategory,
    setSearchQuery,
    setCategory,
    setTab,
    setPage,
  }
})
