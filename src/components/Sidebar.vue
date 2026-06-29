<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  onMounted,
  onUnmounted,
  reactive,
  shallowRef,
  watch,
} from 'vue'
import { useRoute } from 'vue-router'
import {
  Bot,
  ChevronRight,
  Code2,
  Download,
  Film,
  Home,
  Palette,
  Puzzle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  SquareChevronLeft,
  SquareChevronRight,
  X,
} from 'lucide-vue-next'
import { useDeferredAuthStatus } from '@/composables/useDeferredAuthStatus'
import { scheduleIdleTask } from '@/lib/idle'
import { useSitesStore } from '@/stores/sites'
import { useSkillsStore } from '@/stores/skills'
import { useExtensionsStore } from '@/stores/extensions'
import type { useAdminStore } from '@/stores/admin'
import {
  aiSubcategories,
  designSubcategories,
  developmentSubcategories,
  watchSubcategories,
  downloadsSubcategories,
  siteSubcategoryGroups,
  siteGroupNav,
  skillsNav,
  extensionCategories,
  isSiteGroupRoute,
  type SiteGroup,
} from '@/components/sidebar/sidebarNav'
import SidebarExpandedGroup from '@/components/sidebar/SidebarExpandedGroup.vue'
import SidebarRail from '@/components/sidebar/SidebarRail.vue'

type AdminStore = ReturnType<typeof useAdminStore>

const SidebarAccountMenu = defineAsyncComponent(
  () => import('@/components/auth/SidebarAccountMenu.vue'),
)

const route = useRoute()
const props = withDefaults(
  defineProps<{
    collapsed?: boolean
  }>(),
  {
    collapsed: false,
  },
)
const emit = defineEmits<{
  toggleCollapsed: []
  openSearch: []
}>()
const { isAuthenticated } = useDeferredAuthStatus()
const admin = shallowRef<AdminStore | null>(null)
const sitesStore = useSitesStore()
const skillsStore = useSkillsStore()
const extensionsStore = useExtensionsStore()
const sidebarSearch = shallowRef('')
void sitesStore.loadSites()
let cancelSkillsLoad: (() => void) | undefined
let cancelAdminLoad: (() => void) | undefined

const isCollapsed = computed(() => props.collapsed)
const sidebarToggleLabel = computed(() =>
  isCollapsed.value ? 'Expand sidebar' : 'Collapse sidebar',
)

const expandedGroups = reactive<Record<SiteGroup, boolean>>({
  ai: true,
  design: true,
  development: true,
  watch: true,
  downloads: true,
})

const isExtensionsExpanded = shallowRef(true)

const toggleGroup = (group: SiteGroup) => {
  expandedGroups[group] = !expandedGroups[group]
}

function toggleExtensions() {
  isExtensionsExpanded.value = !isExtensionsExpanded.value
}

const isActive = (path: string, exact = true) => {
  return exact ? route.path === path : route.path === path || route.path.startsWith(`${path}/`)
}

watch(
  () => route.path,
  (path) => {
    const groups: SiteGroup[] = ['ai', 'design', 'development', 'watch', 'downloads']
    for (const group of groups) {
      if (isSiteGroupRoute(path, group)) {
        expandedGroups[group] = true
      }
    }
  },
  { immediate: true },
)

const isAiExpanded = computed(() => expandedGroups.ai)
const isDesignExpanded = computed(() => expandedGroups.design)
const isDevelopmentExpanded = computed(() => expandedGroups.development)
const isWatchExpanded = computed(() => expandedGroups.watch)
const isDownloadsExpanded = computed(() => expandedGroups.downloads)

const siteGroupCounts = computed<Record<SiteGroup, number>>(() => ({
  ai: sitesStore.getSitesByParentCategory('ai').length,
  design: sitesStore.getSitesByParentCategory('design').length,
  development: sitesStore.getSitesByParentCategory('development').length,
  watch: sitesStore.getSitesByParentCategory('watch').length,
  downloads: sitesStore.getSitesByParentCategory('downloads').length,
}))

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

