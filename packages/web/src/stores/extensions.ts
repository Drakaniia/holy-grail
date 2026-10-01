import { shallowRef } from 'vue'
import { defineStore } from 'pinia'
import type { SiteFeature, SimilarTool } from '@/stores/sites'

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
  coreFeatures?: SiteFeature[]
  additionalFeatures?: SiteFeature[]
  similarTools?: SimilarTool[]
  chromeWebStoreId: string
  chromeWebStoreRating: number
  userCount: number
  permissions: string[]
  manifestVersion: number
}

export const useExtensionsStore = defineStore('extensions', () => {
  const allExtensions = shallowRef<Extension[]>([])
  const loading = shallowRef(false)
  const loaded = shallowRef(false)
  const loadError = shallowRef<string | null>(null)
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

  const getExtensionsByParentCategory = (parentCategory: string) =>
    allExtensions.value.filter((e) => e.parentCategory === parentCategory)

  const getExtensionsBySubcategory = (parentCategory: string, subcategory: string) =>
    allExtensions.value.filter(
      (e) => e.parentCategory === parentCategory && e.subcategory === subcategory,
    )

  const getExtensionBySlug = (slug: string) => allExtensions.value.find((e) => e.slug === slug)

  return {
    allExtensions,
    loading,
    loaded,
    loadError,
    loadExtensions,
    getExtensionBySlug,
    getExtensionsByParentCategory,
    getExtensionsBySubcategory,
  }
})
