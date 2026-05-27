<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Activity,
  BrainCircuit,
  Bot,
  BookOpen,
  Box,
  ChevronRight,
  Code2,
  Component as ComponentIcon,
  Disc3,
  Download,
  FileText,
  Film,
  Gamepad2,
  GraduationCap,
  Github,
  Hammer,
  HardDriveDownload,
  Home,
  Image,
  Lightbulb,
  MessageSquare,
  Microscope,
  Package,
  Palette,
  Plug,
  Presentation,
  ScanSearch,
  Search,
  Send,
  Server,
  Shapes,
  ShieldCheck,
  Sparkles,
  Terminal,
  Type,
  Video,
  Workflow,
  Wrench,
  X,
} from 'lucide-vue-next'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'
import { useSitesStore } from '@/stores/sites'
import { useSkillsStore } from '@/stores/skills'
import SidebarAccountMenu from '@/components/auth/SidebarAccountMenu.vue'

const route = useRoute()
const admin = useAdminStore()
const auth = useAuthStore()
const sitesStore = useSitesStore()
const skillsStore = useSkillsStore()
const sidebarSearch = shallowRef('')
void sitesStore.loadSites()
void skillsStore.loadSkills()

type SiteGroup = 'ai' | 'design' | 'development' | 'watch' | 'downloads'

interface SidebarNavItem {
  name: string
  icon: typeof Server
  route: string
}

const expandedGroups = reactive<Record<SiteGroup, boolean>>({
  ai: true,
  design: true,
  development: true,
  watch: true,
  downloads: true,
})

const isSiteGroupRoute = (path: string, group: SiteGroup) => {
  return path === `/sites/${group}` || path.startsWith(`/sites/${group}/`)
}

const toggleGroup = (group: SiteGroup) => {
  expandedGroups[group] = !expandedGroups[group]
}

const isActive = (path: string, exact = true) => {
  return exact ? route.path === path : route.path === path || route.path.startsWith(`${path}/`)
}

watch(
  () => route.path,
  (path) => {
    if (isSiteGroupRoute(path, 'ai')) {
      expandedGroups.ai = true
    }

    if (isSiteGroupRoute(path, 'design')) {
      expandedGroups.design = true
    }

    if (isSiteGroupRoute(path, 'development')) {
      expandedGroups.development = true
    }

    if (isSiteGroupRoute(path, 'watch')) {
      expandedGroups.watch = true
    }

    if (isSiteGroupRoute(path, 'downloads')) {
      expandedGroups.downloads = true
    }
  },
  { immediate: true },
)

const isAiExpanded = computed(() => expandedGroups.ai)
const isDesignExpanded = computed(() => expandedGroups.design)
const isDevelopmentExpanded = computed(() => expandedGroups.development)
const isWatchExpanded = computed(() => expandedGroups.watch)
const isDownloadsExpanded = computed(() => expandedGroups.downloads)

const watchSubcategories = [
  { name: 'Movies', icon: Video, route: '/sites/watch/movies' },
  { name: 'Anime', icon: Sparkles, route: '/sites/watch/anime' },
]

const downloadsSubcategories = [
  { name: 'Game Download', icon: Gamepad2, route: '/sites/downloads/game-download' },
  { name: 'VFX Download', icon: Video, route: '/sites/downloads/vfx-download' },
  {
    name: 'Software Download',
    icon: HardDriveDownload,
    route: '/sites/downloads/software-download',
  },
  { name: 'Torrents', icon: Disc3, route: '/sites/downloads/torrents' },
  { name: 'Movies', icon: Film, route: '/sites/downloads/movies' },
]

const aiSubcategories = [
  { name: 'Image', icon: Image, route: '/sites/ai/image' },
  { name: 'API', icon: Plug, route: '/sites/ai/api' },
  { name: 'Detector', icon: ScanSearch, route: '/sites/ai/detector' },
  { name: 'Automation', icon: Workflow, route: '/sites/ai/automation' },
  { name: 'Video', icon: Video, route: '/sites/ai/video' },
  { name: 'Machine Learning', icon: BrainCircuit, route: '/sites/ai/ml' },
  { name: 'CHAT', icon: MessageSquare, route: '/sites/ai/chat' },
  { name: 'Website Development', icon: Hammer, route: '/sites/ai/wb' },
  { name: 'Research', icon: Microscope, route: '/sites/ai/research' },
  { name: 'PPT', icon: Presentation, route: '/sites/ai/ppt' },
  { name: 'Others', icon: Package, route: '/sites/ai/others' },
]