const isAdmin = computed(() => admin.value?.isAdmin ?? false)
const pendingAdminCount = computed(() => admin.value?.pendingCount ?? 0)

const getSiteGroupCount = (group: SiteGroup | string) => siteGroupCounts.value[group as SiteGroup]
const getSiteRouteCount = (route: string) => siteRouteCounts.value[route] ?? 0
const getSkillRouteCount = (route: string) => skillRouteCounts.value[route] ?? 0
const getExtensionRouteCount = (route: string) => extensionRouteCounts.value[route] ?? 0

const sidebarSearchTerms = computed(() =>
  sidebarSearch.value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean),
)

const hasSidebarSearch = computed(() => sidebarSearchTerms.value.length > 0)

const matchesSidebarSearch = (label: string, routePath = '', parent = '') => {
  if (!hasSidebarSearch.value) return true

  const haystack = `${parent} ${label} ${routePath}`.toLowerCase().replace(/[^a-z0-9]+/g, ' ')

  return sidebarSearchTerms.value.every((term) => haystack.includes(term))
}

const filterSidebarItems = <T extends { name: string; route: string }>(
  items: T[],
  showAll: boolean,
  parent = '',
) => {
  return showAll
    ? items
    : items.filter((item) => matchesSidebarSearch(item.name, item.route, parent))
}

const sitesSectionMatches = computed(() => hasSidebarSearch.value && matchesSidebarSearch('Sites'))
const skillsSectionMatches = computed(
  () => hasSidebarSearch.value && matchesSidebarSearch('Skills'),
)
const showAllSitesTabs = computed(() => !hasSidebarSearch.value || sitesSectionMatches.value)
const showAllSkillsTabs = computed(() => !hasSidebarSearch.value || skillsSectionMatches.value)
const extensionsSectionMatches = computed(
  () => hasSidebarSearch.value && matchesSidebarSearch('Extensions'),
)

const visibleSkillsNav = computed(() =>
  filterSidebarItems(skillsNav, showAllSkillsTabs.value, 'Skills'),
)

const showAllExtensionsTabs = computed(
  () => !hasSidebarSearch.value || extensionsSectionMatches.value,
)

const visibleExtensionCategories = computed(() =>
  filterSidebarItems(extensionCategories, showAllExtensionsTabs.value, 'Extensions'),
)

const aiGroupMatches = computed(
  () => hasSidebarSearch.value && matchesSidebarSearch('AI', '/sites/ai', 'Sites'),
)
const designGroupMatches = computed(
  () => hasSidebarSearch.value && matchesSidebarSearch('Design', '/sites/design', 'Sites'),
)
const developmentGroupMatches = computed(
  () => hasSidebarSearch.value && matchesSidebarSearch('Development', '/sites/development', 'Sites'),
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
    showAllSitesTabs.value || watchGroupMatches.value || visibleWatchSubcategories.value.length > 0,
)
const showDownloadsGroup = computed(
  () =>
    showAllSitesTabs.value ||
    downloadsGroupMatches.value ||
    visibleDownloadsSubcategories.value.length > 0,
)

