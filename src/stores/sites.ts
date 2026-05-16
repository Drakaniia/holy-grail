import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import sitesIndex from '@/content/sites-index.json'

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
  similarTools?: SimilarTool[]
}

export const useSitesStore = defineStore('sites', () => {
  const allSites = ref<Site[]>(sitesIndex as Site[])
  const searchQuery = ref('')
  const activeCategory = ref('All')
  const activeTab = ref<'trending' | 'newest' | 'popular'>('trending')
  const currentPage = ref(1)
  const itemsPerPage = 12

  const categories = computed(() => {
    const cats = new Set(allSites.value.map(s => s.category))
    return ['All', ...Array.from(cats).sort()]
  })

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

    switch (activeTab.value) {
      case 'trending':
        result.sort((a, b) => b.stars - a.stars)
        break
      case 'newest':
        result.sort((a, b) => a.addedDaysAgo - b.addedDaysAgo)
        break
      case 'popular':
        result.sort((a, b) => b.watchers - a.watchers)
        break
    }

    return result
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

  const setTab = (tab: 'trending' | 'newest' | 'popular') => {
    activeTab.value = tab
  }

  const setPage = (page: number) => {
    currentPage.value = page
  }

  return {
    allSites,
    searchQuery,
    activeCategory,
    activeTab,
    currentPage,
    itemsPerPage,
    categories,
    filteredSites,
    paginatedSites,
    totalPages,
    getSiteBySlug,
    setSearchQuery,
    setCategory,
    setTab,
    setPage,
  }
})
