import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { fetchSkillContent, type SkillContent } from '@/lib/github'

export interface Skill {
  slug: string
  title: string
  description: string
  category: string
  parentCategory: string
  tags: string[]
  views: number
  uses: number
  author: string
  authorName: string
  repoLink: string
  skillPath: string
  branch: string
  addedBy: string
  featured: boolean
  dateAdded: string
  hasLocalContent: boolean
}

const CACHE_KEY = 'skills-content-cache'
const CACHE_TTL = 1000 * 60 * 60 * 24

function getCachedContent(slug: string): SkillContent | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null

    const cache: Record<string, { data: SkillContent; timestamp: number }> = JSON.parse(raw)
    const entry = cache[slug]

    if (!entry) return null
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      delete cache[slug]
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
      return null
    }

    return entry.data
  } catch {
    return null
  }
}

function setCachedContent(slug: string, content: SkillContent): void {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    const cache: Record<string, { data: SkillContent; timestamp: number }> = raw ? JSON.parse(raw) : {}
    cache[slug] = { data: content, timestamp: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
  }
}

export const useSkillsStore = defineStore('skills', () => {
  const allSkills = shallowRef<Skill[]>([])
  const searchQuery = shallowRef('')
  const activeCategory = shallowRef('All')
  const activeTab = shallowRef<'popular' | 'trending' | 'recent'>('popular')
  const currentPage = shallowRef(1)
  const loading = shallowRef(false)
  const loaded = shallowRef(false)
  const loadError = shallowRef<string | null>(null)
  const itemsPerPage = 12
  let loadPromise: Promise<void> | null = null

  const contentCache = ref<Record<string, SkillContent | null>>({})
  const contentLoading = ref<Record<string, boolean>>({})
  const contentError = ref<Record<string, string | null>>({})

  const loadSkills = async (force = false): Promise<void> => {
    if (loaded.value && !force) return
    if (loadPromise && !force) return loadPromise

    loading.value = true
    loadError.value = null

    loadPromise = (async () => {
      try {
        const response = await fetch('/content/skills-index.json', { cache: 'no-cache' })

        if (!response.ok) {
          throw new Error(`Failed to load skills index (${response.status})`)
        }

        allSkills.value = await response.json() as Skill[]
        loaded.value = true
      } catch (error) {
        loadError.value = error instanceof Error ? error.message : 'Failed to load skills index'
      } finally {
        loading.value = false
        loadPromise = null
      }
    })()

    return loadPromise
  }

  const categories = computed(() => {
    const cats = new Set(allSkills.value.map(s => s.category))
    return ['All', ...Array.from(cats).sort()]
  })

  const getSkillsByParentCategory = (parentCategory: string) => {
    return allSkills.value.filter(s => s.parentCategory === parentCategory)
  }

  const filteredSkills = computed(() => {
    let result = [...allSkills.value]

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(
        s =>
          s.title.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.tags.some(t => t.toLowerCase().includes(query))
      )
    }

    if (activeCategory.value !== 'All') {
      result = result.filter(s => s.category === activeCategory.value)
    }

    switch (activeTab.value) {
      case 'popular':
        result.sort((a, b) => b.views - a.views)
        break
      case 'trending':
        result.sort((a, b) => b.uses - a.uses)
        break
      case 'recent':
        result.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
        break
    }

    return result
  })

  const paginatedSkills = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    return filteredSkills.value.slice(start, start + itemsPerPage)
  })

  const totalPages = computed(() => Math.ceil(filteredSkills.value.length / itemsPerPage))

  const getSkillBySlug = (slug: string) => {
    return allSkills.value.find(s => s.slug === slug)
  }

  const getSkillContent = async (slug: string): Promise<SkillContent | null> => {
    if (contentCache.value[slug] !== undefined) {
      return contentCache.value[slug]
    }

    const cached = getCachedContent(slug)
    if (cached) {
      contentCache.value[slug] = cached
      return cached
    }

    const skill = getSkillBySlug(slug)
    if (!skill) {
      contentError.value[slug] = 'Skill not found'
      return null
    }

    if (skill.hasLocalContent) {
      try {
        const localPath = `/src/content/skills/${skill.parentCategory}/${slug}/SKILL.md`
        const response = await fetch(localPath)
        if (response.ok) {
          const markdown = await response.text()
          const content: SkillContent = {
            markdown,
            html: '',
          }
          contentCache.value[slug] = content
          setCachedContent(slug, content)
          return content
        }
      } catch {
      }
    }

    const [owner, repo] = skill.repoLink.split('/')
    if (!owner || !repo) {
      contentError.value[slug] = 'Invalid repository link'
      return null
    }

    contentLoading.value[slug] = true
    contentError.value[slug] = null

    try {
      const content = await fetchSkillContent(owner, repo, skill.skillPath, skill.branch)
      contentCache.value[slug] = content
      setCachedContent(slug, content)
      return content
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch skill content'
      contentError.value[slug] = message
      contentCache.value[slug] = null
      return null
    } finally {
      contentLoading.value[slug] = false
    }
  }

  const isContentLoading = (slug: string) => contentLoading.value[slug] || false
  const getContentError = (slug: string) => contentError.value[slug] || null

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
    currentPage.value = 1
  }

  const setCategory = (category: string) => {
    activeCategory.value = category
    currentPage.value = 1
  }

  const setTab = (tab: 'popular' | 'trending' | 'recent') => {
    activeTab.value = tab
    currentPage.value = 1
  }

  const setPage = (page: number) => {
    currentPage.value = Math.max(1, Math.floor(page))
  }

  return {
    allSkills,
    loading,
    loaded,
    loadError,
    searchQuery,
    activeCategory,
    activeTab,
    currentPage,
    itemsPerPage,
    categories,
    filteredSkills,
    paginatedSkills,
    totalPages,
    loadSkills,
    getSkillBySlug,
    getSkillsByParentCategory,
    getSkillContent,
    isContentLoading,
    getContentError,
    setSearchQuery,
    setCategory,
    setTab,
    setPage,
  }
})