const isAiVisibleExpanded = computed(
  () => showAiGroup.value && (isAiExpanded.value || hasSidebarSearch.value),
)
const isDesignVisibleExpanded = computed(
  () => showDesignGroup.value && (isDesignExpanded.value || hasSidebarSearch.value),
)
const isDevelopmentVisibleExpanded = computed(
  () => showDevelopmentGroup.value && (isDevelopmentExpanded.value || hasSidebarSearch.value),
)
const isWatchVisibleExpanded = computed(
  () => showWatchGroup.value && (isWatchExpanded.value || hasSidebarSearch.value),
)
const isDownloadsVisibleExpanded = computed(
  () => showDownloadsGroup.value && (isDownloadsExpanded.value || hasSidebarSearch.value),
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

const hasVisibleSidebarTabs = computed(
  () => showSitesSection.value || showExtensionsSection.value || showSkillsSection.value,
)

function clearSidebarSearch() {
  sidebarSearch.value = ''
}

function toggleSidebarCollapsed() {
  emit('toggleCollapsed')
}

function openSearchFromRail() {
  emit('openSearch')
}

watch(
  () => props.collapsed,
  (collapsed) => {
    if (collapsed) {
      clearSidebarSearch()
    }
  },
)

function loadSkillsCounts() {
  void skillsStore.loadSkills()
}

async function loadAdminStore() {
  if (!isAuthenticated.value || admin.value) return

  const { useAdminStore } = await import('@/stores/admin')
  const adminStore = useAdminStore()
  admin.value = adminStore

  if (adminStore.isAdmin) {
    void adminStore.loadSubmissions('pending')
  }
}

watch(
  () => route.path,
  (path) => {
    if (!path.startsWith('/skills')) return

    cancelSkillsLoad?.()
    loadSkillsCounts()
  },
)

watch(isAuthenticated, (authenticated) => {
  cancelAdminLoad?.()

  if (!authenticated) {
    admin.value = null
    return
  }

  cancelAdminLoad = scheduleIdleTask(
    () => {
      void loadAdminStore()
    },
    {
      delay: 1500,
      timeout: 5000,
    },
  )
})

onMounted(() => {
  if (route.path.startsWith('/skills')) {
    loadSkillsCounts()
  } else {
    cancelSkillsLoad = scheduleIdleTask(loadSkillsCounts, {
      delay: 5000,
      timeout: 9000,
    })
  }

  if (route.path.startsWith('/extensions')) {
    void extensionsStore.loadExtensions()
  } else {
    void scheduleIdleTask(() => extensionsStore.loadExtensions(), {
      delay: 6000,
      timeout: 10000,
    })
  }
})

onUnmounted(() => {
  cancelAdminLoad?.()
  cancelSkillsLoad?.()
})
</script>

<template>
  <aside
    class="app-sidebar flex h-full w-full select-none flex-col overflow-visible border-r border-gray-800 bg-[#1f1f1f]"
    :class="{ 'app-sidebar--collapsed': isCollapsed }"
  >
    <!-- Header -->
    <div
      class="relative z-[85] flex h-12 shrink-0 items-center border-b border-gray-800"
      :class="isCollapsed ? 'justify-center px-2' : 'gap-1 px-2'"
    >
      <template v-if="!isCollapsed">
        <SidebarAccountMenu v-if="isAuthenticated" />

        <RouterLink
          v-else
          to="/"
          class="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-white transition-colors hover:bg-accent-500/10"
          aria-label="Holy Grail home"
        >
          <svg class="h-5 w-5 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M13 3L16.29 6.29L17.29 5.29L18.71 6.71L17.71 7.71L21 11V3H13ZM3 3V21H11V17.71L7.71 21H3ZM5 5L11 11V5H5ZM13 13V18L16.29 14.71L17.29 15.71L18.71 14.29L17.71 13.29L21 10V21H13V13Z"
            />
          </svg>
          <span class="truncate text-sm font-bold tracking-tight uppercase"> Holy Grail </span>
        </RouterLink>
      </template>

      <button
        type="button"
        class="sidebar-collapse-button"
        :aria-label="sidebarToggleLabel"
        :title="sidebarToggleLabel"
        @click="toggleSidebarCollapsed"
      >
        <SquareChevronRight v-if="isCollapsed" class="h-4 w-4" />
        <SquareChevronLeft v-else class="h-4 w-4" />
      </button>
    </div>

    <!-- Search bar (expanded only) -->
    <div v-if="!isCollapsed" class="shrink-0 border-b border-gray-800 px-3 py-3">
      <label class="sr-only" for="sidebar-tab-search">Search sidebar tabs</label>
      <div class="relative">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500"
        />
        <input
          id="sidebar-tab-search"
          v-model="sidebarSearch"
          type="search"
          autocomplete="off"
          spellcheck="false"
          placeholder="Search tabs"
          class="h-8 w-full rounded-md border border-gray-800 bg-[#1f1f1f] px-8 text-xs font-medium text-white outline-none transition-colors placeholder:text-gray-600 focus:border-gray-600 focus:bg-[#1f1f1f]"
          @keydown.esc="clearSidebarSearch"
        />
        <button
          v-if="hasSidebarSearch"
          type="button"
          class="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-gray-500 transition-colors hover:bg-[#1f1f1f] hover:text-white"
          aria-label="Clear sidebar search"
          @click="clearSidebarSearch"
        >
          <X class="h-3 w-3" />
        </button>
      </div>
    </div>

    <!-- Collapsed rail view -->
    <SidebarRail
      v-if="isCollapsed"
      :groups="visibleCompactSiteGroups"
      :is-active="isActive"
      :get-group-count="getSiteGroupCount"
      :get-item-count="getSiteRouteCount"
      :show-extensions-section="showExtensionsSection"
      :show-skills-section="showSkillsSection"
      :extension-categories="visibleExtensionCategories"
      :skills-nav="visibleSkillsNav"
      :total-skill-count="totalSkillCount"
      @open-search="openSearchFromRail"
    />

    <!-- Expanded tree view -->
    <nav v-else class="custom-scrollbar min-h-0 flex-1 overflow-y-auto pb-4 pt-1">
      <ul class="space-y-0.5 px-4">
        <template v-if="showSitesSection">
          <SidebarExpandedGroup
            :icon="Bot"
            name="AI"
            route="/sites/ai"
            group="ai"
            :is-expanded="isAiVisibleExpanded"
            :is-group-active="isActive('/sites/ai', false)"
            :visible-items="visibleAiSubcategories"
            :show-group="showAiGroup"
            :get-group-count="getSiteGroupCount"
            :get-item-count="getSiteRouteCount"
            :is-item-active="(r: string) => isActive(r)"
            @toggle="toggleGroup('ai')"
          />

          <SidebarExpandedGroup
            :icon="Palette"
            name="Design"
            route="/sites/design"
            group="design"
            :is-expanded="isDesignVisibleExpanded"
            :is-group-active="isActive('/sites/design', false)"
            :visible-items="visibleDesignSubcategories"
            :show-group="showDesignGroup"
            :get-group-count="getSiteGroupCount"
            :get-item-count="getSiteRouteCount"
            :is-item-active="(r: string) => isActive(r)"
            @toggle="toggleGroup('design')"
          />

          <SidebarExpandedGroup
            :icon="Code2"
            name="Development"
            route="/sites/development"
            group="development"
            :is-expanded="isDevelopmentVisibleExpanded"
            :is-group-active="isActive('/sites/development', false)"
            :visible-items="visibleDevelopmentSubcategories"
            :show-group="showDevelopmentGroup"
            :get-group-count="getSiteGroupCount"
            :get-item-count="getSiteRouteCount"
            :is-item-active="(r: string) => isActive(r)"
            @toggle="toggleGroup('development')"
          />

          <SidebarExpandedGroup
            :icon="Film"
            name="Watch"
            route="/sites/watch"
            group="watch"
            :is-expanded="isWatchVisibleExpanded"
            :is-group-active="isActive('/sites/watch', false)"
            :visible-items="visibleWatchSubcategories"
            :show-group="showWatchGroup"
            :get-group-count="getSiteGroupCount"
            :get-item-count="getSiteRouteCount"
            :is-item-active="(r: string) => isActive(r)"
            @toggle="toggleGroup('watch')"
          />

          <SidebarExpandedGroup
            :icon="Download"
            name="Downloads"
            route="/sites/downloads"
            group="downloads"
            :is-expanded="isDownloadsVisibleExpanded"
            :is-group-active="isActive('/sites/downloads', false)"
            :visible-items="visibleDownloadsSubcategories"
            :show-group="showDownloadsGroup"
            :get-group-count="getSiteGroupCount"
            :get-item-count="getSiteRouteCount"
            :is-item-active="(r: string) => isActive(r)"
            @toggle="toggleGroup('downloads')"
          />
        </template>

        <!-- Extensions section -->
        <li v-if="showExtensionsSection" :class="{ 'mt-6': showSitesSection }">
          <button
            type="button"
            class="w-full flex items-center rounded-md text-left transition-colors group text-xs"
            :class="
              isActive('/extensions', false)
                ? 'bg-[#1f1f1f] text-white'
                : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
            "
            :aria-expanded="isExtensionsExpanded"
            aria-controls="sidebar-extensions-branch"
            aria-label="Toggle extensions"
            @click="toggleExtensions"
          >
            <span class="min-w-0 flex-1 flex items-center gap-3 px-2 py-1.5">
              <Puzzle class="w-3.5 h-3.5 flex-shrink-0" />
              <span class="min-w-0 flex-1 truncate font-semibold uppercase tracking-wider"
                >Extensions</span
              >
            </span>
            <ChevronRight
              class="mr-2 w-3 h-3 text-gray-600 transition-transform duration-200 ease-out group-hover:text-gray-300"
              :class="{ 'rotate-90': isExtensionsExpanded }"
            />
          </button>

          <Transition name="sidebar-group">
            <li
              v-if="isExtensionsExpanded && visibleExtensionCategories.length > 0"
              id="sidebar-extensions-branch"
              class="sidebar-group-shell"
            >
              <ul class="sidebar-group-inner ml-4 space-y-0.5">
                <li v-for="item in visibleExtensionCategories" :key="item.name">
                  <RouterLink
                    :to="item.route"
                    class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors group relative text-xs"
                    :class="
                      isActive(item.route)
                        ? 'bg-[#1f1f1f] text-white'
                        : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
                    "
                  >
                    <div
                      v-if="isActive(item.route)"
                      class="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-white"
                    ></div>
                    <component :is="item.icon" class="w-3.5 h-3.5" />
                    <span class="min-w-0 flex-1 truncate font-medium">{{ item.name }}</span>
                    <span
                      class="ml-auto shrink-0 rounded px-1.5 text-[10px] font-semibold tabular-nums"
                      :class="
                        isActive(item.route)
                          ? 'text-zinc-300'
                          : 'text-gray-600 group-hover:text-gray-300'
                      "
                    >
                      {{ getExtensionRouteCount(item.route) }}
                    </span>
                  </RouterLink>
                </li>
              </ul>
            </li>
          </Transition>
        </li>

        <!-- Skills section -->
        <li v-if="showSkillsSection" :class="{ 'mt-6': showSitesSection || showExtensionsSection }">
          <div class="w-full flex items-center gap-3 text-gray-500 py-2">
            <Sparkles class="w-4 h-4" />
            <span class="text-xs font-semibold uppercase tracking-wider">Skills</span>
          </div>

          <ul class="ml-4 space-y-0.5">
            <li v-for="item in visibleSkillsNav" :key="item.name">
              <RouterLink
                :to="item.route"
                class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors group relative text-xs"
                :class="
                  isActive(item.route)
                    ? 'bg-[#1f1f1f] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
                "
              >
                <div
                  v-if="isActive(item.route)"
                  class="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-white"
                ></div>
                <component :is="item.icon" class="w-3.5 h-3.5" />
                <span class="min-w-0 flex-1 truncate font-medium">{{ item.name }}</span>
                <span
                  class="ml-auto shrink-0 rounded px-1.5 text-[10px] font-semibold tabular-nums"
                  :class="
                    isActive(item.route)
                      ? 'text-zinc-300'
                      : 'text-gray-600 group-hover:text-gray-300'
                  "
                >
                  {{ getSkillRouteCount(item.route) }}
                </span>
              </RouterLink>
            </li>
          </ul>
        </li>

        <!-- Empty state -->
        <li v-if="!hasVisibleSidebarTabs" class="px-2 py-6 text-center">
          <p class="text-xs font-medium text-gray-500">No tabs match "{{ sidebarSearch }}".</p>
        </li>
      </ul>
    </nav>

    <!-- Footer (collapsed) -->
    <div v-if="isCollapsed" class="shrink-0 space-y-1 border-t border-gray-800 p-2">
      <RouterLink
        to="/"
        class="sidebar-rail-button"
        :class="
          isActive('/') ? 'text-white' : 'text-gray-400 hover:bg-accent-500/10 hover:text-white'
        "
        aria-label="Home"
      >
        <span
          v-if="isActive('/')"
          class="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-white"
        ></span>
        <Home class="h-4 w-4" />
        <span class="sidebar-rail-tooltip">Home</span>
      </RouterLink>

      <RouterLink
        to="/publish"
        class="sidebar-rail-button"
        :class="
          isActive('/publish') || isActive('/submit')
            ? 'text-white'
            : 'text-gray-400 hover:bg-accent-500/10 hover:text-white'
        "
        aria-label="Publish"
      >
        <span
          v-if="isActive('/publish') || isActive('/submit')"
          class="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-white"
        ></span>
        <Send class="h-4 w-4" />
        <span class="sidebar-rail-tooltip">Publish</span>
      </RouterLink>

      <RouterLink
        v-if="isAdmin"
        to="/admin"
        class="sidebar-rail-button"
        :class="
          isActive('/admin')
            ? 'text-white'
            : 'text-gray-400 hover:bg-accent-500/10 hover:text-white'
        "
        aria-label="Admin"
      >
        <span
          v-if="isActive('/admin')"
          class="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-white"
        ></span>
        <ShieldCheck class="h-4 w-4" />
        <span
          v-if="pendingAdminCount > 0"
          class="absolute -right-0.5 -top-0.5 h-4 min-w-[1rem] rounded-full bg-amber-500 px-1 text-center text-[9px] font-bold leading-4 text-[#1f1f1f]"
        >
          {{ pendingAdminCount }}
        </span>
        <span class="sidebar-rail-tooltip">Admin</span>
      </RouterLink>
    </div>

    <!-- Footer (expanded) -->
    <div v-else class="shrink-0 space-y-1 border-t border-gray-800 p-4">
      <RouterLink
        to="/"
        class="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-gray-400 transition-colors hover:bg-accent-500/10 hover:text-white"
        :class="isActive('/') ? 'bg-[#1f1f1f] text-white' : ''"
      >
        <Home
          class="h-4 w-4 transition-colors"
          :class="isActive('/') ? 'text-accent-400' : 'text-gray-500 group-hover:text-accent-400'"
        />
        <span class="text-xs font-medium">Home</span>
      </RouterLink>

      <RouterLink
        to="/publish"
        class="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-gray-400 transition-colors hover:bg-accent-500/10 hover:text-white"
        :class="isActive('/publish') || isActive('/submit') ? 'bg-[#1f1f1f] text-white' : ''"
      >
        <Send
          class="h-4 w-4 transition-colors"
          :class="
            isActive('/publish') || isActive('/submit')
              ? 'text-accent-400'
              : 'text-accent-500 group-hover:text-accent-400'
          "
        />
        <span class="text-xs font-medium">Publish</span>
      </RouterLink>

      <RouterLink
        v-if="isAdmin"
        to="/admin"
        class="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white transition-colors group rounded-md hover:bg-accent-500/10"
        :class="isActive('/admin') ? 'bg-[#1f1f1f] text-white' : ''"
      >
        <ShieldCheck class="w-4 h-4" />
        <span class="font-medium text-xs">Admin</span>
        <span
          v-if="pendingAdminCount > 0"
          class="ml-auto rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-[#1f1f1f]"
        >
          {{ pendingAdminCount }}
        </span>
      </RouterLink>
    </div>
  </aside>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1f1f1f;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #374151;
}

