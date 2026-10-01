import { computed } from 'vue'
import { useSitesStore } from '@/stores/sites'
import { useSkillsStore } from '@/stores/skills'
import { useExtensionsStore } from '@/stores/extensions'
import { useMcpStore } from '@/stores/mcp'
import {
  extensionCategories,
  mcpCategories,
  siteSubcategoryGroups,
  type SiteGroup,
} from './sidebarNav'

/**
 * Catalog sizes keyed by the route they belong to. One composable so the browse tree, the search
 * panel and the footer badge all read the same numbers instead of each store recomputing them.
 */
export function useSidebarCounts() {
  const sitesStore = useSitesStore()
  const skillsStore = useSkillsStore()
  const extensionsStore = useExtensionsStore()
  const mcpStore = useMcpStore()

  const siteRouteCounts = computed<Record<string, number>>(() => {
    const counts: Record<string, number> = {}

    for (const group of siteSubcategoryGroups) {
      for (const item of group.items) {
        const subcategory = item.route.split('/').pop()
        counts[item.route] = subcategory
          ? sitesStore.getSitesBySubcategory(group.parentCategory, subcategory).length
          : 0
      }
    }

    return counts
  })

  const skillRouteCounts = computed<Record<string, number>>(() => ({
    '/skills/skills': skillsStore.getSkillsByParentCategory('skills').length,
    '/skills/design': skillsStore.getSkillsByParentCategory('design').length,
  }))

  const extensionRouteCounts = computed<Record<string, number>>(() => {
    const counts: Record<string, number> = {}
    for (const category of extensionCategories) {
      const key = category.route.split('/').pop() || ''
      counts[category.route] = extensionsStore.getExtensionsByParentCategory(key).length
    }
    return counts
  })

  const mcpRouteCounts = computed<Record<string, number>>(() => {
    const counts: Record<string, number> = {}
    for (const category of mcpCategories) {
      const key = category.route.split('/').pop() || ''
      counts[category.route] = mcpStore.getServersByParentCategory(key).length
    }
    return counts
  })

  const siteGroupCounts = computed<Record<SiteGroup, number>>(() => ({
    ai: sitesStore.getSitesByParentCategory('ai').length,
    design: sitesStore.getSitesByParentCategory('design').length,
    development: sitesStore.getSitesByParentCategory('development').length,
    watch: sitesStore.getSitesByParentCategory('watch').length,
    downloads: sitesStore.getSitesByParentCategory('downloads').length,
  }))

  /** Every route-keyed count merged, so a row can ask "how many items are behind this link?". */
  const routeCounts = computed<Record<string, number>>(() => ({
    ...siteRouteCounts.value,
    ...skillRouteCounts.value,
    ...extensionRouteCounts.value,
    ...mcpRouteCounts.value,
  }))

  function getRouteCount(route: string) {
    return routeCounts.value[route] ?? 0
  }

  function getSiteGroupCount(group: SiteGroup | string) {
    return siteGroupCounts.value[group as SiteGroup] ?? 0
  }

  return {
    getRouteCount,
    getSiteGroupCount,
  }
}