const designSubcategories = [
  { name: 'Inspiration', icon: Lightbulb, route: '/sites/design/inspiration' },
  { name: 'Fonts', icon: Type, route: '/sites/design/fonts' },
  { name: '3D', icon: Box, route: '/sites/design/3d' },
  { name: 'Prompts', icon: FileText, route: '/sites/design/prompts' },
  { name: 'ICONS/SVG', icon: Shapes, route: '/sites/design/icons-svg' },
  { name: 'MD', icon: BookOpen, route: '/sites/design/md' },
  { name: 'Design Tools', icon: Wrench, route: '/sites/design/design-tools' },
]

const developmentSubcategories = [
  { name: 'Cloud & Hosting', icon: Server, route: '/sites/development/cloud-hosting' },
  { name: 'Learning', icon: GraduationCap, route: '/sites/development/learning' },
  { name: 'References', icon: BookOpen, route: '/sites/development/references' },
  { name: 'Tooling', icon: Wrench, route: '/sites/development/tooling' },
  { name: 'CLI Tools', icon: Terminal, route: '/sites/development/cli-tools' },
  { name: 'UI Libraries', icon: ComponentIcon, route: '/sites/development/ui-libraries' },
  { name: 'Repositories', icon: Github, route: '/sites/development/repositories' },
  { name: 'MCP', icon: Plug, route: '/sites/development/mcp' },
  { name: 'Monitoring', icon: Activity, route: '/sites/development/monitoring' },
]

const skillsNav = [
  { name: 'Skills', icon: Sparkles, route: '/skills/skills' },
  { name: 'Design', icon: Palette, route: '/skills/design' },
]

const siteSubcategoryGroups = [
  { parentCategory: 'ai', items: aiSubcategories },
  { parentCategory: 'design', items: designSubcategories },
  { parentCategory: 'development', items: developmentSubcategories },
  { parentCategory: 'watch', items: watchSubcategories },
  { parentCategory: 'downloads', items: downloadsSubcategories },
] satisfies { parentCategory: SiteGroup; items: SidebarNavItem[] }[]

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

const getSiteGroupCount = (group: SiteGroup) => siteGroupCounts.value[group]
const getSiteRouteCount = (route: string) => siteRouteCounts.value[route] ?? 0
const getSkillRouteCount = (route: string) => skillRouteCounts.value[route] ?? 0

const sidebarSearchTerms = computed(() =>
  sidebarSearch.value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean),
)

const hasSidebarSearch = computed(() => sidebarSearchTerms.value.length > 0)

