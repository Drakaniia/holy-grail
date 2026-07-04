import { computed, shallowRef } from 'vue'
import { defineStore } from 'pinia'

export interface ExtensionFeature {
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

export interface Extension {
  slug: string
  name: string
  description: string
  category: string
  parentCategory: string
  subcategory: string | null
  version: string
  addedDaysAgo: number
  license: string
  website: string
  docs: string
  sourceCode: string
  icon: string
  verified: boolean
  featured: boolean
  tags?: string[]
  atGlance?: string
  fullDescription?: string
  coreFeatures?: ExtensionFeature[]
  additionalFeatures?: ExtensionFeature[]
  similarTools?: SimilarTool[]
  chromeWebStoreId: string
  chromeWebStoreRating: number
  userCount: number
  permissions: string[]
  manifestVersion: number
  installButtonBehavior: string
}

export type ExtensionSortTab = 'trending' | 'newest' | 'popular'

export function sortExtensionsForTab(extensions: Extension[], tab: ExtensionSortTab) {
  return [...extensions].sort((a, b) => {
    if (tab === 'trending') {
      return (
        (b.chromeWebStoreRating || 0) - (a.chromeWebStoreRating || 0) ||
        b.addedDaysAgo - a.addedDaysAgo
      )
    }
    if (tab === 'newest') {
      return a.addedDaysAgo - b.addedDaysAgo
    }
    return (b.chromeWebStoreRating || 0) - (a.chromeWebStoreRating || 0)
  })
}

export const useExtensionsStore = defineStore('extensions', () => {
  const allExtensions = shallowRef<Extension[]>([])
  const searchQuery = shallowRef('')
  const activeCategory = shallowRef('All')
  const activeTab = shallowRef<ExtensionSortTab>('popular')
  const currentPage = shallowRef(1)
  const loading = shallowRef(false)
  const loaded = shallowRef(false)
  const loadError = shallowRef<string | null>(null)
  const itemsPerPage = 12
  let loadPromise: Promise<void> | null = null

  async function loadExtensions(force = false) {
    if (loaded.value && !force) return
    if (loadPromise && !force) return loadPromise

    loading.value = true
    loadError.value = null

    loadPromise = (async () => {
      try {
        const response = await fetch('/content/extensions-index.json', { cache: 'no-cache' })
        if (!response.ok) throw new Error(`Failed to load extensions index (${response.status})`)
        allExtensions.value = (await response.json()) as Extension[]
        loaded.value = true
      } catch (error: unknown) {
        loadError.value = error instanceof Error ? error.message : 'Failed to load extensions index'
      } finally {
        loading.value = false
        loadPromise = null
      }
    })()

    return loadPromise
  }

  const categories = computed(() => {
    const cats = new Set(allExtensions.value.map((e) => e.category))
    return ['All', ...Array.from(cats).sort()]
  })

  const getExtensionsByParentCategory = (parentCategory: string) =>
    allExtensions.value.filter((e) => e.parentCategory === parentCategory)

  const getExtensionsBySubcategory = (parentCategory: string, subcategory: string) =>
    allExtensions.value.filter(
      (e) => e.parentCategory === parentCategory && e.subcategory === subcategory,
    )

  const getExtensionBySlug = (slug: string) => allExtensions.value.find((e) => e.slug === slug)

  const filteredExtensions = computed(() => {
    let result = [...allExtensions.value]

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.category.toLowerCase().includes(query) ||
          e.tags?.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    if (activeCategory.value !== 'All') {
      result = result.filter((e) => e.category === activeCategory.value)
    }

    return sortExtensionsForTab(result, activeTab.value)
  })

  const paginatedExtensions = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return filteredExtensions.value.slice(start, start + itemsPerPage)
  })

  const totalPages = computed(() => Math.ceil(filteredExtensions.value.length / itemsPerPage))

  function setSearchQuery(query: string) {
    searchQuery.value = query
    currentPage.value = 1
  }

  function setCategory(category: string) {
    activeCategory.value = category
    currentPage.value = 1
  }

  function setTab(tab: ExtensionSortTab) {
    activeTab.value = tab
    currentPage.value = 1
  }

  function setPage(page: number) {
    currentPage.value = Math.max(1, Math.floor(page))
  }

  function reset() {
    searchQuery.value = ''
    activeCategory.value = 'All'
    activeTab.value = 'popular'
    currentPage.value = 1
  }

  return {
    allExtensions,
    loading,
    loaded,
    loadError,
    searchQuery,
    activeCategory,
    activeTab,
    currentPage,
    itemsPerPage,
    categories,
    filteredExtensions,
    paginatedExtensions,
    totalPages,
    loadExtensions,
    getExtensionBySlug,
    getExtensionsByParentCategory,
    getExtensionsBySubcategory,
    setSearchQuery,
    setCategory,
    setTab,
    setPage,
    reset,
  }
})