.sidebar-collapse-button {
  display: inline-flex;
  height: 2rem;
  width: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: 1px solid #1f1f1f;
  color: #6b7280;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease;
}

.sidebar-collapse-button:hover,
.sidebar-collapse-button:focus-visible {
  border-color: #374151;
  background: rgba(255, 140, 26, 0.1);
  color: #ffffff;
  outline: none;
}

.sidebar-rail-button {
  position: relative;
  display: flex;
  height: 2.25rem;
  width: 100%;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.sidebar-rail-button:focus-visible {
  outline: 1px solid #ff8c1a;
  outline-offset: 2px;
}

.sidebar-rail-button--plain {
  color: #6b7280;
}

.sidebar-rail-group {
  position: relative;
}

.sidebar-rail-group:hover > .sidebar-rail-button,
.sidebar-rail-group:has(:focus-visible) > .sidebar-rail-button {
  background: rgba(255, 140, 26, 0.1);
  color: #ffffff;
}

.sidebar-rail-tooltip {
  pointer-events: none;
  position: absolute;
  left: calc(100% + 0.5rem);
  top: 50%;
  z-index: 105;
  transform: translate(-0.25rem, -50%);
  visibility: hidden;
  white-space: nowrap;
  border-radius: 0.375rem;
  border: 1px solid #374151;
  background: #1f1f1f;
  padding: 0.35rem 0.5rem;
  color: #e5e7eb;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  opacity: 0;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.42);
  transition:
    opacity 140ms ease,
    transform 140ms ease,
    visibility 140ms ease;
}

.sidebar-rail-button:hover .sidebar-rail-tooltip,
.sidebar-rail-button:focus-visible .sidebar-rail-tooltip {
  transform: translate(0, -50%);
  visibility: visible;
  opacity: 1;
}

.sidebar-rail-flyout {
  pointer-events: none;
  position: absolute;
  left: 100%;
  top: 0;
  z-index: 100;
  width: 16rem;
  transform: translateX(-0.25rem);
  visibility: hidden;
  overflow: hidden;
  border: 1px solid #1f1f1f;
  border-radius: 0.5rem;
  background: #1f1f1f;
  opacity: 0;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.46);
  transition:
    opacity 160ms ease,
    transform 160ms ease,
    visibility 160ms ease;
}