const matchesSidebarSearch = (label: string, route = '', parent = '') => {
  if (!hasSidebarSearch.value) return true

  const haystack = `${parent} ${label} ${route}`.toLowerCase().replace(/[^a-z0-9]+/g, ' ')

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

const visibleSkillsNav = computed(() =>
  filterSidebarItems(skillsNav, showAllSkillsTabs.value, 'Skills'),
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

const hasVisibleSidebarTabs = computed(() => showSitesSection.value || showSkillsSection.value)

const clearSidebarSearch = () => {
  sidebarSearch.value = ''
}

onMounted(() => {
  void auth.initialize()
})
</script>

<template>
  <aside
    class="flex h-full w-64 select-none flex-col overflow-visible border-r border-gray-800 bg-black"
  >
    <div class="relative z-[85] flex h-12 shrink-0 items-center border-b border-gray-800 px-2">
      <SidebarAccountMenu v-if="auth.isAuthenticated" />

      <RouterLink v-else to="/" class="flex items-center gap-2 px-2">
        <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M13 3L16.29 6.29L17.29 5.29L18.71 6.71L17.71 7.71L21 11V3H13ZM3 3V21H11V17.71L7.71 21H3ZM5 5L11 11V5H5ZM13 13V18L16.29 14.71L17.29 15.71L18.71 14.29L17.71 13.29L21 10V21H13V13Z"
          />
        </svg>
        <span class="font-bold text-sm tracking-tight text-white uppercase">Holy Grail</span>
      </RouterLink>
    </div>

    <div class="shrink-0 border-b border-gray-800 px-3 py-3">
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
          class="h-8 w-full rounded-md border border-gray-800 bg-zinc-950 px-8 text-xs font-medium text-white outline-none transition-colors placeholder:text-gray-600 focus:border-gray-600 focus:bg-black"
          @keydown.esc="clearSidebarSearch"
        />
        <button
          v-if="hasSidebarSearch"
          type="button"
          class="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-gray-500 transition-colors hover:bg-zinc-800 hover:text-white"
          aria-label="Clear sidebar search"
          @click="clearSidebarSearch"
        >
          <X class="h-3 w-3" />
        </button>
      </div>
    </div>

    <nav class="custom-scrollbar min-h-0 flex-1 overflow-y-auto pb-4 pt-1">
      <ul class="space-y-0.5 px-4">
        <template v-if="showSitesSection">
          <li v-if="showAiGroup">
            <button
              type="button"
              class="w-full flex items-center rounded-md text-left transition-colors group text-xs"
              :class="
                isActive('/sites/ai', false)
                  ? 'bg-zinc-900 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
              "
              :aria-expanded="isAiVisibleExpanded"
              aria-controls="sidebar-ai-branch"
              aria-label="Toggle AI sites"
              @click="toggleGroup('ai')"
            >
              <span class="min-w-0 flex-1 flex items-center gap-3 px-2 py-1.5">
                <Bot class="w-3.5 h-3.5 flex-shrink-0" />
                <span class="min-w-0 flex-1 truncate font-medium">AI</span>
                <span
                  class="shrink-0 rounded px-1.5 text-[10px] font-semibold tabular-nums"
                  :class="
                    isActive('/sites/ai', false)
                      ? 'text-zinc-300'
                      : 'text-gray-600 group-hover:text-gray-300'
                  "
                >
                  {{ getSiteGroupCount('ai') }}
                </span>
              </span>
              <ChevronRight
                class="mr-2 w-3 h-3 text-gray-600 transition-transform duration-200 ease-out group-hover:text-gray-300"
                :class="{ 'rotate-90': isAiVisibleExpanded }"
              />
            </button>
          </li>

          <Transition name="sidebar-group">
            <li
              v-if="isAiVisibleExpanded && visibleAiSubcategories.length > 0"
              id="sidebar-ai-branch"
              class="sidebar-group-shell"
            >
              <ul class="sidebar-group-inner ml-4 space-y-0.5">
                <li v-for="item in visibleAiSubcategories" :key="item.name">
                  <RouterLink
                    :to="item.route"
                    class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors group relative text-xs"
                    :class="
                      isActive(item.route)
                        ? 'bg-zinc-900 text-white'
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
                      {{ getSiteRouteCount(item.route) }}
                    </span>
                  </RouterLink>
                </li>
              </ul>
            </li>
          </Transition>

          <li v-if="showDesignGroup">
            <button
              type="button"
              class="w-full flex items-center rounded-md text-left transition-colors group text-xs"
              :class="
                isActive('/sites/design', false)
                  ? 'bg-zinc-900 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
              "
              :aria-expanded="isDesignVisibleExpanded"
              aria-controls="sidebar-design-branch"
              aria-label="Toggle design sites"
              @click="toggleGroup('design')"
            >
              <span class="min-w-0 flex-1 flex items-center gap-3 px-2 py-1.5">
                <Palette class="w-3.5 h-3.5 flex-shrink-0" />
                <span class="min-w-0 flex-1 truncate font-medium">Design</span>
                <span
                  class="shrink-0 rounded px-1.5 text-[10px] font-semibold tabular-nums"
                  :class="
                    isActive('/sites/design', false)
                      ? 'text-zinc-300'
                      : 'text-gray-600 group-hover:text-gray-300'
                  "
                >
                  {{ getSiteGroupCount('design') }}
                </span>
              </span>
              <ChevronRight
                class="mr-2 w-3 h-3 text-gray-600 transition-transform duration-200 ease-out group-hover:text-gray-300"
                :class="{ 'rotate-90': isDesignVisibleExpanded }"
              />
            </button>
          </li>

          <Transition name="sidebar-group">
            <li
              v-if="isDesignVisibleExpanded && visibleDesignSubcategories.length > 0"
              id="sidebar-design-branch"
              class="sidebar-group-shell"
            >
              <ul class="sidebar-group-inner ml-4 space-y-0.5">
                <li v-for="item in visibleDesignSubcategories" :key="item.name">
                  <RouterLink
                    :to="item.route"
                    class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors group relative text-xs"
                    :class="
                      isActive(item.route)
                        ? 'bg-zinc-900 text-white'
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
                      {{ getSiteRouteCount(item.route) }}
                    </span>
                  </RouterLink>
                </li>
              </ul>
            </li>
          </Transition>

          <li v-if="showDevelopmentGroup">
            <button
              type="button"
              class="w-full flex items-center rounded-md text-left transition-colors group text-xs"
              :class="
                isActive('/sites/development', false)
                  ? 'bg-zinc-900 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
              "
              :aria-expanded="isDevelopmentVisibleExpanded"
              aria-controls="sidebar-development-branch"
              aria-label="Toggle development sites"
              @click="toggleGroup('development')"
            >
              <span class="min-w-0 flex-1 flex items-center gap-3 px-2 py-1.5">
                <Code2 class="w-3.5 h-3.5 flex-shrink-0" />
                <span class="min-w-0 flex-1 truncate font-medium">Development</span>
                <span
                  class="shrink-0 rounded px-1.5 text-[10px] font-semibold tabular-nums"
                  :class="
                    isActive('/sites/development', false)
                      ? 'text-zinc-300'
                      : 'text-gray-600 group-hover:text-gray-300'
                  "
                >
                  {{ getSiteGroupCount('development') }}
                </span>
              </span>
              <ChevronRight
                class="mr-2 w-3 h-3 text-gray-600 transition-transform duration-200 ease-out group-hover:text-gray-300"
                :class="{ 'rotate-90': isDevelopmentVisibleExpanded }"
              />
            </button>
          </li>

          <Transition name="sidebar-group">
            <li
              v-if="isDevelopmentVisibleExpanded && visibleDevelopmentSubcategories.length > 0"
              id="sidebar-development-branch"
              class="sidebar-group-shell"
            >
              <ul class="sidebar-group-inner ml-4 space-y-0.5">
                <li v-for="item in visibleDevelopmentSubcategories" :key="item.name">
                  <RouterLink
                    :to="item.route"
                    class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors group relative text-xs"
                    :class="
                      isActive(item.route)
                        ? 'bg-zinc-900 text-white'
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
                      {{ getSiteRouteCount(item.route) }}
                    </span>
                  </RouterLink>
                </li>
              </ul>
            </li>
          </Transition>

          <li v-if="showWatchGroup">
            <button
              type="button"
              class="w-full flex items-center rounded-md text-left transition-colors group text-xs"
              :class="
                isActive('/sites/watch', false)
                  ? 'bg-zinc-900 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
              "
              :aria-expanded="isWatchVisibleExpanded"
              aria-controls="sidebar-watch-branch"
              aria-label="Toggle watch sites"
              @click="toggleGroup('watch')"
            >
              <span class="min-w-0 flex-1 flex items-center gap-3 px-2 py-1.5">
                <Film class="w-3.5 h-3.5 flex-shrink-0" />
                <span class="min-w-0 flex-1 truncate font-medium">Watch</span>
                <span
                  class="shrink-0 rounded px-1.5 text-[10px] font-semibold tabular-nums"
                  :class="
                    isActive('/sites/watch', false)
                      ? 'text-zinc-300'
                      : 'text-gray-600 group-hover:text-gray-300'
                  "
                >
                  {{ getSiteGroupCount('watch') }}
                </span>
              </span>
              <ChevronRight
                class="mr-2 w-3 h-3 text-gray-600 transition-transform duration-200 ease-out group-hover:text-gray-300"
                :class="{ 'rotate-90': isWatchVisibleExpanded }"
              />
            </button>
          </li>

          <Transition name="sidebar-group">
            <li
              v-if="isWatchVisibleExpanded && visibleWatchSubcategories.length > 0"
              id="sidebar-watch-branch"
              class="sidebar-group-shell"
            >
              <ul class="sidebar-group-inner ml-4 space-y-0.5">
                <li v-for="item in visibleWatchSubcategories" :key="item.name">
                  <RouterLink
                    :to="item.route"
                    class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors group relative text-xs"
                    :class="
                      isActive(item.route)
                        ? 'bg-zinc-900 text-white'
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
                      {{ getSiteRouteCount(item.route) }}
                    </span>
                  </RouterLink>
                </li>
              </ul>
            </li>
          </Transition>

          <li v-if="showDownloadsGroup">
            <button
              type="button"
              class="w-full flex items-center rounded-md text-left transition-colors group text-xs"
              :class="
                isActive('/sites/downloads', false)
                  ? 'bg-zinc-900 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-accent-500/10'
              "
              :aria-expanded="isDownloadsVisibleExpanded"
              aria-controls="sidebar-downloads-branch"
              aria-label="Toggle downloads sites"
              @click="toggleGroup('downloads')"
            >
              <span class="min-w-0 flex-1 flex items-center gap-3 px-2 py-1.5">
                <Download class="w-3.5 h-3.5 flex-shrink-0" />
                <span class="min-w-0 flex-1 truncate font-medium">Downloads</span>
                <span
                  class="shrink-0 rounded px-1.5 text-[10px] font-semibold tabular-nums"
                  :class="
                    isActive('/sites/downloads', false)
                      ? 'text-zinc-300'
                      : 'text-gray-600 group-hover:text-gray-300'
                  "
                >
                  {{ getSiteGroupCount('downloads') }}
                </span>
              </span>
              <ChevronRight
                class="mr-2 w-3 h-3 text-gray-600 transition-transform duration-200 ease-out group-hover:text-gray-300"
                :class="{ 'rotate-90': isDownloadsVisibleExpanded }"
              />
            </button>
          </li>

          <Transition name="sidebar-group">
            <li
              v-if="isDownloadsVisibleExpanded && visibleDownloadsSubcategories.length > 0"
              id="sidebar-downloads-branch"
              class="sidebar-group-shell"
            >
              <ul class="sidebar-group-inner ml-4 space-y-0.5">
                <li v-for="item in visibleDownloadsSubcategories" :key="item.name">
                  <RouterLink
                    :to="item.route"
                    class="w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors group relative text-xs"
                    :class="
                      isActive(item.route)
                        ? 'bg-zinc-900 text-white'
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
                      {{ getSiteRouteCount(item.route) }}
                    </span>
                  </RouterLink>
                </li>
              </ul>
            </li>
          </Transition>
        </template>

        <li v-if="showSkillsSection" :class="{ 'mt-6': showSitesSection }">
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
                    ? 'bg-zinc-900 text-white'
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

        <li v-if="!hasVisibleSidebarTabs" class="px-2 py-6 text-center">
          <p class="text-xs font-medium text-gray-500">No tabs match "{{ sidebarSearch }}".</p>
        </li>
      </ul>
    </nav>

    <div class="shrink-0 space-y-1 border-t border-gray-800 p-4">
      <RouterLink
        to="/"
        class="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-gray-400 transition-colors hover:bg-accent-500/10 hover:text-white"
        :class="isActive('/') ? 'bg-zinc-900 text-white' : ''"
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
        :class="isActive('/publish') || isActive('/submit') ? 'bg-zinc-900 text-white' : ''"
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
        v-if="admin.isAdmin"
        to="/admin"
        class="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white transition-colors group rounded-md hover:bg-accent-500/10"
        :class="isActive('/admin') ? 'bg-zinc-900 text-white' : ''"
      >
        <ShieldCheck class="w-4 h-4" />
        <span class="font-medium text-xs">Admin</span>
        <span
          v-if="admin.pendingCount > 0"
          class="ml-auto rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black"
        >
          {{ admin.pendingCount }}
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
  background: #1f2937;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #374151;
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
</style>
