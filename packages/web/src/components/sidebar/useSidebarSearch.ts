import { computed, ref } from 'vue'
import type { Component } from 'vue'
import { Layers, LayoutGrid, Plug, Puzzle, Sparkles } from 'lucide-vue-next'
import {
  sidebarSections,
  sidebarSearchEntries,
  type SidebarScope,
  type SidebarSectionKey,
} from './sidebarNav'
import { useSidebarCounts } from './useSidebarCounts'

export type SidebarSearchSort = 'relevance' | 'alpha' | 'count'

export interface SidebarScopeOption {
  key: SidebarScope
  name: string
  icon: Component
}

export interface SidebarSearchSortOption {
  key: SidebarSearchSort
  name: string
}

export interface SidebarSearchResult {
  id: string
  name: string
  route: string
  icon: Component
  parent: string
  section: SidebarSectionKey
  count: number
  rank: number
}

export interface SidebarSearchGroup {
  id: string
  parent: string
  section: SidebarSectionKey
  results: SidebarSearchResult[]
}

export const sidebarScopeOptions: SidebarScopeOption[] = [
  { key: 'all', name: 'All', icon: LayoutGrid },
  ...sidebarSections.map((section) => ({
    key: section.key as SidebarScope,
    name: section.name,
    icon:
      section.key === 'sites'
        ? Layers
        : section.key === 'extensions'
          ? Puzzle
          : section.key === 'mcp'
            ? Plug
            : Sparkles,
  })),
]

export const sidebarSortOptions: SidebarSearchSortOption[] = [
  { key: 'relevance', name: 'Best match' },
  { key: 'alpha', name: 'A–Z' },
  { key: 'count', name: 'Most items' },
]

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ')
}

/**
 * Search model for the sidebar column. The nav tree is never filtered: a query swaps the whole
 * body panel over to the results view, so groups stop exploding open mid-keystroke.
 */
export function useSidebarSearch() {
  const counts = useSidebarCounts()
  const query = ref('')
  const scope = ref<SidebarScope>('all')
  const sort = ref<SidebarSearchSort>('relevance')

  const normalizedQuery = computed(() => normalize(query.value).trim())
  const terms = computed(() => normalizedQuery.value.split(' ').filter(Boolean))
  const hasQuery = computed(() => terms.value.length > 0)

  const allMatches = computed<SidebarSearchResult[]>(() => {
    const haystackTerms = terms.value
    if (haystackTerms.length === 0) return []

    const results: SidebarSearchResult[] = []
    const firstTerm = haystackTerms[0] ?? ''

    for (const entry of sidebarSearchEntries) {
      const name = normalize(entry.name)
      const haystack = `${normalize(entry.parent)} ${name} ${normalize(entry.route)}`

      if (!haystackTerms.every((term) => haystack.includes(term))) continue

      const rank = name.startsWith(firstTerm)
        ? 0
        : name.includes(normalizedQuery.value)
          ? 1
          : haystackTerms.every((term) => name.includes(term))
            ? 2
            : 3

      results.push({
        id: `${entry.section}:${entry.route}`,
        name: entry.name,
        route: entry.route,
        icon: entry.icon,
        parent: entry.parent,
        section: entry.section,
        count: counts.getRouteCount(entry.route),
        rank,
      })
    }

    return results
  })

  const scopedMatches = computed(() =>
    scope.value === 'all'
      ? allMatches.value
      : allMatches.value.filter((result) => result.section === scope.value),
  )

  const sortedMatches = computed(() => {
    const results = [...scopedMatches.value]

    if (sort.value === 'alpha') {
      return results.sort((a, b) => a.name.localeCompare(b.name))
    }

    if (sort.value === 'count') {
      return results.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    }

    return results.sort(
      (a, b) => a.rank - b.rank || b.count - a.count || a.name.localeCompare(b.name),
    )
  })

  const resultGroups = computed<SidebarSearchGroup[]>(() => {
    const groups = new Map<string, SidebarSearchGroup>()

    for (const result of sortedMatches.value) {
      const id = `${result.section}:${result.parent}`
      const group = groups.get(id)

      if (group) {
        group.results.push(result)
      } else {
        groups.set(id, {
          id,
          parent: result.parent,
          section: result.section,
          results: [result],
        })
      }
    }

    return [...groups.values()]
  })

  const resultCount = computed(() => sortedMatches.value.length)

  function clearSearch() {
    query.value = ''
    scope.value = 'all'
    sort.value = 'relevance'
  }

  return {
    query,
    scope,
    sort,
    hasQuery,
    resultCount,
    resultGroups,
    scopeOptions: sidebarScopeOptions,
    sortOptions: sidebarSortOptions,
    clearSearch,
  }
}
