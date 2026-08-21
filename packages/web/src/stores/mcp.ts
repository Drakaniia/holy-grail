import { computed, shallowRef } from 'vue'
import { defineStore } from 'pinia'

export interface McpTool {
  name: string
  description: string
}

export interface McpServer {
  slug: string
  name: string
  description: string
  category: string
  parentCategory: string
  icon: string
  verified: boolean
  featured: boolean
  tags: string[]
  website: string
  docs: string
  sourceCode: string
  installCommand: string
  transport: 'stdio' | 'http' | 'websocket'
  tools: McpTool[]
  connections: string[]
}

export const useMcpStore = defineStore('mcp', () => {
  const allServers = shallowRef<McpServer[]>([])
  const loading = shallowRef(false)
  const loaded = shallowRef(false)
  const loadError = shallowRef<string | null>(null)
  const searchQuery = shallowRef('')
  const activeCategory = shallowRef('All')
  let loadPromise: Promise<void> | null = null

  async function loadServers(force = false) {
    if (loaded.value && !force) return
    if (loadPromise && !force) return loadPromise

    loading.value = true
    loadError.value = null

    loadPromise = (async () => {
      try {
        const response = await fetch('/content/mcp-index.json', { cache: 'no-cache' })
        if (!response.ok) throw new Error(`Failed to load MCP index (${response.status})`)
        allServers.value = (await response.json()) as McpServer[]
        loaded.value = true
      } catch (error: unknown) {
        loadError.value = error instanceof Error ? error.message : 'Failed to load MCP index'
      } finally {
        loading.value = false
        loadPromise = null
      }
    })()

    return loadPromise
  }

  const categories = computed(() => {
    const cats = new Set(allServers.value.map((s) => s.category))
    return ['All', ...Array.from(cats).sort()]
  })

  const filteredServers = computed(() => {
    let result = [...allServers.value]

    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }

    if (activeCategory.value !== 'All') {
      result = result.filter((s) => s.category === activeCategory.value)
    }

    return result
  })

  function getServerBySlug(slug: string) {
    return allServers.value.find((s) => s.slug === slug)
  }

  function getServersByParentCategory(pc: string) {
    return allServers.value.filter((s) => s.parentCategory === pc)
  }

  return {
    allServers,
    loading,
    loaded,
    loadError,
    searchQuery,
    activeCategory,
    categories,
    filteredServers,
    loadServers,
    getServerBySlug,
    getServersByParentCategory,
  }
})