.sidebar-rail-group:hover .sidebar-rail-flyout,
.sidebar-rail-group:has(:focus-visible) .sidebar-rail-flyout {
  pointer-events: auto;
  transform: translateX(0);
  visibility: visible;
  opacity: 1;
}

.sidebar-flyout-link {
  display: flex;
  min-height: 2rem;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.375rem;
  padding: 0.5rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  transition:
    background-color 150ms ease,
    color 150ms ease;
}

.sidebar-flyout-link:focus-visible {
  outline: 1px solid #ff8c1a;
  outline-offset: 2px;
}

.sidebar-group-shell {
  display: grid;
  grid-template-rows: 1fr;
  overflow: hidden;
}

.sidebar-group-inner {
  min-height: 0;
  overflow: hidden;
}

.sidebar-group-enter-active,
.sidebar-group-leave-active {
  transition:
    grid-template-rows 180ms ease,
    opacity 160ms ease,
    transform 180ms ease;
}

.sidebar-group-enter-from,
.sidebar-group-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
  transform: translateY(-4px);
}

.sidebar-group-enter-to,
.sidebar-group-leave-from {
  grid-template-rows: 1fr;
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-collapse-button,
  .sidebar-rail-button,
  .sidebar-rail-tooltip,
  .sidebar-rail-flyout,
  .sidebar-flyout-link,
  .sidebar-group-enter-active,
  .sidebar-group-leave-active {
    transition: none;
  }
}
</style>
