import { computed, shallowRef } from 'vue'
import { useSitesStore } from '@/stores/sites'
import { useSkillsStore } from '@/stores/skills'
import { useExtensionsStore } from '@/stores/extensions'
import {
  aiSubcategories,
  designSubcategories,
  developmentSubcategories,
  watchSubcategories,
  downloadsSubcategories,
  skillsNav,
  extensionCategories,
  siteGroupNav,
  siteSubcategoryGroups,
  type SiteGroup,
} from './sidebarNav'

export function useSidebarSearch() {
  const sitesStore = useSitesStore()
  const skillsStore = useSkillsStore()
  const extensionsStore = useExtensionsStore()

  const sidebarSearch = shallowRef('')

  const sidebarSearchTerms = computed(() =>
    sidebarSearch.value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean),
  )

  const hasSidebarSearch = computed(() => sidebarSearchTerms.value.length > 0)

  function matchesSidebarSearch(label: string, routePath = '', parent = '') {
    if (!hasSidebarSearch.value) return true

    const haystack = `${parent} ${label} ${routePath}`.toLowerCase().replace(/[^a-z0-9]+/g, ' ')

    return sidebarSearchTerms.value.every((term) => haystack.includes(term))
  }

  function filterSidebarItems<T extends { name: string; route: string }>(
    items: T[],
    showAll: boolean,
    parent = '',
  ) {
    return showAll
      ? items
      : items.filter((item) => matchesSidebarSearch(item.name, item.route, parent))
  }

  function clearSidebarSearch() {
    sidebarSearch.value = ''
  }

  const sitesSectionMatches = computed(
    () => hasSidebarSearch.value && matchesSidebarSearch('Sites'),
  )
  const skillsSectionMatches = computed(
    () => hasSidebarSearch.value && matchesSidebarSearch('Skills'),
  )
  const extensionsSectionMatches = computed(
    () => hasSidebarSearch.value && matchesSidebarSearch('Extensions'),
  )

  const showAllSitesTabs = computed(() => !hasSidebarSearch.value || sitesSectionMatches.value)
  const showAllSkillsTabs = computed(() => !hasSidebarSearch.value || skillsSectionMatches.value)
  const showAllExtensionsTabs = computed(
    () => !hasSidebarSearch.value || extensionsSectionMatches.value,
  )

  const aiGroupMatches = computed(
    () => hasSidebarSearch.value && matchesSidebarSearch('AI', '/sites/ai', 'Sites'),
  )
  const designGroupMatches = computed(
    () => hasSidebarSearch.value && matchesSidebarSearch('Design', '/sites/design', 'Sites'),
  )
  const developmentGroupMatches = computed(
    () =>
      hasSidebarSearch.value && matchesSidebarSearch('Development', '/sites/development', 'Sites'),
  )
  const watchGroupMatches = computed(
    () => hasSidebarSearch.value && matchesSidebarSearch('Watch', '/sites/watch', 'Sites'),
  )
  const downloadsGroupMatches = computed(
    () => hasSidebarSearch.value && matchesSidebarSearch('Downloads', '/sites/downloads', 'Sites'),
  )

  const visibleAiSubcategories = computed(() =>
    filterSidebarItems(aiSubcategories, showAllSitesTabs.value || aiGroupMatches.value, 'Sites AI'),
  )
  const visibleDesignSubcategories = computed(() =>
    filterSidebarItems(
      designSubcategories,
      showAllSitesTabs.value || designGroupMatches.value,
      'Sites Design',
    ),
  )
  const visibleDevelopmentSubcategories = computed(() =>
    filterSidebarItems(
      developmentSubcategories,
      showAllSitesTabs.value || developmentGroupMatches.value,
      'Sites Development',
    ),
  )
  const visibleWatchSubcategories = computed(() =>
    filterSidebarItems(
      watchSubcategories,
      showAllSitesTabs.value || watchGroupMatches.value,
      'Sites Watch',
    ),
  )
  const visibleDownloadsSubcategories = computed(() =>
    filterSidebarItems(
      downloadsSubcategories,
      showAllSitesTabs.value || downloadsGroupMatches.value,
      'Sites Downloads',
    ),
  )

  const showAiGroup = computed(
    () => showAllSitesTabs.value || aiGroupMatches.value || visibleAiSubcategories.value.length > 0,
  )
  const showDesignGroup = computed(
    () =>
      showAllSitesTabs.value ||
      designGroupMatches.value ||
      visibleDesignSubcategories.value.length > 0,
  )
  const showDevelopmentGroup = computed(
    () =>
      showAllSitesTabs.value ||
      developmentGroupMatches.value ||
      visibleDevelopmentSubcategories.value.length > 0,
  )
  const showWatchGroup = computed(
    () =>
      showAllSitesTabs.value ||
      watchGroupMatches.value ||
      visibleWatchSubcategories.value.length > 0,
  )
  const showDownloadsGroup = computed(
    () =>
      showAllSitesTabs.value ||
      downloadsGroupMatches.value ||
      visibleDownloadsSubcategories.value.length > 0,
  )

  const showSitesSection = computed(
    () =>
      showAllSitesTabs.value ||
      showAiGroup.value ||
      showDesignGroup.value ||
      showDevelopmentGroup.value ||
      showWatchGroup.value ||
      showDownloadsGroup.value,
  )

  const showSkillsSection = computed(
    () => showAllSkillsTabs.value || visibleSkillsNav.value.length > 0,
  )

  const showExtensionsSection = computed(
    () => showAllExtensionsTabs.value || visibleExtensionCategories.value.length > 0,
  )

  const visibleSkillsNav = computed(() =>
    filterSidebarItems(skillsNav, showAllSkillsTabs.value, 'Skills'),
  )

  const visibleExtensionCategories = computed(() =>
    filterSidebarItems(extensionCategories, showAllExtensionsTabs.value, 'Extensions'),
  )

  const visibleCompactSiteGroups = computed(() =>
    siteGroupNav.filter((group) => {
      if (group.group === 'ai') return showAiGroup.value
      if (group.group === 'design') return showDesignGroup.value
      if (group.group === 'development') return showDevelopmentGroup.value
      if (group.group === 'watch') return showWatchGroup.value
      return showDownloadsGroup.value
    }),
  )

  const totalSkillCount = computed(() =>
    visibleSkillsNav.value.reduce((total, item) => total + getSkillRouteCount(item.route), 0),
  )

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
    for (const cat of extensionCategories) {
      const key = cat.route.split('/').pop() || ''
      counts[cat.route] = extensionsStore.getExtensionsByParentCategory(key).length
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

  function getSiteGroupCount(group: SiteGroup | string) {
    return siteGroupCounts.value[group as SiteGroup]
  }

  function getSiteRouteCount(route: string) {
    return siteRouteCounts.value[route] ?? 0
  }

  function getSkillRouteCount(route: string) {
    return skillRouteCounts.value[route] ?? 0
  }

  function getExtensionRouteCount(route: string) {
    return extensionRouteCounts.value[route] ?? 0
  }

  const hasVisibleSidebarTabs = computed(
    () => showSitesSection.value || showExtensionsSection.value || showSkillsSection.value,
  )

  return {
    sidebarSearch,
    hasSidebarSearch,
    clearSidebarSearch,
    matchesSidebarSearch,
    filterSidebarItems,
    sitesSectionMatches,
    skillsSectionMatches,
    extensionsSectionMatches,
    showAllSitesTabs,
    showAllSkillsTabs,
    showAllExtensionsTabs,
    aiGroupMatches,
    designGroupMatches,
    developmentGroupMatches,
    watchGroupMatches,
    downloadsGroupMatches,
    visibleAiSubcategories,
    visibleDesignSubcategories,
    visibleDevelopmentSubcategories,
    visibleWatchSubcategories,
    visibleDownloadsSubcategories,
    showAiGroup,
    showDesignGroup,
    showDevelopmentGroup,
    showWatchGroup,
    showDownloadsGroup,
    showSitesSection,
    showSkillsSection,
    showExtensionsSection,
    visibleSkillsNav,
    visibleExtensionCategories,
    visibleCompactSiteGroups,
    totalSkillCount,
    siteGroupCounts,
    siteRouteCounts,
    skillRouteCounts,
    extensionRouteCounts,
    getSiteGroupCount,
    getSiteRouteCount,
    getSkillRouteCount,
    getExtensionRouteCount,
    hasVisibleSidebarTabs,
  }
}
